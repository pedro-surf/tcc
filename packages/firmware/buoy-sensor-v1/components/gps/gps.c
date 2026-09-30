#include "gps.h"
#include "config.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"

#include <math.h>
#include <stdlib.h>
#include <string.h>

#if ENABLE_GPS
#include "driver/uart.h"
#include <stdint.h>
#endif

static const char *TAG = "gps";

static gps_fix_t s_fix;
static SemaphoreHandle_t s_lock;

#if ENABLE_GPS

#if GPS_HOLD_ENABLE
static gps_fix_t s_published;
static bool s_have_published;
#endif

#define GPS_UART_NUM     UART_NUM_2
#define GPS_RX_BUF_SIZE  1024
#define GPS_LINE_MAX     128

static bool nmea_checksum_ok(const char *line)
{
    if (line[0] != '$') {
        return false;
    }
    const char *star = strrchr(line, '*');
    if (!star || star - line < 2) {
        return false;
    }

    uint8_t cs = 0;
    for (const char *p = line + 1; p < star; p++) {
        cs ^= (uint8_t)*p;
    }

    char *end = NULL;
    unsigned int claimed = (unsigned int)strtoul(star + 1, &end, 16);
    return end != star + 1 && cs == (uint8_t)claimed;
}

/* NMEA lat/lon is ddmm.mmmm (lat) / dddmm.mmmm (lon), not decimal degrees. */
static float nmea_to_deg(const char *ddmm, char hemi)
{
    if (!ddmm || ddmm[0] == '\0') {
        return 0.0f;
    }
    double v = atof(ddmm);
    int deg = (int)(v / 100.0);
    double minutes = v - (deg * 100.0);
    double dec = deg + minutes / 60.0;
    if (hemi == 'S' || hemi == 'W') {
        dec = -dec;
    }
    return (float)dec;
}

/* Keep empty fields (strtok would collapse ",,"). Stops at '*'. */
static int split_commas(char *line, char *fields[], int max_fields)
{
    int n = 0;
    fields[n++] = line;
    for (char *p = line; *p && n < max_fields; p++) {
        if (*p == '*') {
            *p = '\0';
            break;
        }
        if (*p == ',') {
            *p = '\0';
            fields[n++] = p + 1;
        }
    }
    return n;
}

