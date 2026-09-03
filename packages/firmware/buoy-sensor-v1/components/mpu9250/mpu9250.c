#include "mpu9250.h"
#include "i2c_bus.h"
#include "config.h"

#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define MPU_ADDR        0x68
#define WHO_AM_I        0x75
#define PWR_MGMT_1      0x6B
#define USER_CTRL       0x6A
#define INT_PIN_CFG     0x37
#define ACCEL_CONFIG    0x1C
#define GYRO_CONFIG     0x1B
#define ACCEL_XOUT_H    0x3B
#define GYRO_XOUT_H     0x43

/* AK8963 sits behind the MPU aux I2C until bypass is enabled. */
#define AK8963_ADDR     0x0C
#define AK8963_WIA      0x00
#define AK8963_ST1      0x02
#define AK8963_HXL      0x03
#define AK8963_CNTL1    0x0A
#define AK8963_ASAX     0x10
#define AK8963_WIA_ID   0x48
#define AK8963_CNTL1_POWER_DOWN   0x00
#define AK8963_CNTL1_FUSE_ROM     0x0F
#define AK8963_CNTL1_CONT_16BIT   0x16  /* continuous 100 Hz, 16-bit */
#define AK8963_UT_PER_LSB         0.15f /* 16-bit mode */
#define AK8963_HOFL               0x08

/* Expected WHO_AM_I: 0x71 (MPU9250) or 0x70/0x73 on some clones */
#define MPU_WHO_AM_I_EXPECTED 0x71

static const char *TAG = "mpu9250";

static bool s_mag_ready;
static float s_mag_adj[3] = {1.0f, 1.0f, 1.0f};
static float s_mag_last[3];

#if ENABLE_MAG
static bool ak8963_init(void);
#endif

static esp_err_t write_reg(uint8_t addr, uint8_t reg, uint8_t val)
{
    uint8_t data[2] = {reg, val};
    return i2c_master_write_to_device(
        I2C_MASTER_NUM, addr, data, 2, pdMS_TO_TICKS(100)
    );
}

static esp_err_t read_regs(uint8_t addr, uint8_t reg, uint8_t *data, size_t len)
{
    return i2c_master_write_read_device(
        I2C_MASTER_NUM, addr, &reg, 1, data, len, pdMS_TO_TICKS(100)
    );
}

bool mpu9250_init(void)
{
    uint8_t who = 0;

    /* Reset then wake */
    write_reg(MPU_ADDR, PWR_MGMT_1, 0x80);
    vTaskDelay(pdMS_TO_TICKS(100));
    write_reg(MPU_ADDR, PWR_MGMT_1, 0x00);
    vTaskDelay(pdMS_TO_TICKS(50));

    if (read_regs(MPU_ADDR, WHO_AM_I, &who, 1) != ESP_OK) {
        ESP_LOGE(TAG, "WHO_AM_I read failed (check I2C wiring)");
        return false;
    }

    ESP_LOGI(TAG, "WHO_AM_I=0x%02X", who);
    if (who != MPU_WHO_AM_I_EXPECTED && who != 0x70 && who != 0x73) {
        ESP_LOGW(TAG, "Unexpected chip ID (continuing anyway)");
    }

    /* ±2g accel, ±250 dps gyro (matches scaling below) */
    write_reg(MPU_ADDR, ACCEL_CONFIG, 0x00);
    write_reg(MPU_ADDR, GYRO_CONFIG, 0x00);

#if ENABLE_MAG
    /* Disable MPU I2C master so the AK8963 appears on the shared bus. */
    write_reg(MPU_ADDR, USER_CTRL, 0x00);
    write_reg(MPU_ADDR, INT_PIN_CFG, 0x02);
    vTaskDelay(pdMS_TO_TICKS(10));

    if (!ak8963_init()) {
        ESP_LOGW(TAG, "AK8963 mag init failed — mx/my/mz will stay 0");
    }
#else
    ESP_LOGI(TAG, "AK8963 mag disabled (ENABLE_MAG=0)");
#endif

    return true;
}

