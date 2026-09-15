# buoy-sensor-v1 (MVP)

ESP32 firmware for buoy IMU + barometer bring-up with SD CSV logging.

## Pins

| Bus | Pins |
|-----|------|
| I2C | SDA=21, SCL=22 |
| SPI (SD) | MOSI=23, MISO=19, SCLK=18, CS=5 |
| UART2 (NEO-6M) | RX=16, TX=17 (`ENABLE_GPS` in `main/config.h`) |

Full build handoff schematic (pin tables + diagram): [`SCHEMATIC.md`](SCHEMATIC.md) / [`docs/buoy-sensor-v1-schematic-v2.png`](docs/buoy-sensor-v1-schematic-v2.png)

Component notes: [`docs/`](docs/) — NEO-6M bring-up in [`docs/neo-6m.md`](docs/neo-6m.md).

## What this build does

1. Init I2C master
2. Init MPU9250 (accel + gyro + optional AK8963 mag)
3. Init BMP280 (compensated Pa / °C)
4. Complementary fusion → roll / pitch (yaw = gyro integrate); see [`components/fusion/FUSION.md`](components/fusion/FUSION.md)
5. Mount SD over SPI and append samples to a CSV session file (optional)
6. Connect Wi-Fi and publish samples over MQTT (EMQX public broker)
7. Optional NEO-6M on UART2 — cache last GGA fix onto each IMU sample (`ENABLE_GPS`)
8. Log a subset of samples over UART (1 Hz)

## SD CSV format

Files land in `/sdcard/sessions/session_<boot_ms>.csv`.

```csv
# schema=buoy-sensor-v1;version=3;sample_hz=10;device=buoy-sensor-v1;units=g,dps,uT,rad,Pa,C,deg,m
timestamp_ms,ax,ay,az,gx,gy,gz,mx,my,mz,roll,pitch,yaw,pressure_pa,temperature_c,lat,lon,fix,alt,sat
```

| Column | Meaning | Backend mapping |
|--------|---------|-----------------|
| `timestamp_ms` | ms since session open | `Sample.timestamp` |
| `ax,ay,az` | accel (g) | `Sample.ax/ay/az` |
| `gx,gy,gz` | gyro (dps) | `Sample.gx/gy/gz` |
| `mx,my,mz` | mag (µT), MPU body frame | `Sensor.data` |
| `roll,pitch,yaw` | complementary orientation (rad); raw IMU still in ax…gz | — |
| `pressure_pa` | BMP280 pressure | `Sensor.data` |
| `temperature_c` | BMP280 temp | `Sensor.data` |
| `lat,lon` | WGS84 degrees (last GGA); 0 if no lock | `Sample.lat/lon` |
| `fix` | GGA quality (0=none, 1=GPS, 2=DGPS) | `Sample.fix` |
| `alt` | altitude (m) | `Sample.alt` |
| `sat` | satellites in use | `Sample.sat` |

Rows are flushed to the card every 20 samples (~2 s at 10 Hz).

If the SD card is missing or mount fails, sampling continues over UART + MQTT.

## MQTT (EMQX)

Live samples go to the public broker (no account needed):

| | |
|--|--|
| Host | `broker.emqx.io` |
| Port | `1883` (plain MQTT) |
| Topic | `buoy-sensor-v1/buoy-<last3-mac-bytes>/sample` |
| Rate | `MQTT_PUBLISH_EVERY_N` in `main/config.h` (`1` = 10 Hz, `10` = 1 Hz) |
| Switches | `ENABLE_SD` / `ENABLE_MQTT` / `ENABLE_MAG` / `ENABLE_FUSION` / `ENABLE_GPS` in `main/config.h` |
| Wi-Fi | SSID `Pedro` in `components/wifi/wifi.c` |

Payload is JSON: raw IMU plus `roll`/`pitch`/`yaw` (rad), `p`/`tc`, and when `ENABLE_GPS=1` also `lat`/`lon`/`fix`/`alt`/`sat`.

Watch from a PC:

```bash
mosquitto_sub -h broker.emqx.io -p 1883 -t 'buoy-sensor-v1/+/sample' -v
```

Or use the [EMQX online client](https://mqttx.app/web) — connect to `broker.emqx.io:8083` (WebSocket) and subscribe to `buoy-sensor-v1/+/sample`.

The Node backend also subscribes and fans samples to the web app at **Live buoy** (`/live`) via SSE.

This broker is public: anyone can subscribe. Fine for bring-up; move to your own broker later.

UART sanity line includes `mqtt=on` once the client has a session.

## Build

```bash
idf.py set-target esp32
idf.py build
idf.py -p PORT flash monitor
```

Sanity check on monitor: `WHO_AM_I=0x71` (MPU), `AK8963 WIA=0x48`, BMP `chip ID=0x58`, `got ip`, `MQTT connected`, then `mqtt=on` on the sample line. With GPS: `NMEA GGA ok` then `fix=1` outdoors (cold start can take a minute). `ENABLE_GPS=0` skips UART2 entirely.

## Next

1. Backend ingest from MQTT (or CSV import) into `Session` + `Sample` rows
2. Drop leftover Wi-Fi example files when no longer needed
