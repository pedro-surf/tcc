#include "mpu9250.h"
#include "i2c_bus.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define MPU_ADDR        0x68
#define WHO_AM_I        0x75
#define PWR_MGMT_1      0x6B
#define ACCEL_CONFIG    0x1C
#define GYRO_CONFIG     0x1B
#define ACCEL_XOUT_H    0x3B
#define GYRO_XOUT_H     0x43

/* Expected WHO_AM_I: 0x71 (MPU9250) or 0x70/0x73 on some clones */
#define MPU_WHO_AM_I_EXPECTED 0x71

static const char *TAG = "mpu9250";

static esp_err_t write_reg(uint8_t reg, uint8_t val)
{
    uint8_t data[2] = {reg, val};
    return i2c_master_write_to_device(
        I2C_MASTER_NUM,
        MPU_ADDR,
        data,
        2,
        pdMS_TO_TICKS(100)
    );
}

static esp_err_t read_regs(uint8_t reg, uint8_t *data, size_t len)
{
    return i2c_master_write_read_device(
        I2C_MASTER_NUM,
        MPU_ADDR,
        &reg,
        1,
        data,
        len,
        pdMS_TO_TICKS(100)
    );
}

bool mpu9250_init(void)
{
    uint8_t who = 0;

    /* Reset then wake */
    write_reg(PWR_MGMT_1, 0x80);
    vTaskDelay(pdMS_TO_TICKS(100));
    write_reg(PWR_MGMT_1, 0x00);
    vTaskDelay(pdMS_TO_TICKS(50));

    if (read_regs(WHO_AM_I, &who, 1) != ESP_OK) {
        ESP_LOGE(TAG, "WHO_AM_I read failed (check I2C wiring)");
        return false;
    }

    ESP_LOGI(TAG, "WHO_AM_I=0x%02X", who);
    if (who != MPU_WHO_AM_I_EXPECTED && who != 0x70 && who != 0x73) {
        ESP_LOGW(TAG, "Unexpected chip ID (continuing anyway)");
    }

    /* ±2g accel, ±250 dps gyro (matches scaling below) */
    write_reg(ACCEL_CONFIG, 0x00);
    write_reg(GYRO_CONFIG, 0x00);

    return true;
}

void mpu9250_read_accel(float *ax, float *ay, float *az)
{
    uint8_t data[6] = {0};

    if (read_regs(ACCEL_XOUT_H, data, 6) != ESP_OK) {
        *ax = *ay = *az = 0;
        return;
    }

    int16_t raw_ax = (int16_t)((data[0] << 8) | data[1]);
    int16_t raw_ay = (int16_t)((data[2] << 8) | data[3]);
    int16_t raw_az = (int16_t)((data[4] << 8) | data[5]);

    *ax = raw_ax / 16384.0f;
    *ay = raw_ay / 16384.0f;
    *az = raw_az / 16384.0f;
}

void mpu9250_read_gyro(float *gx, float *gy, float *gz)
{
    uint8_t data[6] = {0};

    if (read_regs(GYRO_XOUT_H, data, 6) != ESP_OK) {
        *gx = *gy = *gz = 0;
        return;
    }

    int16_t raw_gx = (int16_t)((data[0] << 8) | data[1]);
    int16_t raw_gy = (int16_t)((data[2] << 8) | data[3]);
    int16_t raw_gz = (int16_t)((data[4] << 8) | data[5]);

    *gx = raw_gx / 131.0f;
    *gy = raw_gy / 131.0f;
    *gz = raw_gz / 131.0f;
}

/* Mag (AK8963) needs I2C bypass + separate init — stubbed for MVP */
void mpu9250_read_mag(float *mx, float *my, float *mz)
{
    *mx = 0;
    *my = 0;
    *mz = 0;
}
