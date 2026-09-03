#include "config.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_err.h"
#include "esp_log.h"

#include "i2c_bus.h"
#include "sensor.h"
#include "storage.h"
#include "wifi.h"

static const char *TAG = "main";

#define SAMPLE_HZ  (1000 / SAMPLE_PERIOD_MS)

static void sensor_task(void *arg)
{
    sensor_data_t data;
    uint32_t sample_n = 0;
    bool logging = false;

#if ENABLE_SD
    if (storage_is_ready() && storage_start_session(SAMPLE_HZ) == ESP_OK) {
        logging = true;
    } else {
        ESP_LOGW(TAG, "CSV session not started");
    }
#endif

    while (1) {
        sensor_read_all(&data);

#if ENABLE_SD
        if (logging) {
            esp_err_t err = storage_log_sample(&data);
            if (err != ESP_OK) {
                ESP_LOGW(TAG, "SD log failed: %s — disabling CSV writes",
                         esp_err_to_name(err));
                logging = false;
            }
        }
#endif

#if ENABLE_MQTT
        if ((sample_n % MQTT_PUBLISH_EVERY_N) == 0) {
            mqtt_publish_sample(&data);
        }
#endif

        if ((sample_n % UART_LOG_EVERY_N) == 0) {
            ESP_LOGI(TAG,
                     "t=%lld us | accel=%.2f %.2f %.2f g | gyro=%.1f %.1f %.1f dps | "
                     "mag=%.1f %.1f %.1f uT | P=%.0f Pa T=%.1f C%s%s",
                     (long long)data.timestamp,
                     data.ax, data.ay, data.az,
                     data.gx, data.gy, data.gz,
                     data.mx, data.my, data.mz,
                     data.pressure, data.temperature,
                     logging ? " | sd=on" : " | sd=off",
                     mqtt_is_connected() ? " | mqtt=on" : " | mqtt=off");
        }

        sample_n++;
        vTaskDelay(pdMS_TO_TICKS(SAMPLE_PERIOD_MS));
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "buoy-sensor-v1: SD=%d MQTT=%d MAG=%d  mqtt_every=%d",
             ENABLE_SD, ENABLE_MQTT, ENABLE_MAG, MQTT_PUBLISH_EVERY_N);

    i2c_master_init();

    if (!sensor_init()) {
        ESP_LOGW(TAG, "One or more sensors failed init — continuing to read anyway");
    }

#if ENABLE_SD
    esp_err_t sd_err = storage_init();
    if (sd_err != ESP_OK) {
        ESP_LOGW(TAG, "storage_init failed (%s) — sampling continues without SD",
                 esp_err_to_name(sd_err));
    }
#else
    ESP_LOGI(TAG, "SD disabled (ENABLE_SD=0)");
#endif

#if ENABLE_MQTT
    if (wifi_init() != ESP_OK) {
        ESP_LOGW(TAG, "Wi-Fi not up yet — MQTT will retry in the background");
    }
    if (mqtt_init() != ESP_OK) {
        ESP_LOGW(TAG, "MQTT client failed to start");
    }
#else
    ESP_LOGI(TAG, "MQTT disabled (ENABLE_MQTT=0)");
#endif

    xTaskCreate(sensor_task, "sensor_task", 6144, NULL, 5, NULL);
}
