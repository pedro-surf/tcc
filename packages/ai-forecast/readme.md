# AI Surf Forecast

Lambda that owns **heavy forecast work**: Open-Meteo/WWO, OpenAI, and Prisma writes.

The GraphQL API only authenticates and **invokes this function**. It does not call marine APIs or OpenAI on the request thread.

## Jobs

| HTTP | Payload | What it does |
|---|---|---|
| `POST /jobs/ingest-month` | `{ spotId, year, month, requestedById, force?, allowUpcoming? }` | Fetch + persist one calendar month |
| `POST /jobs/weekly-description` | `{ spotId, skipCooldown? }` | OpenAI weekly outlook for one spot |
| `POST /jobs/weekly-forecast` | `{}` | All public spots: force-refresh next-week months, then AI outlooks |
| EventBridge schedule | — | Same as `weekly-forecast` |

Auth: `x-cron-secret` must match `CRON_SECRET` (CloudWatch schedule is trusted).

Prisma uses the **same schema** as `@thesis/backend` (`packages/backend/prisma/schema.prisma`). Run `pnpm generate` from the backend so `@prisma/client` matches the DB.

## Local (serverless-offline)

This is the same HTTP invoke the backend uses (`FORECAST_LAMBDA_URL`).

```bash
# from repo root, with Postgres up and backend/.env present
pnpm install
pnpm -F @thesis/backend generate
pnpm -F @thesis/ai-forecast dev
```

Offline listens on **http://localhost:4000**.

```bash
curl -X POST http://localhost:4000/jobs/weekly-forecast ^
  -H "Content-Type: application/json" ^
  -H "x-cron-secret: dev-secret"
```

Direct handler (no HTTP):

```bash
pnpm -F @thesis/ai-forecast job
```

`pnpm dev` at the repo root starts this alongside the API and web app.

## Env

Loaded from `packages/ai-forecast/.env` if present, otherwise empty values are filled from `packages/backend/.env`.

| Env | Purpose |
|---|---|
| `DATABASE_URL` | Same Postgres URL as the backend |
| `CRON_SECRET` | Shared with the backend invoke header |
| `OPENAI_API_KEY` | Weekly outlooks |
| `FORECAST_PROVIDER` | `open-meteo` (default) or `wwo` |
| `FORECAST_INGEST_USER_ID` | Fallback user id for `SpotForecast.userId` |
| `WWO_API_KEY` | Only if `FORECAST_PROVIDER=wwo` |

Timeout: 300s. Size it for `spot count × (marine fetch + OpenAI)`. Sequential per spot.

## Deploy

`serverless.yml` is ready for AWS (Function URL + optional Monday 12:00 UTC schedule, disabled until you set `enabled: true`). Package Prisma’s query engine for the Lambda runtime when you deploy; local offline uses the workspace `node_modules` client.
