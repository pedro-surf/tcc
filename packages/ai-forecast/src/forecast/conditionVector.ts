const SWELL_SCALE_M = 4
const WIND_SCALE_KMH = 40
const PERIOD_SCALE_S = 20
const DEFAULT_PERIOD_S = 12

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
