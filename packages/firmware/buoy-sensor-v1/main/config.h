#pragma once

/*
 * Bring-up knobs — flip these, rebuild, flash.
 * 1 = on, 0 = off
 */
#define ENABLE_SD      0
#define ENABLE_MQTT    1
#define ENABLE_MAG     1  /* AK8963 on GY-91; extra I2C every sample */
#define ENABLE_FUSION  1  /* complementary roll/pitch (yaw = gyro integrate) */
#define ENABLE_GPS     1  /* NEO-6M on UART2; set 0 to skip UART + gps task */

/* UART2 — module TX → RX pin, module RX → TX pin. WROVER PSRAM: use 4 / 15. */
#define GPS_UART_RX_PIN  16
#define GPS_UART_TX_PIN  17
#define GPS_UART_BAUD    9600

/* 10 Hz sampling. IMU loop always runs. */
#define SAMPLE_PERIOD_MS  100

/* UART: print every N samples (10 = 1 Hz). */
#define UART_LOG_EVERY_N  10

/*
 * MQTT: publish every N samples.
 *   1  = 10 Hz  (more responsive, more broker/Wi-Fi lag risk)
 *   10 = 1 Hz   (lighter on the public EMQX broker)
 */
#define MQTT_PUBLISH_EVERY_N  1

/*
 * Complementary filter: closer to 1.0 trusts gyro more (snappier, more drift).
 * 0.98 is the usual starting point at ~50–100 Hz; at 10 Hz try 0.90–0.96.
 */
#define FUSION_ALPHA  0.98f

/* Gyro bias: keep the board still during boot. */
#define GYRO_CALIB_SAMPLES   80
#define GYRO_CALIB_DELAY_MS  5
