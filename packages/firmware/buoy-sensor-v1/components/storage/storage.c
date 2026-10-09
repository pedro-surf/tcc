#include "storage.h"

#include "clock.h"
#include "config.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "esp_vfs_fat.h"
#include "driver/spi_common.h"
#include "sdmmc_cmd.h"

#include <dirent.h>
#include <errno.h>
#include <inttypes.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

static const char *TAG = "storage";

#define META_PATH STORAGE_MOUNT_POINT "/meta.txt"
#define BOOTLOG_PATH STORAGE_MOUNT_POINT "/bootlog.csv"

static sdmmc_card_t *s_card;
static FILE *s_file;
static bool s_ready;
static char s_path[96];
static char s_file_name[40];
static char s_seq_day[16];
static uint32_t s_rows_since_flush;
static int64_t s_session_start_us;
static uint32_t s_boot_count;
static uint32_t s_next_seq;
static int s_year;
static int s_month;
static int s_day;
static uint32_t s_seq;
static int s_sample_hz;
static int64_t s_t0_unix_ms;
static bool s_time_noted;
static char s_time_source[8];
static long s_header_len;

static const char *CSV_HEADER =
    "timestamp_ms,ax,ay,az,gx,gy,gz,mx,my,mz,roll,pitch,yaw,pressure_pa,temperature_c,lat,lon,fix,alt,sat\n";

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
        ESP_LOGE(TAG, "mkdir %s failed: errno=%d (%s)",
                 STORAGE_SESSIONS_DIR, errno, strerror(errno));
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "sessions dir ready: %s", STORAGE_SESSIONS_DIR);
    return ESP_OK;
}

static void log_dir(const char *path)
{
    DIR *dir = opendir(path);
    if (!dir) {
        ESP_LOGW(TAG, "cannot list %s: errno=%d (%s)", path, errno, strerror(errno));
        return;
    }

    ESP_LOGI(TAG, "listing %s:", path);
    struct dirent *ent;
    int n = 0;
    while ((ent = readdir(dir)) != NULL) {
        ESP_LOGI(TAG, "  %s", ent->d_name);
        if (++n >= 16) {
            ESP_LOGI(TAG, "  ...");
            break;
        }
    }
    if (n == 0) {
        ESP_LOGI(TAG, "  (empty)");
    }
    closedir(dir);
}

static void load_meta(void)
{
    s_boot_count = 0;
    s_next_seq = 1;
    s_seq_day[0] = '\0';

    FILE *file = fopen(META_PATH, "r");
    if (!file) {
        return;
    }

    char line[80];
    while (fgets(line, sizeof(line), file)) {
        unsigned value = 0;
        char day[16];
        if (sscanf(line, "boot_count=%u", &value) == 1) {
            s_boot_count = value;
        } else if (sscanf(line, "next_seq=%u", &value) == 1) {
            s_next_seq = value == 0 ? 1 : value;
        } else if (sscanf(line, "seq_day=%15s", day) == 1) {
            snprintf(s_seq_day, sizeof(s_seq_day), "%s", day);
        }
    }
    fclose(file);
}

static esp_err_t save_meta(void)
{
    FILE *file = fopen(META_PATH, "w");
    if (!file) {
        ESP_LOGE(TAG, "meta write failed (errno=%d)", errno);
        return ESP_FAIL;
    }

    fprintf(file, "boot_count=%" PRIu32 "\nseq_day=%s\nnext_seq=%" PRIu32 "\n",
            s_boot_count, s_seq_day, s_next_seq);
    if (fflush(file) != 0 || fsync(fileno(file)) != 0) {
        ESP_LOGE(TAG, "meta sync failed (errno=%d)", errno);
        fclose(file);
        return ESP_FAIL;
    }
    fclose(file);
    return ESP_OK;
}

