#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_err.h"
#include "esp_log.h"

#include "i2c_bus.h"
#include "sensor.h"
#include "storage.h"

static const char *TAG = "main";

#define SAMPLE_PERIOD_MS 100  /* 10 Hz */
#define SAMPLE_HZ        (1000 / SAMPLE_PERIOD_MS)
/* UART is chatty at 10 Hz; keep serial sparse once SD logging is active. */
#define UART_LOG_EVERY_N 10

static void sensor_task(void *arg)
{
    sensor_data_t data;
    uint32_t sample_n = 0;
    bool logging = false;

    if (storage_is_ready() && storage_start_session(SAMPLE_HZ) == ESP_OK) {
        logging = true;
    } else {
        ESP_LOGW(TAG, "CSV session not started — UART-only sampling");
    }

    while (1) {
        sensor_read_all(&data);

        if (logging) {
            esp_err_t err = storage_log_sample(&data);
            if (err != ESP_OK) {
                ESP_LOGW(TAG, "SD log failed: %s — disabling CSV writes",
                         esp_err_to_name(err));
                logging = false;
            }
        }

        if ((sample_n % UART_LOG_EVERY_N) == 0) {
            ESP_LOGI(TAG,
                     "t=%lld us | accel=%.2f %.2f %.2f g | gyro=%.1f %.1f %.1f dps | "
                     "P=%.0f Pa T=%.1f C%s",
                     (long long)data.timestamp,
                     data.ax, data.ay, data.az,
                     data.gx, data.gy, data.gz,
                     data.pressure, data.temperature,
                     logging ? " | sd=on" : " | sd=off");
        }

        sample_n++;
        vTaskDelay(pdMS_TO_TICKS(SAMPLE_PERIOD_MS));
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "buoy-sensor-v1: I2C sensors + SD CSV logging");

    i2c_master_init();

    if (!sensor_init()) {
        ESP_LOGW(TAG, "One or more sensors failed init — continuing to read anyway");
    }

    esp_err_t sd_err = storage_init();
    if (sd_err != ESP_OK) {
        ESP_LOGW(TAG, "storage_init failed (%s) — sampling continues without SD",
                 esp_err_to_name(sd_err));
    }

    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
}
