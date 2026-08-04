#ifndef STORAGE_H
#define STORAGE_H

#include "data_types.h"
#include "esp_err.h"

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* SDSPI pins (ESP32 DevKit defaults used by this board) */
#define STORAGE_SD_MOSI_GPIO 23
#define STORAGE_SD_MISO_GPIO 19
#define STORAGE_SD_SCLK_GPIO 18
#define STORAGE_SD_CS_GPIO   5

#define STORAGE_MOUNT_POINT "/sdcard"
#define STORAGE_SESSIONS_DIR STORAGE_MOUNT_POINT "/sessions"

/**
 * Mount the SD card over SPI and prepare the sessions directory.
 * Returns ESP_OK on success. Safe to call sensor sampling even if this fails.
 */
esp_err_t storage_init(void);

/** True after a successful mount. */
bool storage_is_ready(void);

/**
 * Open a new CSV session file under /sdcard/sessions/.
 * Writes a metadata comment + header row.
 * @param sample_hz nominal sampling rate recorded in the file header
 */
esp_err_t storage_start_session(int sample_hz);

/** Append one sample as a CSV row. No-op if no session is open. */
esp_err_t storage_log_sample(const sensor_data_t *sample);

/** Force pending buffered rows to the card. */
esp_err_t storage_flush(void);

/** Flush and close the current session file. */
esp_err_t storage_close_session(void);

#ifdef __cplusplus
}
#endif

#endif