static void append_bootlog(const char *event)
{
    struct stat st;
    bool exists = stat(BOOTLOG_PATH, &st) == 0;

    FILE *file = fopen(BOOTLOG_PATH, "a");
    if (!file) {
        ESP_LOGW(TAG, "bootlog open failed (errno=%d)", errno);
        return;
    }

    if (!exists) {
        fputs("boot,session,file,event,uptime_ms,t0_unix_ms,time_source\n", file);
    }

    int64_t uptime_ms = esp_timer_get_time() / 1000;
    fprintf(file, "%" PRIu32 ",%" PRIu32 ",%s,%s,%lld,%lld,%s\n",
            s_boot_count, s_seq, s_file_name, event,
            (long long)uptime_ms, (long long)s_t0_unix_ms, s_time_source);

    if (fflush(file) != 0 || fsync(fileno(file)) != 0) {
        ESP_LOGW(TAG, "bootlog sync failed (errno=%d)", errno);
    }
    fclose(file);
}

static int format_header(char *out, size_t cap)
{
    return snprintf(
        out, cap,
        "# schema=buoy-sensor-v1;version=4;sample_hz=%03d;"
        "file=SDCARD-%04d-%02d-%02d-%03" PRIu32 ";boot=%06" PRIu32 ";"
        "t0_unix_ms=%013lld;time_source=%.4s;units=g,dps,uT,rad,Pa,C,deg,m\n",
        s_sample_hz, s_year, s_month, s_day, s_seq, s_boot_count,
        (long long)s_t0_unix_ms, s_time_source);
}

static esp_err_t rewrite_header(void)
{
    char header[224];
    int n = format_header(header, sizeof(header));
    if (n <= 0 || n >= (int)sizeof(header) || (s_header_len > 0 && n != s_header_len)) {
        ESP_LOGE(TAG, "header length changed (%d vs %ld)", n, s_header_len);
        return ESP_FAIL;
    }

    if (fflush(s_file) != 0) {
        return ESP_FAIL;
    }
    long pos = ftell(s_file);
    if (pos < 0 || fseek(s_file, 0, SEEK_SET) != 0) {
        return ESP_FAIL;
    }
    if (fwrite(header, 1, (size_t)n, s_file) != (size_t)n) {
        return ESP_FAIL;
    }
    if (fflush(s_file) != 0 || fsync(fileno(s_file)) != 0) {
        return ESP_FAIL;
    }
    if (fseek(s_file, pos, SEEK_SET) != 0) {
        return ESP_FAIL;
    }
    s_header_len = n;
    return ESP_OK;
}

static void capture_clock(void)
{
    if (!clock_is_set()) {
        s_t0_unix_ms = 0;
        strncpy(s_time_source, "none", sizeof(s_time_source));
        s_time_source[sizeof(s_time_source) - 1] = '\0';
        return;
    }

    int64_t elapsed_ms = (esp_timer_get_time() - s_session_start_us) / 1000;
    if (elapsed_ms < 0) {
        elapsed_ms = 0;
    }
    int64_t now_ms = clock_unix_ms();
    s_t0_unix_ms = now_ms > elapsed_ms ? now_ms - elapsed_ms : now_ms;
    strncpy(s_time_source, clock_source_name(clock_source()), sizeof(s_time_source));
    s_time_source[sizeof(s_time_source) - 1] = '\0';
}

static bool format_session_path(int year, int month, int day, uint32_t seq,
                                char *name, size_t name_n, char *path, size_t path_n)
{
    int nn = snprintf(name, name_n, "SDCARD-%04d-%02d-%02d-%03" PRIu32 ".csv",
                      year, month, day, seq);
    int np = snprintf(path, path_n, STORAGE_SESSIONS_DIR "/%s", name);
    return nn > 0 && np > 0 && (size_t)nn < name_n && (size_t)np < path_n;
}

static void date_from_unix_ms(int64_t unix_ms, int *year, int *month, int *day)
{
    if (unix_ms <= 0) {
        *year = 0;
        *month = 0;
        *day = 0;
        return;
    }
    time_t sec = (time_t)(unix_ms / 1000);
    struct tm tm;
    gmtime_r(&sec, &tm);
    *year = tm.tm_year + 1900;
    *month = tm.tm_mon + 1;
    *day = tm.tm_mday;
}

