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

# ⚙️ Configuring a local database

Create a `.env` file:

```env
DATABASE_URL="postgresql://admin:password@localhost:5432/thesis_db?schema=public"
OPENAI_API_KEY=
CRON_SECRET=dev-secret
FORECAST_INGEST_USER_ID=
```

Then create and run the Docker container:

```
docker-compose up -d
```

---

# 🧠 Running the project

Lastly, execute the migrations and start the server.

```bash
pnpm create-db && pnpm dev
```

## Weekly forecast job

`@thesis/ai-forecast` is a Lambda/cron client. It does not call Open-Meteo or OpenAI. It posts to:

`POST /internal/jobs/weekly-forecast` with header `x-cron-secret: $CRON_SECRET`

That reuses ingest + weekly AI generation for every public spot. See `packages/ai-forecast/readme.md`.

Next-week ranking (`spotWeekRanking`) compares forecast swell/wind **angles** in SQL with wraparound (`angle_diff`), plus extra `SpotForecast.ideal = true` windows.

## To-Dos:
- Automation GQL: mutations; make queries name camel case
- Check if n relationships load

# Seeding http://localhost:3000/graphql

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