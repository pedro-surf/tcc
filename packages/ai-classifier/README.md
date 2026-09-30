# AI Classifier

Lambda that labels a surf session from inertial samples. The device keeps streaming IMU; this function does the classification.

The pipe has two slots. `heuristic` is the default. `model` accepts the same series (and attitude quaternions) once an `.onnx`, `.tflite`, or exported binary is loaded.

## Jobs

| HTTP | Payload | What it does |
|---|---|---|
| `POST /jobs/classify` | `{ slot?, samples? }` or `{ mqtt }` or `{ csv }` | Label one session |

Send one input:

- `samples`: JSON rows `{ timestamp, ax, ay, az, gx, gy, gz, ... }`
- `mqtt`: one buoy payload or an array, same JSON the live stream publishes (`t_ms`, accel, gyro, attitude)
- `csv`: SD-card text, header `timestamp_ms,ax,ay,az,gx,gy,gz,...`

Accel is m/s². Gyro is deg/s. `roll` / `pitch` / `yaw` are radians.

Auth: `x-cron-secret` must match `CRON_SECRET`. A direct `{ job, secret }` invoke is also accepted.

## Local

```bash
pnpm install
pnpm -F @thesis/ai-classifier check
pnpm -F @thesis/ai-classifier dev
```

Offline listens on **http://localhost:4010**.

```bash
curl -X POST http://localhost:4010/jobs/classify ^
  -H "Content-Type: application/json" ^
  -H "x-cron-secret: dev-secret" ^
  -d "{\"csv\":\"timestamp_ms,ax,ay,az,gx,gy,gz\\n0,0,0,9.8,0,0,0\\n100,0,0,9.8,0,0,0\"}"
```

Direct handler:

```bash
pnpm -F @thesis/ai-classifier job
```

## Env

Loaded from `packages/ai-classifier/.env` if present, otherwise empty values are filled from `packages/backend/.env`.

| Env | Purpose |
|---|---|
| `CRON_SECRET` | Shared invoke secret |
| `CLASSIFIER_SLOT` | `heuristic` (default) or `model` |
| `CLASSIFIER_MODEL_FORMAT` | `onnx`, `tflite`, or `binary` |
| `CLASSIFIER_MODEL_PATH` | Weights file, read when the model runtime is linked |
