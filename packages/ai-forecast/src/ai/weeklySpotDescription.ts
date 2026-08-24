import axios from 'axios'
import type { Spot, SpotForecast } from '@prisma/client'
import { prisma } from '../db'

export const WEEKLY_DESCRIPTION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export class WeeklyDescriptionCooldownError extends Error {
  readonly nextAvailableAt: Date

  constructor(nextAvailableAt: Date) {
    super('Weekly AI description can only be generated once per week')
    this.name = 'WeeklyDescriptionCooldownError'
    this.nextAvailableAt = nextAvailableAt
  }
}

export function startOfUtcWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

function pickPrimaryForecast(forecasts: SpotForecast[]): SpotForecast | null {
  if (forecasts.length === 0) return null
  return forecasts.find((f) => f.ideal) ?? forecasts[0] ?? null
}

function degreesToCompass(deg: number | null | undefined): string {
  if (deg == null || Number.isNaN(deg)) return 'unknown'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return `${dirs[idx]} (${Math.round(deg)}°)`
}

function summarizeForecasts(forecasts: SpotForecast[]): string {
  if (forecasts.length === 0) {
    return 'No forecast rows available for this spot.'
  }

  const lines = forecasts.slice(0, 16).map((f) => {
    const when = f.timestamp
      ? new Date(f.timestamp).toISOString()
      : 'unknown time'
    return [
      `- ${when}: swell ${f.swell}m @ ${degreesToCompass(f.swellDir)}`,
      `period ${f.period ?? 'n/a'}s`,
      `wind ${f.wind} @ ${degreesToCompass(f.windDir)}`,
      f.energy != null ? `energy ${f.energy}` : null,
      f.score != null ? `score ${f.score}` : null,
      f.ideal ? 'IDEAL' : null,
    ]
      .filter(Boolean)
      .join(', ')
  })

  return lines.join('\n')
}

function buildPrompt(spot: Spot, forecasts: SpotForecast[]): string {
  return [
    'You are a knowledgeable local surf forecaster.',
    'Write a concise weekly surf outlook (2–4 short paragraphs) for the spot below.',
    'Combine the spot characteristics with the forecast data.',
    'Emphasize how strong wind tolerance, strong swell tolerance, and ideal wind/swell directions affect conditions this week.',
    'Be practical and specific. Do not invent numeric forecast values that are not provided.',
    'If forecast data is sparse, say so briefly and still give useful guidance from spot characteristics.',
    '',
    'Spot:',
    `- Name: ${spot.name}`,
    `- Country: ${spot.country}`,
    `- Wave type: ${spot.waveType}`,
    `- Bottom: ${spot.bottomType}`,
    `- Difficulty: ${spot.difficulty ?? 'n/a'}`,
    `- Description: ${spot.description?.trim() || 'n/a'}`,
    `- Ideal wind direction: ${degreesToCompass(spot.idealWindDir)}`,
    `- Ideal swell direction: ${degreesToCompass(spot.idealSwellDir)}`,
    `- Strong wind tolerance (1–5): ${spot.strongWindTolerance ?? 'n/a'}`,
    `- Strong swell tolerance (1–5): ${spot.strongSwellTolerance ?? 'n/a'}`,
    '',
    'Recent / upcoming forecast rows:',
    summarizeForecasts(forecasts),
  ].join('\n')
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You write clear weekly surf outlooks for a surf forecasting app.',
        },
        { role: 'user', content: prompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60_000,
    },
  )

  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new Error('OpenAI returned an empty description')
  }
  return text
}

export function canGenerateWeeklyDescription(
  weeklyGeneratedAt: Date | null | undefined,
  now = new Date(),
): { allowed: boolean; nextAvailableAt: Date | null } {
  if (!weeklyGeneratedAt) {
    return { allowed: true, nextAvailableAt: null }
  }
  const elapsed = now.getTime() - weeklyGeneratedAt.getTime()
  if (elapsed >= WEEKLY_DESCRIPTION_COOLDOWN_MS) {
    return { allowed: true, nextAvailableAt: null }
  }
  return {
    allowed: false,
    nextAvailableAt: new Date(
      weeklyGeneratedAt.getTime() + WEEKLY_DESCRIPTION_COOLDOWN_MS,
    ),
  }
}

export async function generateAndStoreWeeklySpotDescription(
  spotId: string,
  options?: { skipCooldown?: boolean },
) {
  const spot = await prisma.spot.findUnique({ where: { id: spotId } })
  if (!spot) {
    throw new Error('Spot not found')
  }

  if (!options?.skipCooldown) {
    const cooldown = canGenerateWeeklyDescription(spot.weeklyGeneratedAt)
    if (!cooldown.allowed && cooldown.nextAvailableAt) {
      throw new WeeklyDescriptionCooldownError(cooldown.nextAvailableAt)
    }
  }

  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  let forecasts = await prisma.spotForecast.findMany({
    where: {
      spotId,
      ideal: false,
      timestamp: { gte: now, lt: weekEnd },
    },
    orderBy: [{ timestamp: 'asc' }],
    take: 56,
  })
  if (forecasts.length === 0) {
    forecasts = await prisma.spotForecast.findMany({
      where: { spotId },
      orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
      take: 24,
    })
  }

  const description = await callOpenAI(buildPrompt(spot, forecasts))
  const weeklyGeneratedAt = new Date()
  const weekStart = startOfUtcWeek(weeklyGeneratedAt)
  const primaryForecast = pickPrimaryForecast(forecasts)

  return prisma.$transaction(async (tx) => {
    await tx.spotWeeklyDescription.create({
      data: {
        spotId,
        description,
        generatedAt: weeklyGeneratedAt,
        weekStart,
        primaryForecastId: primaryForecast?.id ?? null,
      },
    })

    return tx.spot.update({
      where: { id: spotId },
      data: {
        weeklyGeneratedDescription: description,
        weeklyGeneratedAt,
      },
    })
  })
}