/* Pick the next free SDCARD-YYYY-MM-DD-NNN name and remember it. */
static esp_err_t claim_session_name(int year, int month, int day)
{
    char day_key[16];
    snprintf(day_key, sizeof(day_key), "%04d-%02d-%02d", year, month, day);

    uint32_t seq = 1;
    if (strcmp(s_seq_day, day_key) == 0 && s_next_seq > 0) {
        seq = s_next_seq;
    }

    char name[40];
    char path[96];
    for (int guard = 0; guard < 999; guard++) {
        if (!format_session_path(year, month, day, seq, name, sizeof(name), path, sizeof(path))) {
            return ESP_FAIL;
        }
        struct stat st;
        if (stat(path, &st) != 0) {
            snprintf(s_seq_day, sizeof(s_seq_day), "%s", day_key);
            snprintf(s_file_name, sizeof(s_file_name), "%s", name);
            snprintf(s_path, sizeof(s_path), "%s", path);
            s_year = year;
            s_month = month;
            s_day = day;
            s_seq = seq;
            s_next_seq = seq + 1;
            return ESP_OK;
        }
        seq++;
    }
    ESP_LOGE(TAG, "no free session name for %s", day_key);
    return ESP_FAIL;
}

/* Close, rename, and reopen so a late clock fix can replace 0000-00-00. */
static esp_err_t reseat_session_file(int year, int month, int day)
{
    char old_path[96];
    char old_name[40];
    char old_day_key[16];
    int old_year = s_year;
    int old_month = s_month;
    int old_mday = s_day;
    uint32_t old_seq = s_seq;
    uint32_t old_next = s_next_seq;
    snprintf(old_path, sizeof(old_path), "%s", s_path);
    snprintf(old_name, sizeof(old_name), "%s", s_file_name);
    snprintf(old_day_key, sizeof(old_day_key), "%s", s_seq_day);

    if (!s_file || fflush(s_file) != 0) {
        return ESP_FAIL;
    }
    fclose(s_file);
    s_file = NULL;

    if (claim_session_name(year, month, day) != ESP_OK) {
        s_file = fopen(old_path, "r+");
        if (s_file) {
            fseek(s_file, 0, SEEK_END);
        }
        return ESP_FAIL;
    }

    if (rename(old_path, s_path) != 0) {
        ESP_LOGE(TAG, "rename %s -> %s failed (errno=%d)", old_path, s_path, errno);
        snprintf(s_path, sizeof(s_path), "%s", old_path);
        snprintf(s_file_name, sizeof(s_file_name), "%s", old_name);
        snprintf(s_seq_day, sizeof(s_seq_day), "%s", old_day_key);
        s_year = old_year;
        s_month = old_month;
        s_day = old_mday;
        s_seq = old_seq;
        s_next_seq = old_next;
        s_file = fopen(old_path, "r+");
        if (s_file) {
            fseek(s_file, 0, SEEK_END);
        }
        return ESP_FAIL;
    }

    s_file = fopen(s_path, "r+");
    if (!s_file || fseek(s_file, 0, SEEK_END) != 0) {
        ESP_LOGE(TAG, "reopen %s failed (errno=%d)", s_path, errno);
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

    load_meta();
    s_boot_count++;
    if (save_meta() != ESP_OK) {
        ESP_LOGW(TAG, "could not persist boot count");
    }
    ESP_LOGI(TAG, "boot %" PRIu32 ", seq day %s next %" PRIu32,
             s_boot_count, s_seq_day[0] ? s_seq_day : "(none)", s_next_seq);

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
    s_sample_hz = sample_hz;
    s_time_noted = false;
    s_header_len = 0;
    capture_clock();

    int year = 0;
    int month = 0;
    int day = 0;
    date_from_unix_ms(s_t0_unix_ms, &year, &month, &day);
    if (claim_session_name(year, month, day) != ESP_OK) {
        return ESP_FAIL;
    }

    s_file = fopen(s_path, "w");
    if (!s_file) {
        ESP_LOGE(TAG, "Failed to open %s (errno=%d %s)",
                 s_path, errno, strerror(errno));
        if (errno == EINVAL) {
            ESP_LOGE(TAG, "FAT rejected the name — need long-filename support "
                     "(CONFIG_FATFS_LFN_HEAP) or an 8.3 name like SESS0001.CSV");
        }
        log_dir(STORAGE_MOUNT_POINT);
        log_dir(STORAGE_SESSIONS_DIR);
        s_path[0] = '\0';
        return ESP_FAIL;
    }

    char header[224];
    int header_n = format_header(header, sizeof(header));
    if (header_n <= 0 || header_n >= (int)sizeof(header)) {
        ESP_LOGE(TAG, "header format failed");
        fclose(s_file);
        s_file = NULL;
        return ESP_FAIL;
    }
    if (fwrite(header, 1, (size_t)header_n, s_file) != (size_t)header_n) {
        ESP_LOGE(TAG, "header write failed");
        fclose(s_file);
        s_file = NULL;
        return ESP_FAIL;
    }
    s_header_len = header_n;
    fputs(CSV_HEADER, s_file);
    if (storage_flush() != ESP_OK) {
        ESP_LOGE(TAG, "header not synced to card");
        storage_close_session();
        return ESP_FAIL;
    }

    if (save_meta() != ESP_OK) {
        ESP_LOGW(TAG, "could not persist next session id");
    }
    s_time_noted = s_t0_unix_ms > 0;
    append_bootlog("start");

    ESP_LOGI(TAG, "Session CSV opened: %s boot=%" PRIu32 " t0=%lld source=%s (fsync every %d rows)",
             s_path, s_boot_count, (long long)s_t0_unix_ms, s_time_source, SD_FLUSH_EVERY_N);
    return ESP_OK;
}

esp_err_t storage_log_sample(const sensor_data_t *sample)
{
    if (!s_file || !sample) {
        return ESP_ERR_INVALID_STATE;
    }

    if (!s_time_noted && clock_is_set()) {
        capture_clock();
        int year = 0;
        int month = 0;
        int day = 0;
        date_from_unix_ms(s_t0_unix_ms, &year, &month, &day);
        if (s_year == 0 && year > 0 && reseat_session_file(year, month, day) != ESP_OK) {
            ESP_LOGW(TAG, "could not rename session to dated name");
        }
        if (rewrite_header() == ESP_OK) {
            s_time_noted = true;
            if (save_meta() != ESP_OK) {
                ESP_LOGW(TAG, "could not persist session sequence");
            }
            append_bootlog("time");
            ESP_LOGI(TAG, "session t0 set to %lld via %s (%s)",
                     (long long)s_t0_unix_ms, s_time_source, s_file_name);
        }
    }

    /* Milliseconds since this session opened. Absolute time is t0_unix_ms + this. */
    int64_t timestamp_ms = (sample->timestamp - s_session_start_us) / 1000;
    if (timestamp_ms < 0) {
        timestamp_ms = 0;
    }

    int written = fprintf(
        s_file,
        "%lld,%.5f,%.5f,%.5f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.5f,%.5f,%.5f,%.2f,%.2f,"
        "%.6f,%.6f,%d,%.1f,%d\n",
        (long long)timestamp_ms,
        sample->ax, sample->ay, sample->az,
        sample->gx, sample->gy, sample->gz,
        sample->mx, sample->my, sample->mz,
        sample->roll, sample->pitch, sample->yaw,
        sample->pressure, sample->temperature,
        sample->lat, sample->lon, sample->fix, sample->alt, sample->sat);

    if (written < 0) {
        ESP_LOGE(TAG, "CSV write failed (errno=%d)", errno);
        return ESP_FAIL;
    }

    s_rows_since_flush++;
    if (s_rows_since_flush >= SD_FLUSH_EVERY_N) {
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
    /* fflush only empties the libc buffer. fsync writes the FAT size, so the
     * file is not 0 bytes if the card is pulled before fclose. */
    if (fsync(fileno(s_file)) != 0) {
        ESP_LOGE(TAG, "fsync failed (errno=%d)", errno);
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
