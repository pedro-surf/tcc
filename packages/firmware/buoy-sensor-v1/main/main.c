#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_log.h"

#include "i2c_bus.h"
#include "sensor.h"

static const char *TAG = "main";

#define SAMPLE_PERIOD_MS 100  /* 10 Hz — enough for bring-up logs */

static void sensor_task(void *arg)
{
    sensor_data_t data;

    while (1) {
        sensor_read_all(&data);

        ESP_LOGI(TAG,
                 "t=%lld us | accel=%.2f %.2f %.2f g | gyro=%.1f %.1f %.1f dps | "
                 "P=%.0f Pa T=%.1f C",
                 (long long)data.timestamp,
                 data.ax, data.ay, data.az,
                 data.gx, data.gy, data.gz,
                 data.pressure, data.temperature);

        vTaskDelay(pdMS_TO_TICKS(SAMPLE_PERIOD_MS));
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "buoy-sensor-v1 MVP: I2C + MPU9250 + BMP280");

    i2c_master_init();

    if (!sensor_init()) {
        ESP_LOGW(TAG, "One or more sensors failed init — continuing to read anyway");
    }

    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
}
