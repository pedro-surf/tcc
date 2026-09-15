#include "fusion.h"
#include "complementary.h"
#include "config.h"
#include "mpu9250.h"

#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define DEG_TO_RAD  ((float)(M_PI / 180.0))

static const char *TAG = "fusion";

#if ENABLE_FUSION
static const fusion_backend_t *s_backend = &fusion_complementary;
static float s_gyro_bias_dps[3];
static int64_t s_last_us;
static bool s_have_prev;

static bool calibrate_gyro(void)
{
    float sx = 0, sy = 0, sz = 0;
    float gx, gy, gz;
    int ok = 0;

    ESP_LOGI(TAG, "gyro bias: keep the board still (%d samples)", GYRO_CALIB_SAMPLES);
    vTaskDelay(pdMS_TO_TICKS(80));

    for (int i = 0; i < GYRO_CALIB_SAMPLES; i++) {
        mpu9250_read_gyro(&gx, &gy, &gz);
        sx += gx;
        sy += gy;
        sz += gz;
        ok++;
        vTaskDelay(pdMS_TO_TICKS(GYRO_CALIB_DELAY_MS));
    }

    if (ok == 0) {
        return false;
    }

    s_gyro_bias_dps[0] = sx / (float)ok;
    s_gyro_bias_dps[1] = sy / (float)ok;
    s_gyro_bias_dps[2] = sz / (float)ok;
    ESP_LOGI(TAG, "gyro bias dps: %.3f %.3f %.3f",
             s_gyro_bias_dps[0], s_gyro_bias_dps[1], s_gyro_bias_dps[2]);
    return true;
}
#endif

bool fusion_init(void)
{
#if ENABLE_FUSION
    s_have_prev = false;
    s_last_us = 0;
    if (!s_backend->reset()) {
        return false;
    }
    if (!calibrate_gyro()) {
        ESP_LOGW(TAG, "gyro calib failed — using zero bias");
    }
    ESP_LOGI(TAG, "backend=%s alpha=%.3f", s_backend->name, (double)FUSION_ALPHA);
    return true;
#else
    ESP_LOGI(TAG, "disabled (ENABLE_FUSION=0)");
    return true;
#endif
}

void fusion_update(int64_t timestamp_us,
                   float ax, float ay, float az,
                   float gx_dps, float gy_dps, float gz_dps,
                   float mx, float my, float mz,
                   orientation_t *out)
{
    if (!out) {
        return;
    }

#if ENABLE_FUSION
    fusion_input_t in = {
        .ax = ax,
        .ay = ay,
        .az = az,
        .mx = mx,
        .my = my,
        .mz = mz,
        .dt = SAMPLE_PERIOD_MS / 1000.0f,
    };

    in.gx = (gx_dps - s_gyro_bias_dps[0]) * DEG_TO_RAD;
    in.gy = (gy_dps - s_gyro_bias_dps[1]) * DEG_TO_RAD;
    in.gz = (gz_dps - s_gyro_bias_dps[2]) * DEG_TO_RAD;

    if (s_have_prev && timestamp_us > s_last_us) {
        in.dt = (float)(timestamp_us - s_last_us) / 1000000.0f;
    }
    s_last_us = timestamp_us;
    s_have_prev = true;

    s_backend->update(&in, out);
#else
    (void)timestamp_us;
    (void)ax;
    (void)ay;
    (void)az;
    (void)gx_dps;
    (void)gy_dps;
    (void)gz_dps;
    (void)mx;
    (void)my;
    (void)mz;
    out->roll = 0;
    out->pitch = 0;
    out->yaw = 0;
#endif
}

const fusion_backend_t *fusion_backend(void)
{
#if ENABLE_FUSION
    return s_backend;
#else
    return NULL;
#endif
}
