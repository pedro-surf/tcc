#include "bmp280.h"
#include "i2c_bus.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define BMP280_ADDR         0x76
#define BMP280_REG_ID       0xD0
#define BMP280_REG_RESET    0xE0
#define BMP280_REG_CTRL     0xF4
#define BMP280_REG_CONFIG   0xF5
#define BMP280_REG_PRESS    0xF7
#define BMP280_REG_CALIB    0x88

#define BMP280_CHIP_ID      0x58

static const char *TAG = "bmp280";

/* Calibration from device NVM */
static uint16_t dig_T1;
static int16_t  dig_T2, dig_T3;
static uint16_t dig_P1;
static int16_t  dig_P2, dig_P3, dig_P4, dig_P5, dig_P6, dig_P7, dig_P8, dig_P9;
static int32_t  t_fine;
static bool     ready;

static esp_err_t write_reg(uint8_t reg, uint8_t val)
{
    uint8_t data[2] = {reg, val};
    return i2c_master_write_to_device(
        I2C_MASTER_NUM, BMP280_ADDR, data, 2, pdMS_TO_TICKS(100)
    );
}

static esp_err_t read_regs(uint8_t reg, uint8_t *data, size_t len)
{
    return i2c_master_write_read_device(
        I2C_MASTER_NUM, BMP280_ADDR, &reg, 1, data, len, pdMS_TO_TICKS(100)
    );
}

static bool load_calibration(void)
{
    uint8_t c[24];
    if (read_regs(BMP280_REG_CALIB, c, sizeof(c)) != ESP_OK) {
        return false;
    }

    dig_T1 = (uint16_t)(c[1] << 8 | c[0]);
    dig_T2 = (int16_t)(c[3] << 8 | c[2]);
    dig_T3 = (int16_t)(c[5] << 8 | c[4]);
    dig_P1 = (uint16_t)(c[7] << 8 | c[6]);
    dig_P2 = (int16_t)(c[9] << 8 | c[8]);
    dig_P3 = (int16_t)(c[11] << 8 | c[10]);
    dig_P4 = (int16_t)(c[13] << 8 | c[12]);
    dig_P5 = (int16_t)(c[15] << 8 | c[14]);
    dig_P6 = (int16_t)(c[17] << 8 | c[16]);
    dig_P7 = (int16_t)(c[19] << 8 | c[18]);
    dig_P8 = (int16_t)(c[21] << 8 | c[20]);
    dig_P9 = (int16_t)(c[23] << 8 | c[22]);
    return true;
}

/* Bosch BMP280 datasheet compensation */
static float compensate_temperature(int32_t adc_T)
{
    int32_t var1 = ((((adc_T >> 3) - ((int32_t)dig_T1 << 1))) * ((int32_t)dig_T2)) >> 11;
    int32_t var2 = (((((adc_T >> 4) - ((int32_t)dig_T1)) * ((adc_T >> 4) - ((int32_t)dig_T1))) >> 12) *
                    ((int32_t)dig_T3)) >> 14;
    t_fine = var1 + var2;
    return (t_fine * 5 + 128) / 25600.0f; /* °C (datasheet: 0.01 °C then /100) */
}

static float compensate_pressure(int32_t adc_P)
{
    int64_t var1 = ((int64_t)t_fine) - 128000;
    int64_t var2 = var1 * var1 * (int64_t)dig_P6;
    var2 = var2 + ((var1 * (int64_t)dig_P5) << 17);
    var2 = var2 + (((int64_t)dig_P4) << 35);
    var1 = ((var1 * var1 * (int64_t)dig_P3) >> 8) + ((var1 * (int64_t)dig_P2) << 12);
    var1 = (((((int64_t)1) << 47) + var1)) * ((int64_t)dig_P1) >> 33;

    if (var1 == 0) {
        return 0;
    }

    int64_t p = 1048576 - adc_P;
    p = (((p << 31) - var2) * 3125) / var1;
    var1 = (((int64_t)dig_P9) * (p >> 13) * (p >> 13)) >> 25;
    var2 = (((int64_t)dig_P8) * p) >> 19;
    p = ((p + var1 + var2) >> 8) + (((int64_t)dig_P7) << 4);
    return p / 256.0f; /* Pa */
}

bool bmp280_init(void)
{
    ready = false;
    uint8_t id = 0;

    if (read_regs(BMP280_REG_ID, &id, 1) != ESP_OK) {
        ESP_LOGE(TAG, "chip ID read failed (check I2C / address 0x76 vs 0x77)");
        return false;
    }

    ESP_LOGI(TAG, "chip ID=0x%02X", id);
    if (id != BMP280_CHIP_ID) {
        ESP_LOGW(TAG, "Unexpected ID (BME280 is 0x60; continuing if responsive)");
    }

    write_reg(BMP280_REG_RESET, 0xB6);
    vTaskDelay(pdMS_TO_TICKS(10));

    if (!load_calibration()) {
        ESP_LOGE(TAG, "calibration read failed");
        return false;
    }

    /* Normal mode, temp x1, press x1; standby 62.5ms, filter off */
    write_reg(BMP280_REG_CTRL, 0x27);
    write_reg(BMP280_REG_CONFIG, 0x00);
    vTaskDelay(pdMS_TO_TICKS(50));

    ready = true;
    return true;
}

void bmp280_read(float *pressure_pa, float *temperature_c)
{
    if (!ready) {
        *pressure_pa = 0;
        *temperature_c = 0;
        return;
    }

    uint8_t data[6] = {0};
    if (read_regs(BMP280_REG_PRESS, data, 6) != ESP_OK) {
        *pressure_pa = 0;
        *temperature_c = 0;
        return;
    }

    int32_t adc_P = (int32_t)((data[0] << 12) | (data[1] << 4) | (data[2] >> 4));
    int32_t adc_T = (int32_t)((data[3] << 12) | (data[4] << 4) | (data[5] >> 4));

    *temperature_c = compensate_temperature(adc_T);
    *pressure_pa = compensate_pressure(adc_P);
}
