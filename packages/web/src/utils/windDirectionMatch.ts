export type DirectionMatchQuality = 'excellent' | 'good' | 'fair' | 'poor'

export type DirectionMatch = {
  delta: number
  score: number
  quality: DirectionMatchQuality
  color: string
  label: string
}

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Smallest angle between two compass directions (0–180°). */
export function angleDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b))
  return diff > 180 ? 360 - diff : diff
}

export function getDirectionMatch(
  ideal: number,
  actual: number,
): DirectionMatch {
  const delta = angleDifference(ideal, actual)

  if (delta <= 15) {
    return {
      delta,
      score: Math.round(100 - delta * 1.5),
      quality: 'excellent',
      color: '#16a34a',
      label: 'Excellent',
    }
  }
  if (delta <= 45) {
    return {
      delta,
      score: Math.round(85 - (delta - 15) * 0.8),
      quality: 'good',
      color: '#84cc16',
      label: 'Good',
    }
  }
  if (delta <= 90) {
    return {
      delta,
      score: Math.round(60 - (delta - 45) * 0.6),
      quality: 'fair',
      color: '#f59e0b',
      label: 'Fair',
    }
  }
  return {
    delta,
    score: Math.round(Math.max(5, 35 - (delta - 90) * 0.35)),
    quality: 'poor',
    color: '#dc2626',
    label: 'Poor',
  }
}

export const DIRECTION_MATCH_LEGEND: Array<{
  quality: DirectionMatchQuality
  color: string
  range: string
  description: string
}> = [
  {
    quality: 'excellent',
    color: '#16a34a',
    range: '0–15° off',
    description: 'Forecast direction matches the spot ideal.',
  },
  {
    quality: 'good',
    color: '#84cc16',
    range: '16–45° off',
    description: 'Close enough; usually workable.',
  },
  {
    quality: 'fair',
    color: '#f59e0b',
    range: '46–90° off',
    description: 'Cross or side conditions; spot may be marginal.',
  },
  {
    quality: 'poor',
    color: '#dc2626',
    range: '91–180° off',
    description: 'Opposite / badly aligned for this break.',
  },
]
