# AI Surf Forecast

Weekly batch job for surf forecasts and AI outlooks.

This package is a **thin Lambda / cron client**. It does not call Open-Meteo or OpenAI itself. The backend already proxies those APIs and owns ingest + ranking + weekly descriptions, so the job only triggers:

`POST /internal/jobs/weekly-forecast`

That endpoint, for every public spot:

1. Refreshes the current (and if needed next) month of marine forecast via the existing ingest path (`ensureSpotForecastMonth` / `ingestSpotMonth`)
2. Writes `SpotForecast` rows (calendar fill) so next-week ranking can run in SQL
3. Generates the weekly AI outlook (`generateAndStoreWeeklySpotDescription`) from those forecast rows

The web app then ranks spots by **circular angle proximity** in Postgres (`angle_diff`: 350° is close to 10°, negatives wrap), using spot `idealWindDir` / `idealSwellDir` plus extra `SpotForecast.ideal = true` windows.

## Run locally

From the repo root, with the backend already running:

```bash
cd packages/ai-forecast
pnpm install
BACKEND_URL=http://localhost:3000 CRON_SECRET=dev-secret pnpm job
```

Backend `.env` must include the same `CRON_SECRET`. Optional `FORECAST_INGEST_USER_ID` if spots have no `createdById`.

## Lambda / cron

Export `handler` from `src/handler.ts` (AWS Lambda Node 20+, EventBridge schedule `cron(0 12 ? * MON *)` or similar).

| Env | Purpose |
|---|---|
| `BACKEND_URL` | Backend origin, e.g. `https://api.example.com` |
| `CRON_SECRET` | Must match backend `CRON_SECRET` (`x-cron-secret` header) |

Timeout: size it for `spot count × (marine fetch + OpenAI)`. Sequential per spot.

## Why not call marine/OpenAI from the Lambda?

Those live behind the backend so we keep one ingest path, one cache (`SpotForecastFetch`), and one ranking query. The Lambda is only the weekly trigger.
