#include "bmp280.h"
#include "driver/i2c.h"

#define BMP280_ADDR 0x76
#define BMP280_REG_PRESSURE 0xF7

extern i2c_port_t I2C_MASTER_NUM;

static esp_err_t bmp280_read_bytes(uint8_t reg, uint8_t *data, size_t len)
{
    return i2c_master_write_read_device(
        I2C_MASTER_NUM,
        BMP280_ADDR,
        &reg,
        1,
        data,
        len,
        pdMS_TO_TICKS(100)
    );
}

void bmp280_init()
{
    uint8_t config[2] = {0xF4, 0x27};

    i2c_master_write_to_device(
        I2C_MASTER_NUM,
        BMP280_ADDR,
        config,
        2,
        pdMS_TO_TICKS(100)
    );
}

void bmp280_read(float *pressure, float *temperature)
{
    uint8_t data[6];

    bmp280_read_bytes(BMP280_REG_PRESSURE, data, 6);

    int32_t adc_P = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4);
    int32_t adc_T = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4);

    *pressure = adc_P / 256.0;
    *temperature = adc_T / 512.0;
}