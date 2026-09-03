# 🌊 Surf Social API

Backend layer of thesis application. Stack consists of
**Node.js, Prisma, GraphQL, PostgreSQL**

---

# 🚀 Project Setup

What you will need:
- Node.js
- Docker
- pnpm (recommended)

Start by installing the packages:

```bash
pnpm install
```

---

## ⚙️ Configuring a local database

Create a `.env` file:

```env
DATABASE_URL="postgresql://admin:password@localhost:5432/thesis_db?schema=public"
OPENAI_API_KEY=
CRON_SECRET=dev-secret
FORECAST_LAMBDA_URL=http://localhost:4000
FORECAST_INGEST_USER_ID=
```

Then create and run the Docker container:

```
docker-compose up -d
```

---

## 🧠 Running the project

Lastly, execute the migrations and start the server.

```bash
pnpm create-db && pnpm dev
```

## Weekly forecast job

Heavy work lives in `@thesis/ai-forecast` (serverless-offline on port 4000). GraphQL mutations `ensureSpotForecastMonth` and `generateSpotWeeklyDescription` only check auth/visibility, then `POST` to that Lambda. Start both:

```
pnpm -F @thesis/ai-forecast dev
pnpm -F @thesis/backend dev
```

`POST /internal/jobs/weekly-forecast` with `x-cron-secret` still works; it forwards to the Lambda instead of running ingest in the API process.

Next-week ranking (`spotWeekRanking`) stays in Postgres (`angle_diff`). See `packages/ai-forecast/readme.md`.

## Seeding http://localhost:3000/graphql

```
mutation {
  createLocation(
    data: {
      name: "SC - Farol de Santa Marta"
      lat: -28.536006995392146
      lng: -48.764753917685134
      country: BRAZIL
    }
  ) {
    id
  }
}

mutation {
  createLocation(
    data: {
      name: "SC - Florianopolis"
      lat: -28.4347
      lng: -48.7606
      country: BRAZIL
    }
  ) {
    id
  }
}

mutation {
  createSpot(
    data: {
      name: "Ypuã"
      lat: -28.536006995392146
      lng: -48.764753917685134
      waveType: BEACHIE
      bottomType: SAND
      country: BRAZIL
      locationId: "3b961b2a-e4fa-4693-9cf4-83f4a6eb18fe"
    }
  ) {
    id
  }
}

mutation {
  createSpot(
    data: {
      name: "Tereza"
      lat: -28.5242626,
      lng: -48.7633147,
      waveType: BEACHIE
      bottomType: SAND
      country: BRAZIL
      locationId: "3b961b2a-e4fa-4693-9cf4-83f4a6eb18fe"
    }
  ) {
    id
  }
}

mutation {
  bulkCreateSpotForecast(
    data: [
      {
        spotId: "a7cf09d0-446b-4f21-aaa4-55a9046c6e95"
        ideal: true
        swell: 1.5
        swellDir: 90
        wind: 10
        windDir: 190
        userId: "ef169309-e640-4b81-800d-a3cc1caff033"
      }
    ]
  ) {
    ideal
  }
}
```

# Techincal specifications

## Forecast angle calculation helpers
Those two Postgres functions measure how far apart two compass directions are, treating degrees as a circle.

`angle_wrap(deg)`
Puts any angle into 0–360. Negatives and values over 360 wrap (-10 → 350, 370 → 10). NULL becomes 0.

`angle_diff(a, b)`
Shortest turn between two headings, always 0–180. Linear subtraction would say 350° and 10° are 340° apart; this says they are 20° apart.

Spot ranking uses that in SQL so “ideal swell/wind direction” matches forecast direction the way a surfer thinks about it, not as a straight number line. A 40° swell mismatch is a near miss; a 180° mismatch is the opposite way.