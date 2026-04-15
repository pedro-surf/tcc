#include "mpu9250.h"
#include "driver/i2c.h"
#include "i2c_bus.h"

#define MPU_ADDR 0x68
#define PWR_MGMT_1 0x6B
#define ACCEL_XOUT_H 0x3B
#define GYRO_XOUT_H 0x43

static void write_reg(uint8_t reg, uint8_t val)
{
    uint8_t data[2] = {reg, val};

    i2c_master_write_to_device(
        I2C_MASTER_NUM,
        MPU_ADDR,
        data,
        2,
        1000 / portTICK_PERIOD_MS
    );
}

void mpu9250_init(void)
{
    write_reg(PWR_MGMT_1, 0x00); // wake up
}

void mpu9250_read_accel(float *ax, float *ay, float *az)
{
    uint8_t reg = ACCEL_XOUT_H;
    uint8_t data[6];

    i2c_master_write_read_device(
        I2C_MASTER_NUM,
        MPU_ADDR,
        &reg,
        1,
        data,
        6,
        1000 / portTICK_PERIOD_MS
    );

    int16_t raw_ax = (data[0] << 8) | data[1];
    int16_t raw_ay = (data[2] << 8) | data[3];
    int16_t raw_az = (data[4] << 8) | data[5];

    *ax = raw_ax / 16384.0;
    *ay = raw_ay / 16384.0;
    *az = raw_az / 16384.0;
}

void mpu9250_read_gyro(float *gx, float *gy, float *gz)
{
    uint8_t reg = GYRO_XOUT_H;
    uint8_t data[6];

    i2c_master_write_read_device(
        I2C_MASTER_NUM,
        MPU_ADDR,
        &reg,
        1,
        data,
        6,
        1000 / portTICK_PERIOD_MS
    );

    int16_t raw_gx = (data[0] << 8) | data[1];
    int16_t raw_gy = (data[2] << 8) | data[3];
    int16_t raw_gz = (data[4] << 8) | data[5];

    *gx = raw_gx / 131.0;
    *gy = raw_gy / 131.0;
    *gz = raw_gz / 131.0;
}