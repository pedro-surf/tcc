#include "storage.h"

#include "esp_log.h"
#include "esp_timer.h"
#include "esp_vfs_fat.h"
#include "driver/spi_common.h"
#include "sdmmc_cmd.h"

#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>

static const char *TAG = "storage";

/* Flush to SD every N rows to limit wear/latency while keeping data durable. */
#define STORAGE_FLUSH_EVERY_N 20

static sdmmc_card_t *s_card;
static FILE *s_file;
static bool s_ready;
static char s_path[96];
static uint32_t s_rows_since_flush;
static int64_t s_session_start_us;

static const char *CSV_HEADER =
    "timestamp_ms,ax,ay,az,gx,gy,gz,mx,my,mz,pressure_pa,temperature_c\n";

static esp_err_t ensure_sessions_dir(void)
{
    struct stat st;
    if (stat(STORAGE_SESSIONS_DIR, &st) == 0) {
        if (S_ISDIR(st.st_mode)) {
            return ESP_OK;
        }
        ESP_LOGE(TAG, "%s exists but is not a directory", STORAGE_SESSIONS_DIR);
        return ESP_ERR_INVALID_STATE;
    }

    if (mkdir(STORAGE_SESSIONS_DIR, 0775) != 0 && errno != EEXIST) {
        ESP_LOGE(TAG, "mkdir %s failed: errno=%d", STORAGE_SESSIONS_DIR, errno);
        return ESP_FAIL;
    }
    return ESP_OK;
}

esp_err_t storage_init(void)
{
    if (s_ready) {
        return ESP_OK;
    }

    esp_vfs_fat_sdmmc_mount_config_t mount_config = {
        .format_if_mount_failed = false,
        .max_files = 5,
        .allocation_unit_size = 16 * 1024,
    };

    sdmmc_host_t host = SDSPI_HOST_DEFAULT();
    spi_bus_config_t bus_cfg = {
        .mosi_io_num = STORAGE_SD_MOSI_GPIO,
        .miso_io_num = STORAGE_SD_MISO_GPIO,
        .sclk_io_num = STORAGE_SD_SCLK_GPIO,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 4000,
    };

    esp_err_t ret = spi_bus_initialize(host.slot, &bus_cfg, SDSPI_DEFAULT_DMA);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "SPI init failed: %s", esp_err_to_name(ret));
        return ret;
    }

    sdspi_device_config_t slot_config = SDSPI_DEVICE_CONFIG_DEFAULT();
    slot_config.gpio_cs = STORAGE_SD_CS_GPIO;
    slot_config.host_id = host.slot;

    ret = esp_vfs_fat_sdspi_mount(STORAGE_MOUNT_POINT, &host, &slot_config,
                                  &mount_config, &s_card);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "SD mount failed: %s", esp_err_to_name(ret));
        spi_bus_free(host.slot);
        return ret;
    }

    sdmmc_card_print_info(stdout, s_card);

    ret = ensure_sessions_dir();
    if (ret != ESP_OK) {
        return ret;
    }

    s_ready = true;
    ESP_LOGI(TAG, "SD ready at %s", STORAGE_MOUNT_POINT);
    return ESP_OK;
}

bool storage_is_ready(void)
{
    return s_ready;
}

esp_err_t storage_start_session(int sample_hz)
{
    if (!s_ready) {
        return ESP_ERR_INVALID_STATE;
    }
    if (s_file) {
        ESP_LOGW(TAG, "Session already open (%s); closing first", s_path);
        storage_close_session();
    }

    s_session_start_us = esp_timer_get_time();
    int64_t boot_ms = s_session_start_us / 1000;

    snprintf(s_path, sizeof(s_path),
             STORAGE_SESSIONS_DIR "/session_%lld.csv",
             (long long)boot_ms);

    s_file = fopen(s_path, "w");
    if (!s_file) {
        ESP_LOGE(TAG, "Failed to open %s (errno=%d)", s_path, errno);
        s_path[0] = '\0';
        return ESP_FAIL;
    }

    /* Comment line keeps the file parseable while carrying import metadata. */
    fprintf(s_file,
            "# schema=buoy-sensor-v1;version=1;sample_hz=%d;"
            "device=buoy-sensor-v1;units=g,dps,uT,Pa,C\n",
            sample_hz);
    fputs(CSV_HEADER, s_file);
    fflush(s_file);

    s_rows_since_flush = 0;
    ESP_LOGI(TAG, "Session CSV opened: %s", s_path);
    return ESP_OK;
}

esp_err_t storage_log_sample(const sensor_data_t *sample)
{
    if (!s_file || !sample) {
        return ESP_ERR_INVALID_STATE;
    }

    /* Prefer session-relative ms so importers can treat t0 as session start. */
    int64_t timestamp_ms = (sample->timestamp - s_session_start_us) / 1000;
    if (timestamp_ms < 0) {
        timestamp_ms = 0;
    }

    int written = fprintf(
        s_file,
        "%lld,%.5f,%.5f,%.5f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.2f,%.2f\n",
        (long long)timestamp_ms,
        sample->ax, sample->ay, sample->az,
        sample->gx, sample->gy, sample->gz,
        sample->mx, sample->my, sample->mz,
        sample->pressure, sample->temperature);

    if (written < 0) {
        ESP_LOGE(TAG, "CSV write failed (errno=%d)", errno);
        return ESP_FAIL;
    }

    s_rows_since_flush++;
    if (s_rows_since_flush >= STORAGE_FLUSH_EVERY_N) {
        return storage_flush();
    }
    return ESP_OK;
}

esp_err_t storage_flush(void)
{
    if (!s_file) {
        return ESP_ERR_INVALID_STATE;
    }
    if (fflush(s_file) != 0) {
        ESP_LOGE(TAG, "fflush failed (errno=%d)", errno);
        return ESP_FAIL;
    }
    s_rows_since_flush = 0;
    return ESP_OK;
}

esp_err_t storage_close_session(void)
{
    if (!s_file) {
        return ESP_OK;
    }

    esp_err_t ret = storage_flush();
    if (fclose(s_file) != 0) {
        ESP_LOGE(TAG, "fclose failed (errno=%d)", errno);
        ret = ESP_FAIL;
    }

    ESP_LOGI(TAG, "Session CSV closed: %s", s_path[0] ? s_path : "(unknown)");
    s_file = NULL;
    s_path[0] = '\0';
    s_rows_since_flush = 0;
    return ret;
}
