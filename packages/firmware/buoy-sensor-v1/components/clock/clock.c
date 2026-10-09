#include "clock.h"
#include "config.h"

#include "esp_log.h"
#include "esp_sntp.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/time.h>
#include <time.h>

static const char *TAG = "clock";

static volatile bool s_set;
static volatile clock_source_t s_source;
static bool s_sntp_started;

const char *clock_source_name(clock_source_t source)
{
    switch (source) {
    case CLOCK_SOURCE_WIFI:
        return "wifi";
    case CLOCK_SOURCE_UART:
        return "uart";
    default:
        return "none";
    }
}

bool clock_is_set(void)
{
    return s_set;
}

clock_source_t clock_source(void)
{
    return s_source;
}

int64_t clock_unix_ms(void)
{
    if (!s_set) {
        return 0;
    }
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (int64_t)tv.tv_sec * 1000 + tv.tv_usec / 1000;
}

static void log_now(clock_source_t source)
{
    time_t sec = time(NULL);
    struct tm tm;
    gmtime_r(&sec, &tm);
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tm);
    ESP_LOGI(TAG, "time set via %s: %s", clock_source_name(source), buf);
}

static void mark_set(clock_source_t source)
{
    s_source = source;
    s_set = true;
    log_now(source);
}

static void sntp_synced(struct timeval *tv)
{
    (void)tv;
    mark_set(CLOCK_SOURCE_WIFI);
}

void clock_start_sntp(void)
{
    if (s_sntp_started) {
        return;
    }
    s_sntp_started = true;

    esp_sntp_setoperatingmode(ESP_SNTP_OPMODE_POLL);
    esp_sntp_setservername(0, CLOCK_NTP_SERVER);
    esp_sntp_set_time_sync_notification_cb(sntp_synced);
    esp_sntp_init();
    ESP_LOGI(TAG, "SNTP started (%s)", CLOCK_NTP_SERVER);
}

static bool set_unix_seconds(time_t sec, clock_source_t source)
{
    if (sec < 1700000000) {
        return false;
    }
    struct timeval tv = {
        .tv_sec = sec,
        .tv_usec = 0,
    };
    if (settimeofday(&tv, NULL) != 0) {
        ESP_LOGE(TAG, "settimeofday failed");
        return false;
    }
    mark_set(source);
    return true;
}

/* Days from civil date to Unix seconds. UTC, no libc timezone. */
static int64_t civil_to_unix(int year, int month, int day, int hour, int min, int sec)
{
    year -= month <= 2;
    const int era = (year >= 0 ? year : year - 399) / 400;
    const unsigned yoe = (unsigned)(year - era * 400);
    const unsigned doy = (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1;
    const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    const int64_t days = (int64_t)era * 146097 + (int64_t)doe - 719468;
    return days * 86400 + hour * 3600 + min * 60 + sec;
}

static bool parse_civil(const char *text, time_t *out)
{
    int year = 0, month = 0, day = 0, hour = 0, min = 0, sec = 0;
    int n = sscanf(text, "%d-%d-%dT%d:%d:%d", &year, &month, &day, &hour, &min, &sec);
    if (n != 6) {
        n = sscanf(text, "%d-%d-%d %d:%d:%d", &year, &month, &day, &hour, &min, &sec);
    }
    if (n != 6) {
        return false;
    }
    if (year < 2024 || month < 1 || month > 12 || day < 1 || day > 31 ||
        hour < 0 || hour > 23 || min < 0 || min > 59 || sec < 0 || sec > 60) {
        return false;
    }
    *out = (time_t)civil_to_unix(year, month, day, hour, min, sec);
    return true;
}

static void apply_time_command(char *line)
{
    while (*line == ' ' || *line == '\t') {
        line++;
    }
    if (strncasecmp(line, "TIME", 4) != 0) {
        return;
    }
    line += 4;
    while (*line == ' ' || *line == '\t' || *line == '=') {
        line++;
    }
    if (*line == '\0') {
        ESP_LOGW(TAG, "TIME needs YYYY-MM-DDTHH:MM:SS or unix seconds");
        return;
    }

    char *end = NULL;
    long epoch = strtol(line, &end, 10);
    if (end != line && (*end == '\0' || *end == ' ' || *end == '\r')) {
        if (!set_unix_seconds((time_t)epoch, CLOCK_SOURCE_UART)) {
            ESP_LOGW(TAG, "rejected unix time %ld", epoch);
        }
        return;
    }

    time_t sec = 0;
    if (!parse_civil(line, &sec) || !set_unix_seconds(sec, CLOCK_SOURCE_UART)) {
        ESP_LOGW(TAG, "could not apply TIME line");
    }
}

static void uart_time_task(void *arg)
{
    (void)arg;
    char line[80];
    ESP_LOGI(TAG, "serial time: TIME 2026-10-09T15:04:00   or   TIME 1728486240");

    while (1) {
        if (!fgets(line, sizeof(line), stdin)) {
            vTaskDelay(pdMS_TO_TICKS(200));
            continue;
        }
        size_t n = strlen(line);
        while (n > 0 && (line[n - 1] == '\n' || line[n - 1] == '\r')) {
            line[--n] = '\0';
        }
        apply_time_command(line);
    }
}

void clock_start(void)
{
    setenv("TZ", "UTC0", 1);
    tzset();

    if (xTaskCreate(uart_time_task, "uart_time", 4096, NULL, 3, NULL) != pdPASS) {
        ESP_LOGE(TAG, "UART time task failed");
    }
}

bool clock_wait(uint32_t timeout_ms)
{
    if (clock_is_set() || timeout_ms == 0) {
        return clock_is_set();
    }

    TickType_t start = xTaskGetTickCount();
    TickType_t limit = pdMS_TO_TICKS(timeout_ms);
    while (!clock_is_set()) {
        if ((xTaskGetTickCount() - start) >= limit) {
            return false;
        }
        vTaskDelay(pdMS_TO_TICKS(200));
    }
    return true;
}