void mpu9250_read_accel(float *ax, float *ay, float *az)
{
    uint8_t data[6] = {0};

    if (read_regs(MPU_ADDR, ACCEL_XOUT_H, data, 6) != ESP_OK) {
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

    if (read_regs(MPU_ADDR, GYRO_XOUT_H, data, 6) != ESP_OK) {
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

#if ENABLE_MAG
static bool ak8963_init(void)
{
    uint8_t wia = 0;
    uint8_t asa[3] = {0};

    s_mag_ready = false;

    if (read_regs(AK8963_ADDR, AK8963_WIA, &wia, 1) != ESP_OK) {
        ESP_LOGE(TAG, "AK8963 WIA read failed (bypass / wiring?)");
        return false;
    }
    ESP_LOGI(TAG, "AK8963 WIA=0x%02X", wia);
    if (wia != AK8963_WIA_ID) {
        ESP_LOGE(TAG, "Unexpected AK8963 id (want 0x48)");
        return false;
    }

    write_reg(AK8963_ADDR, AK8963_CNTL1, AK8963_CNTL1_POWER_DOWN);
    vTaskDelay(pdMS_TO_TICKS(10));
    write_reg(AK8963_ADDR, AK8963_CNTL1, AK8963_CNTL1_FUSE_ROM);
    vTaskDelay(pdMS_TO_TICKS(10));

    if (read_regs(AK8963_ADDR, AK8963_ASAX, asa, 3) != ESP_OK) {
        ESP_LOGE(TAG, "AK8963 ASA read failed");
        write_reg(AK8963_ADDR, AK8963_CNTL1, AK8963_CNTL1_POWER_DOWN);
        return false;
    }

    for (int i = 0; i < 3; i++) {
        /* Datasheet: Hadj = H * ((ASA - 128) / 256 + 1) */
        s_mag_adj[i] = ((asa[i] - 128) / 256.0f + 1.0f) * AK8963_UT_PER_LSB;
    }

    write_reg(AK8963_ADDR, AK8963_CNTL1, AK8963_CNTL1_POWER_DOWN);
    vTaskDelay(pdMS_TO_TICKS(10));
    write_reg(AK8963_ADDR, AK8963_CNTL1, AK8963_CNTL1_CONT_16BIT);
    vTaskDelay(pdMS_TO_TICKS(10));

    s_mag_last[0] = s_mag_last[1] = s_mag_last[2] = 0;
    s_mag_ready = true;
    ESP_LOGI(TAG, "AK8963 ready (16-bit, 100 Hz, ASA=0x%02X 0x%02X 0x%02X)",
             asa[0], asa[1], asa[2]);
    return true;
}
#endif

void mpu9250_read_mag(float *mx, float *my, float *mz)
{
    uint8_t st1 = 0;
    uint8_t raw[7] = {0};

    if (!s_mag_ready) {
        *mx = *my = *mz = 0;
        return;
    }

    if (read_regs(AK8963_ADDR, AK8963_ST1, &st1, 1) != ESP_OK || !(st1 & 0x01)) {
        *mx = s_mag_last[0];
        *my = s_mag_last[1];
        *mz = s_mag_last[2];
        return;
    }

    /* HXL..HZH + ST2; ST2 must be read to unlock the next sample. */
    if (read_regs(AK8963_ADDR, AK8963_HXL, raw, 7) != ESP_OK ||
        (raw[6] & AK8963_HOFL)) {
        *mx = s_mag_last[0];
        *my = s_mag_last[1];
        *mz = s_mag_last[2];
        return;
    }

    int16_t hx = (int16_t)((raw[1] << 8) | raw[0]);
    int16_t hy = (int16_t)((raw[3] << 8) | raw[2]);
    int16_t hz = (int16_t)((raw[5] << 8) | raw[4]);

    /* AK8963 axes are rotated vs MPU accel/gyro on the same package. */
    s_mag_last[0] =  hy * s_mag_adj[1];
    s_mag_last[1] =  hx * s_mag_adj[0];
    s_mag_last[2] = -hz * s_mag_adj[2];

    *mx = s_mag_last[0];
    *my = s_mag_last[1];
    *mz = s_mag_last[2];
}
