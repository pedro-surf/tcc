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
2. Init MPU9250 (accel + gyro + AK8963 mag)
3. Init BMP280 (compensated Pa / °C)
4. Mount SD over SPI and append samples to a CSV session file (optional)
5. Connect Wi-Fi and publish samples over MQTT (EMQX public broker)
6. Log a subset of samples over UART (1 Hz)

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
| `mx,my,mz` | mag (µT), MPU body frame | `Sensor.data` |
| `pressure_pa` | BMP280 pressure | `Sensor.data` |
| `temperature_c` | BMP280 temp | `Sensor.data` |

Rows are flushed to the card every 20 samples (~2 s at 10 Hz).

If the SD card is missing or mount fails, sampling continues over UART + MQTT.

## MQTT (EMQX)

Live samples go to the public broker (no account needed):

| | |
|--|--|
| Host | `broker.emqx.io` |
| Port | `1883` (plain MQTT) |
| Topic | `buoy-sensor-v1/buoy-<last3-mac-bytes>/sample` |
| Rate | 1 Hz (same as UART). Set `MQTT_PUBLISH_EVERY_N` to `1` for 10 Hz |
| Wi-Fi | SSID `Pedro` in `components/wifi/wifi.c` |

Payload is JSON with the same fields as the CSV row (`t_ms`, `ax`…`az`, `gx`…`gz`, `mx`…`mz`, `p`, `tc`).

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

Sanity check on monitor: `WHO_AM_I=0x71` (MPU), `AK8963 WIA=0x48`, BMP `chip ID=0x58`, `got ip`, `MQTT connected`, then `mqtt=on` on the sample line.

## Next

1. Backend ingest from MQTT (or CSV import) into `Session` + `Sample` rows
2. Drop leftover Wi-Fi example files when no longer needed
