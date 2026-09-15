#include "sensor.h"
#include "mpu9250.h"
#include "bmp280.h"
#include "fusion.h"
#include "gps.h"

#include "esp_log.h"
#include "esp_timer.h"

static const char *TAG = "sensor";

bool sensor_init(void)
{
    bool ok = true;

    if (!mpu9250_init()) {
        ESP_LOGE(TAG, "MPU9250 init failed");
        ok = false;
    }

    if (!bmp280_init()) {
        ESP_LOGE(TAG, "BMP280 init failed");
        ok = false;
    }

    if (!fusion_init()) {
        ESP_LOGW(TAG, "fusion init failed — roll/pitch/yaw will stay 0");
    }

    return ok;
}

void sensor_read_all(sensor_data_t *data)
{
    data->timestamp = esp_timer_get_time();

    mpu9250_read_accel(&data->ax, &data->ay, &data->az);
    mpu9250_read_gyro(&data->gx, &data->gy, &data->gz);
    mpu9250_read_mag(&data->mx, &data->my, &data->mz);

    bmp280_read(&data->pressure, &data->temperature);

    orientation_t ori = {0};
    fusion_update(data->timestamp,
                  data->ax, data->ay, data->az,
                  data->gx, data->gy, data->gz,
                  data->mx, data->my, data->mz,
                  &ori);
    data->roll = ori.roll;
    data->pitch = ori.pitch;
    data->yaw = ori.yaw;

    gps_fix_t g = {0};
    gps_get(&g);
    data->lat = g.lat;
    data->lon = g.lon;
    data->alt = g.alt;
    data->fix = g.fix;
    data->sat = g.sat;
}
