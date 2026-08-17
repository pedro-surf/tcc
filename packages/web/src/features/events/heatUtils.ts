export function formatClock(totalSec: number) {
  const sec = Math.max(0, Math.floor(totalSec))
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const SURFER_COLORS = [
  '#0284c7',
  '#ea580c',
  '#16a34a',
  '#7c3aed',
  '#db2777',
  '#0f766e',
]

export function surferColor(index: number) {
  return SURFER_COLORS[index % SURFER_COLORS.length]
}

export function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, n) => sum + n, 0) / values.length
}
