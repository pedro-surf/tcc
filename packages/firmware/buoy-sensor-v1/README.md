# buoy-sensor-v1 (MVP)

ESP32 firmware for buoy IMU + barometer bring-up.

## Pins

| Bus | Pins |
|-----|------|
| I2C | SDA=21, SCL=22 |
| SPI (SD, later) | MOSI=23, MISO=19, SCLK=18, CS=5 |

## What this MVP does

1. Init I2C master
2. Init MPU9250 (accel + gyro; mag stubbed)
3. Init BMP280 (compensated Pa / °C)
4. Log samples over UART at 10 Hz

Wi-Fi upload and SD logging exist under `components/wifi` and `components/storage` but are **not** linked from `main` yet.

## Build

```bash
idf.py set-target esp32
idf.py build
idf.py -p PORT flash monitor
```

Sanity check on monitor: `WHO_AM_I=0x71` (MPU) and BMP `chip ID=0x58`, then non-zero accel (~1g on Z when flat) and plausible pressure (~100000 Pa).

## Next (after serial looks good)

1. AK8963 mag (I2C bypass + init)
2. Wi-Fi: port got-IP wait from `station_example_main.c`, real SSID/URL
3. Queue + optional SD CSV logging
4. Drop leftover Wi-Fi example files when no longer needed

## Implementation order (original WIP)

1. Functional I2C ✅
2. Accel sanity ✅
3. Gyro sanity ✅
4. Mag — stubbed
5. BMP280 ✅
6. Wi-Fi — deferred
7. SD — deferred
