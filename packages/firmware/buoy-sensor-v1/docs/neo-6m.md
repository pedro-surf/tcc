# u-blox NEO-6M — GPS with ESP32

UART GNSS module. Default output is **NMEA 0183 at 9600 baud, 1 Hz**. The chip is 3.3 V; most cheap breakouts include an LDO so **VCC is 5 V** and TX/RX stay 3.3 V (ESP32-safe).

Buoy wiring is in [`../SCHEMATIC.md`](../SCHEMATIC.md). The driver is [`../components/gps/`](../components/gps/) (`ENABLE_GPS` in [`../main/config.h`](../main/config.h)).

---

## Module pins

Typical GY-GPS6MV2 / NEO-6M breakout:

| Pin | Direction | Notes |
|-----|-----------|-------|
| **VCC** | Power in | **5 V** on boards with an onboard 3.3 V LDO. Feeding 3.3 V into `VCC` often undervolts the chip (LDO dropout). |
| **GND** | — | Common ground with ESP32 |
| **TX** | Module → MCU | NMEA out. Connect to ESP32 **RX**. 3.3 V CMOS. |
| **RX** | MCU → module | Optional. Needed to send UBX/NMEA config (rate, sentences). Connect to ESP32 **TX**. |
| **PPS** | Module → MCU | 1 pulse per second after a fix. Optional; leave open for bring-up. |

Ceramic patch antenna is usually on the board. Keep the metal side facing **sky**, away from the ESP32 antenna and the GY-91.

---

## Wiring (ESP32 DevKit)

Do **not** use UART0 (GPIO1 TX / GPIO3 RX) — that is USB serial (`idf.py monitor`).

Use **UART2**. On a WROOM DevKit, GPIO16/17 are free (I2C is 21/22, SD SPI is 23/19/18/5).

| NEO-6M | ESP32 | Why |
|--------|-------|-----|
| VCC | **VIN / 5 V** (battery shield 5V OUT is fine) | LDO on the GPS board |
| GND | **GND** | Common ground |
| TX | **GPIO16** (UART2 RX) | MCU receives NMEA |
| RX | **GPIO17** (UART2 TX) | MCU can configure the module |
| PPS | leave open | |

```text
  NEO-6M                    ESP32 DevKit
  ┌──────────┐              ┌────────────┐
  │ VCC  ────┼── 5 V ───────┤ VIN / 5V   │
  │ GND  ────┼── GND ───────┤ GND        │
  │ TX   ────┼──────────────┤ GPIO16 RX2 │
  │ RX   ────┼──────────────┤ GPIO17 TX2 │
  │ PPS      │  (nc)        │            │
  └──────────┘              └────────────┘
```

**WROVER / PSRAM:** GPIO16 and GPIO17 are taken by PSRAM. Move to GPIO4 (RX) + GPIO15 (TX), or any other unused UART-capable pins.

Crossed TX/RX is the usual first failure: module **TX → MCU RX**, module **RX → MCU TX**.

---

## Power and RF

| Item | Typical |
|------|---------|
| Tracking current | **40–50 mA** (use 45 mA in budgets) |
| Acquisition | briefly higher until first fix |
| Time to first fix (cold) | 30 s – a few minutes, **outdoors with sky view** |
| Update rate | 1 Hz default (enough for a surf track) |
| Logic | 3.3 V on TX/RX |

Indoors, under a roof, or with the antenna facing a table, you will not get a fix. First bring-up should be **outside**.

---

## NMEA you actually need

Each line is ASCII, ends with `\r\n`, checksum after `*`.

| Sentence | Useful fields |
|----------|----------------|
| **`$GPGGA`** | time, lat, lon, fix quality, satellite count, altitude |
| **`$GPRMC`** | time, **A/V** (valid/invalid), lat, lon, speed, date |

Fix quality in GGA: `0` = no fix, `1` = GPS, `2` = DGPS. Treat `0` as “hold last position but mark invalid”.

Lat/lon in NMEA are **ddmm.mmmm** (degrees + minutes), not decimal degrees:

```
decimal = degrees + minutes / 60
south / west → negative
```

Example: `2832.1604,S` → `-(28 + 32.1604/60)` = **-28.5360°**.

---

## ESP-IDF snippets

ESP-IDF `driver/uart.h`, same style as this firmware. Production code is [`../components/gps/`](../components/gps/). The blocks below are the same ideas, kept here for bring-up.

### 1) UART2 init

```c
#include "driver/uart.h"
#include "driver/gpio.h"

#define GPS_UART_NUM     UART_NUM_2
#define GPS_UART_RX_PIN  16   /* ESP32 receives from module TX */
#define GPS_UART_TX_PIN  17   /* ESP32 sends to module RX */
#define GPS_UART_BAUD    9600
#define GPS_BUF_SIZE     1024

esp_err_t gps_uart_init(void)
{
    uart_config_t cfg = {
        .baud_rate = GPS_UART_BAUD,
        .data_bits = UART_DATA_8_BITS,
        .parity    = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };

    ESP_ERROR_CHECK(uart_driver_install(GPS_UART_NUM, GPS_BUF_SIZE * 2, 0, 0, NULL, 0));
    ESP_ERROR_CHECK(uart_param_config(GPS_UART_NUM, &cfg));
    ESP_ERROR_CHECK(uart_set_pin(GPS_UART_NUM, GPS_UART_TX_PIN, GPS_UART_RX_PIN,
                                 UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
    return ESP_OK;
}
```

### 2) Read lines (blocking, one NMEA sentence)

