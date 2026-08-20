const SWELL_SCALE_M = 4
const WIND_SCALE_KMH = 40
const PERIOD_SCALE_S = 20
const DEFAULT_PERIOD_S = 12
const DEFAULT_IDEAL_SWELL_M = 2
const DEFAULT_IDEAL_WIND_KMH = 10
const DEFAULT_IDEAL_PERIOD_S = 12

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export type ConditionInputs = {
  swell: number
  swellDir: number
  wind: number
  windDir: number
  period?: number | null
}

/** Stored 7-d encoding (optional). Ranking uses circular angle_diff in SQL, not this vector. */
export function encodeConditionVector(input: ConditionInputs): number[] {
  const period = input.period == null ? DEFAULT_PERIOD_S : input.period
  return [
    clamp01(input.swell / SWELL_SCALE_M),
    clamp01(input.wind / WIND_SCALE_KMH),
    clamp01(period / PERIOD_SCALE_S),
    Math.sin(toRad(input.swellDir)),
    Math.cos(toRad(input.swellDir)),
    Math.sin(toRad(input.windDir)),
    Math.cos(toRad(input.windDir)),
  ]
}

export function encodeSpotIdealVector(spot: {
  idealSwellDir?: number | null
  idealWindDir?: number | null
}): number[] | null {
  if (spot.idealSwellDir == null && spot.idealWindDir == null) return null
  return encodeConditionVector({
    swell: DEFAULT_IDEAL_SWELL_M,
    swellDir: spot.idealSwellDir ?? 180,
    wind: DEFAULT_IDEAL_WIND_KMH,
    windDir: spot.idealWindDir ?? 0,
    period: DEFAULT_IDEAL_PERIOD_S,
  })
}

export function nextWeekRange(now = new Date()): { from: Date; to: Date } {
  return {
    from: now,
    to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  }
}
