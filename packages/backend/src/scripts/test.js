import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const API_KEY = process.env.WWO_API_KEY

if (!API_KEY) {
  throw new Error('Missing WWO_API_KEY in .env')
}

const LAT = -28.4347
const LNG = -48.7606

const OUTPUT_FILE = path.resolve('data/forecast.json')

// ensure folder exists
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })

function buildTimestamp(dateStr, timeStr) {
  const hour = parseInt(timeStr) / 100

  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCHours(hour)

  return date.toISOString()
}

async function fetchMarine() {
  try {
    const url = 'https://api.worldweatheronline.com/premium/v1/marine.ashx'

    const params = {
      key: API_KEY,
      format: 'json',
      q: `${LAT},${LNG}`,
      tide: 'yes',
      tp: 3,
    }

    const res = await axios.get(url, { params })

    const weather = res.data.data.weather

    const flat = []

    for (const day of weather) {
      for (const h of day.hourly) {
        flat.push({
          timestamp: buildTimestamp(day.date, h.time),

          lat: LAT,
          lng: LNG,

          swellHeight: Number(h.swellHeight_m),
          swellDir: Number(h.swellDir),

          windSpeed: Number(h.windspeedKmph),
          windDir: Number(h.winddirDegree),

          waterTemp: Number(h.waterTemp_C),

          // optional extras
          swellPeriod: Number(h.swellPeriod_secs),
        })
      }
    }

    // read existing file if exists
    let existing = []
    if (fs.existsSync(OUTPUT_FILE)) {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'))
    }

    const merged = [...existing, ...flat]

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2))

    console.log(`✅ Saved ${flat.length} records`)
    console.log(`📁 File: ${OUTPUT_FILE}`)

  } catch (err) {
    console.error('❌ ERROR:', err.response?.data || err.message)
  }
}

fetchMarine()