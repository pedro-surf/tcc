# buoy-sensor-v1 (MVP)

ESP32 firmware for buoy IMU + barometer bring-up with SD CSV logging.

## Pins

| Bus | Pins |
|-----|------|
| I2C | SDA=21, SCL=22 |
| SPI (SD) | MOSI=23, MISO=19, SCLK=18, CS=5 |

Full build handoff schematic (pin tables + diagram): [`SCHEMATIC.md`](SCHEMATIC.md) / [`docs/buoy-sensor-v1-schematic.png`](docs/buoy-sensor-v1-schematic.png)

## What this build does

1. Init I2C master
2. Init MPU9250 (accel + gyro; mag stubbed)
3. Init BMP280 (compensated Pa / °C)
4. Mount SD over SPI and append samples to a CSV session file
5. Log a subset of samples over UART (1 Hz)

Wi-Fi upload still exists under `components/wifi` but is **not** linked from `main` yet.

## SD CSV format

Files land in `/sdcard/sessions/session_<boot_ms>.csv`.

```csv
# schema=buoy-sensor-v1;version=1;sample_hz=10;device=buoy-sensor-v1;units=g,dps,uT,Pa,C
timestamp_ms,ax,ay,az,gx,gy,gz,mx,my,mz,pressure_pa,temperature_c
0,0.01200,-0.00400,0.99800,0.300,-0.100,0.000,0.000,0.000,0.000,101325.20,24.60
```

| Column | Meaning | Backend mapping |
|--------|---------|-----------------|
| `timestamp_ms` | ms since session open | `Sample.timestamp` |
| `ax,ay,az` | accel (g) | `Sample.ax/ay/az` |
| `gx,gy,gz` | gyro (dps) | `Sample.gx/gy/gz` |
| `mx,my,mz` | mag (stubbed → 0) | future / `Sensor.data` |
| `pressure_pa` | BMP280 pressure | `Sensor.data` |
| `temperature_c` | BMP280 temp | `Sensor.data` |

Rows are flushed to the card every 20 samples (~2 s at 10 Hz).

If the SD card is missing or mount fails, sampling continues over UART only.

## Build

```bash
idf.py set-target esp32
idf.py build
idf.py -p PORT flash monitor
```

Sanity check on monitor: `WHO_AM_I=0x71` (MPU), BMP `chip ID=0x58`, `SD ready`, then `Session CSV opened: /sdcard/sessions/...`.

## Next

1. AK8963 mag (I2C bypass + init)
2. Wi-Fi upload of closed session CSV
3. Backend CSV import mutation for `Session` + `Sample` rows
4. Drop leftover Wi-Fi example files when no longer needed