```c
#include <string.h>

/* Returns length, or -1 on timeout / overflow. Strips \r\n. */
int gps_read_line(char *out, size_t out_len, TickType_t timeout)
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
```

### 3) NMEA checksum

```c
#include <stdbool.h>
#include <stdlib.h>

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
```

### 4) `ddmm.mmmm` → decimal degrees

```c
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
```

### 5) Parse `$GPGGA` / `$GNGGA`

```c
typedef struct {
    float lat;
    float lon;
    float alt_m;
    int   fix;     /* 0=none, 1=GPS, 2=DGPS */
    int   sat;
    bool  valid;
} gps_fix_t;

static int split_commas(char *line, char *fields[], int max_fields)
{
    int n = 0;
    char *save = NULL;
    for (char *tok = strtok_r(line, ",", &save);
         tok && n < max_fields;
         tok = strtok_r(NULL, ",", &save)) {
        fields[n++] = tok;
    }
    return n;
}

bool gps_parse_gga(char *line, gps_fix_t *out)
{
    if (!nmea_checksum_ok(line)) {
        return false;
    }
    if (strncmp(line, "$GPGGA", 6) != 0 && strncmp(line, "$GNGGA", 6) != 0) {
        return false;
    }

    /* strtok writes NULs — caller must pass a mutable copy. */
    char *f[16] = {0};
    if (split_commas(line, f, 16) < 10) {
        return false;
    }

    out->lat  = nmea_to_deg(f[2], f[3][0]);
    out->lon  = nmea_to_deg(f[4], f[5][0]);
    out->fix  = atoi(f[6]);
    out->sat  = atoi(f[7]);
    out->alt_m = (float)atof(f[9]);
    out->valid = (out->fix > 0);
    return true;
}
```

Field index reminder for GGA: `0=$GPGGA`, `1=utc`, `2=lat`, `3=N/S`, `4=lon`, `5=E/W`, `6=quality`, `7=sats`, `8=hdop`, `9=alt`.

### 6) Background task — cache the latest fix

GPS is **1 Hz** and UART is slow. Do not parse NMEA inside a 10 Hz IMU loop. Keep a cached `gps_fix_t` and let the sensor task copy it.

```c
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"

static gps_fix_t s_fix;
static SemaphoreHandle_t s_lock;

static void gps_task(void *arg)
{
    (void)arg;
    char line[128];

    while (1) {
        int n = gps_read_line(line, sizeof(line), pdMS_TO_TICKS(1500));
        if (n < 6) {
            continue;
        }

        gps_fix_t parsed = {0};
        if (!gps_parse_gga(line, &parsed)) {
            continue;
        }

        xSemaphoreTake(s_lock, portMAX_DELAY);
        s_fix = parsed;
        xSemaphoreGive(s_lock);
    }
}

void gps_init(void)
{
    s_lock = xSemaphoreCreateMutex();
    gps_uart_init();
    xTaskCreate(gps_task, "gps", 3072, NULL, 4, NULL);
}

void gps_get(gps_fix_t *out)
{
    xSemaphoreTake(s_lock, portMAX_DELAY);
    *out = s_fix;
    xSemaphoreGive(s_lock);
}
```

Priority **4** is below the IMU task (**5** in `main.c`) so a GPS line never stalls sampling.

### 7) Optional: request GGA+RMC only (saves UART time)

u-blox accepts NMEA `PUBX` or UBX-CFG-MSG. Simplest NMEA-side filter after a fix is already present:

```c
/* Ask for GGA at 1 Hz on UART (talker GP). Checksum 0x77 for this payload. */
static const char *NMEA_GGA_ON =
    "$PUBX,40,GGA,0,1,0,0,0,0*5A\r\n";
static const char *NMEA_RMC_ON =
    "$PUBX,40,RMC,0,1,0,0,0,0*47\r\n";
static const char *NMEA_GSV_OFF =
    "$PUBX,40,GSV,0,0,0,0,0,0*59\r\n";

void gps_nmea_filter(void)
{
    uart_write_bytes(GPS_UART_NUM, NMEA_GGA_ON, strlen(NMEA_GGA_ON));
    uart_write_bytes(GPS_UART_NUM, NMEA_RMC_ON, strlen(NMEA_RMC_ON));
    uart_write_bytes(GPS_UART_NUM, NMEA_GSV_OFF, strlen(NMEA_GSV_OFF));
}
```

Recompute checksums if you change the payload: XOR every byte between `$` and `*`.

---

## Bench checklist

1. Common GND, VCC at **5 V**, TX/RX crossed.
2. `idf.py -p PORT flash monitor` on UART0 — GPS is on UART2, so you will not see raw NMEA on USB unless you log it.
3. Take the board **outside**. Cold start can take a minute.
4. UART log should move from `fix=0 sat=0` to `fix=1 sat≥4` and a stable lat/lon.
5. If nothing arrives: swap TX/RX, confirm 9600 8N1, confirm the red/blue LED on the module (many boards blink after a fix).

Example sanity line:

```text
I (12345) gps: lat=-27.59512 lon=-48.54801 alt=12.4 fix=1 sat=8
```

---

## What not to do

- Wire GPS onto GPIO1/3 (kills USB download/monitor).
- Power the LDO board from ESP32 **3V3** and wonder why there is no fix.
- Parse NMEA in the 10 Hz `sensor_task` (variable sentence length + `strtok` will jitter IMU).
- Expect a fix indoors.
- Share SPI pins 18/19/23/5 or I2C 21/22 with UART.
