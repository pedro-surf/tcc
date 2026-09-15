# buoy-sensor-v1 docs

Wiring, schematics, and module notes for this firmware. Pin tables live in [`../SCHEMATIC.md`](../SCHEMATIC.md).

| File | What |
|------|------|
| [buoy-sensor-v1-schematic-v2.png](buoy-sensor-v1-schematic-v2.png) | Current wiring diagram (GY-91, NEO-6M, microSD, 18650) |
| [buoy-sensor-v1-schematic.png](buoy-sensor-v1-schematic.png) | v1 diagram (no GPS) |
| [neo-6m.md](neo-6m.md) | NEO-6M bring-up, NMEA, UART snippets |

Firmware GPS driver: [`../components/gps/`](../components/gps/). Toggle with `ENABLE_GPS` in [`../main/config.h`](../main/config.h).