static bool parse_gga(const char *line, gps_fix_t *out)
{
    if (!nmea_checksum_ok(line)) {
        return false;
    }
    if (strncmp(line, "$GPGGA", 6) != 0 && strncmp(line, "$GNGGA", 6) != 0) {
        return false;
    }

    char buf[GPS_LINE_MAX];
    strncpy(buf, line, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\0';

    char *f[16] = {0};
    if (split_commas(buf, f, 16) < 10) {
        return false;
    }

    char hemi_ns = (f[3] && f[3][0]) ? f[3][0] : '\0';
    char hemi_ew = (f[5] && f[5][0]) ? f[5][0] : '\0';

    out->lat = nmea_to_deg(f[2], hemi_ns);
    out->lon = nmea_to_deg(f[4], hemi_ew);
    out->fix = f[6] ? atoi(f[6]) : 0;
    out->sat = f[7] ? atoi(f[7]) : 0;
    out->hdop = (f[8] && f[8][0]) ? (float)atof(f[8]) : 99.0f;
    out->alt = f[9] ? (float)atof(f[9]) : 0.0f;
    out->valid = (out->fix > 0 && out->lat != 0.0f && out->lon != 0.0f);
    return true;
}

#if GPS_HOLD_ENABLE
static float meters_between(float lat1, float lon1, float lat2, float lon2)
{
    const float meters_per_deg = 111320.0f;
    float mid = ((lat1 + lat2) * 0.5f) * (3.14159265f / 180.0f);
    float dlat = (lat2 - lat1) * meters_per_deg;
    float dlon = (lon2 - lon1) * meters_per_deg * cosf(mid);
    return sqrtf(dlat * dlat + dlon * dlon);
}
#endif

/* Publish a new point only when it clears the current accuracy bubble. */
static gps_fix_t gate_fix(const gps_fix_t *raw)
{
#if !GPS_HOLD_ENABLE
    return *raw;
#else
    if (!raw->valid) {
        gps_fix_t lost = s_have_published ? s_published : (gps_fix_t){0};
        lost.fix = 0;
        lost.valid = false;
        lost.sat = raw->sat;
        lost.hdop = raw->hdop;
        return lost;
    }

    float gate = raw->hdop * GPS_HDOP_METERS;
    if (gate < GPS_MIN_ACCURACY_M) {
        gate = GPS_MIN_ACCURACY_M;
    }

    if (!s_have_published) {
        s_published = *raw;
        s_have_published = true;
        ESP_LOGI(TAG, "lock lat=%.6f lon=%.6f sat=%d hdop=%.1f gate=%.0fm",
                 raw->lat, raw->lon, raw->sat, raw->hdop, gate);
        return *raw;
    }

    float moved = meters_between(s_published.lat, s_published.lon, raw->lat, raw->lon);
    if (moved < gate) {
        gps_fix_t held = s_published;
        held.sat = raw->sat;
        held.fix = raw->fix;
        held.alt = raw->alt;
        held.hdop = raw->hdop;
        held.valid = true;
        return held;
    }

    ESP_LOGI(TAG, "move %.0fm (gate %.0fm hdop %.1f sat %d)",
             moved, gate, raw->hdop, raw->sat);
    s_published = *raw;
    return *raw;
#endif
}

static int read_line(char *out, size_t out_len, TickType_t timeout)
{
    size_t n = 0;
    while (n + 1 < out_len) {
        uint8_t ch;
        int r = uart_read_bytes(GPS_UART_NUM, &ch, 1, timeout);
        if (r <= 0) {
            return n ? (int)n : -1;
        }
        if (ch == '\n') {
            break;
        }
        if (ch == '\r') {
            continue;
        }
        out[n++] = (char)ch;
    }
    out[n] = '\0';
    return (int)n;
}

static void gps_task(void *arg)
{
    (void)arg;
    char line[GPS_LINE_MAX];
    bool saw_nmea = false;
    int last_fix = -1;

    while (1) {
        int n = read_line(line, sizeof(line), pdMS_TO_TICKS(1500));
        if (n < 6) {
            continue;
        }

        gps_fix_t parsed = {0};
        if (!parse_gga(line, &parsed)) {
            continue;
        }

        if (!saw_nmea) {
            ESP_LOGI(TAG, "NMEA GGA ok");
            saw_nmea = true;
        }
        if (parsed.fix != last_fix) {
            ESP_LOGI(TAG, "fix=%d sat=%d hdop=%.1f lat=%.6f lon=%.6f alt=%.1f",
                     parsed.fix, parsed.sat, parsed.hdop,
                     parsed.lat, parsed.lon, parsed.alt);
            last_fix = parsed.fix;
        }

        gps_fix_t published = gate_fix(&parsed);
        xSemaphoreTake(s_lock, portMAX_DELAY);
        s_fix = published;
        xSemaphoreGive(s_lock);
    }
}

static esp_err_t uart_init(void)
{
    uart_config_t cfg = {
        .baud_rate = GPS_UART_BAUD,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };

    esp_err_t err = uart_driver_install(GPS_UART_NUM, GPS_RX_BUF_SIZE * 2, 0, 0, NULL, 0);
    if (err != ESP_OK) {
        return err;
    }
    err = uart_param_config(GPS_UART_NUM, &cfg);
    if (err != ESP_OK) {
        return err;
    }
    return uart_set_pin(GPS_UART_NUM, GPS_UART_TX_PIN, GPS_UART_RX_PIN,
                        UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);
}

#endif /* ENABLE_GPS */

bool gps_init(void)
{
#if !ENABLE_GPS
    ESP_LOGI(TAG, "disabled (ENABLE_GPS=0)");
    return true;
#else
    if (s_lock) {
        return true;
    }

    s_lock = xSemaphoreCreateMutex();
    if (!s_lock) {
        ESP_LOGE(TAG, "mutex alloc failed");
        return false;
    }

    esp_err_t err = uart_init();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "UART2 init failed: %s", esp_err_to_name(err));
        vSemaphoreDelete(s_lock);
        s_lock = NULL;
        return false;
    }

    ESP_LOGI(TAG, "UART2 %d baud RX=%d TX=%d (module TX→RX, RX→TX)",
             GPS_UART_BAUD, GPS_UART_RX_PIN, GPS_UART_TX_PIN);

    BaseType_t ok = xTaskCreate(gps_task, "gps", 3072, NULL, 4, NULL);
    if (ok != pdPASS) {
        ESP_LOGE(TAG, "gps task create failed");
        return false;
    }
    return true;
#endif
}

void gps_get(gps_fix_t *out)
{
    if (!out) {
        return;
    }
    if (!s_lock) {
        *out = (gps_fix_t){0};
        return;
    }
    xSemaphoreTake(s_lock, portMAX_DELAY);
    *out = s_fix;
    xSemaphoreGive(s_lock);
}
