# Sensor fusion (MPU-9250)

Raw IMU stays untouched (`ax…gz` in g / dps). Fusion writes `roll`, `pitch`, `yaw` in **radians**.

## Pipeline

```text
MPU9250  →  raw sensor_data_t  →  fusion backend  →  roll / pitch / yaw
```

Swap backends later (`complementary` → Kalman / EKF) via `fusion_backend_t` in `fusion.h`. GPS is not used.

## Filter

Complementary (default when `ENABLE_FUSION=1`):

- Accel: gravity tilt (`atan2`) — corrects gyro drift, noisy when the board accelerates
- Gyro: integrate `ω * dt` — fast motion, drifts without accel
- `alpha` (`FUSION_ALPHA`, default `0.98`): weight on gyro

Yaw is gyro-Z integrate only (drifts). Mag heading comes later when `ENABLE_MAG` is validated.

## Gyro units and dt

| Item | Value |
|------|--------|
| `gx,gy,gz` logged | **dps**, as read from the chip (`±250 dps` scale, `/131`) |
| Fusion input | `(gyro_dps - bias_dps) * π/180` → **rad/s** |
| Bias | average of `GYRO_CALIB_SAMPLES` at boot — keep the board still |
| `dt` | `(timestamp_us - prev) / 1e6`, clamped to `(0.0001, 0.25]` s |

## MPU-9250 / GY-91 axes (chip frame)

Looking at the **top** of the GY-91 (chips facing you), InvenSense right-handed frame:

| Chip | Positive direction |
|------|--------------------|
| **+X** | toward the end marked on the silkscreen (usually the short edge opposite the row of analog pins) |
| **+Y** | 90° left of +X on the PCB |
| **+Z** | out of the board (toward you) |

Euler used by the filter (aerospace / right-handed):

| Angle | Axis | Positive sense (chip) |
|-------|------|------------------------|
| **Roll** | +X | +Y toward +Z (right side down if +X is forward) |
| **Pitch** | +Y | nose up if +X is forward |
| **Yaw** | +Z | left turn (CCW from above) |

## Board (prancha) — assumed mount

Until a jig is fixed, treat this as the **working convention**:

1. GY-91 **flat on the deck**, chips up (`+Z` sky / away from the foam)
2. Align module **+X with the nose** (forward)
3. Then **+Y** points to the **left rail** (starboard is −Y)

| Surf motion | Filter output |
|-------------|---------------|
| Nose up | +pitch |
| Lean onto the left rail | +roll |
| Rotate toward the left | +yaw (short-term) |

If the module is rotated 90° on the deck, swap/sign the axes in a later remap — do **not** bake that into acquisition; keep raw chip-frame data.

## Offline

CSV / MQTT still have raw `ax…mz`. Re-run complementary, Kalman, or EKF on the same file without flashing.
