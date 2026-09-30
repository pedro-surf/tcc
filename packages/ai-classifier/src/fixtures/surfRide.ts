import type { InertialSample } from '../types'

export type SurfKind = 'cutback' | 'wipeout'

type Mode = 'paddle' | 'drop' | 'ride' | 'cutback' | 'impact' | 'compound' | 'idle'

type Phase = { until: number; mode: Mode }

const PHASES: Record<SurfKind, Phase[]> = {
  cutback: [
    { until: 0.2, mode: 'paddle' },
    { until: 0.28, mode: 'drop' },
    { until: 0.52, mode: 'ride' },
    { until: 0.62, mode: 'cutback' },
    { until: 0.66, mode: 'impact' },
    { until: 0.8, mode: 'ride' },
    { until: 1, mode: 'paddle' },
  ],
  wipeout: [
    { until: 0.18, mode: 'paddle' },
    { until: 0.26, mode: 'drop' },
    { until: 0.46, mode: 'ride' },
    { until: 0.54, mode: 'compound' },
    { until: 0.68, mode: 'idle' },
    { until: 1, mode: 'paddle' },
  ],
}

function modeAt(kind: SurfKind, u: number): Mode {
  for (const phase of PHASES[kind]) {
    if (u <= phase.until) return phase.mode
  }
  return 'idle'
}

function imu(mode: Mode, t: number) {
  const stroke = Math.sin(2 * Math.PI * 0.75 * t)
  if (mode === 'paddle') {
    return { ax: 2.4 * stroke, ay: 0.15 * stroke, az: 9.8, gx: 5, gy: 4, gz: 6 }
  }
  if (mode === 'drop') {
    return { ax: 5.8, ay: 0.2, az: 6.2, gx: 12, gy: 18, gz: 25 }
  }
  if (mode === 'ride') {
    return { ax: 1.3, ay: 0.25 * Math.sin(t), az: 9.8, gx: 8, gy: 6, gz: 10 }
  }
  if (mode === 'cutback') {
    return { ax: 1.1, ay: 0.4, az: 10.2, gx: 20, gy: 15, gz: 210 }
  }
  if (mode === 'impact') {
    return { ax: 1, ay: 0.4, az: 32, gx: 10, gy: 8, gz: 12 }
  }
  if (mode === 'compound') {
    return { ax: 2, ay: 1, az: 24, gx: 40, gy: 20, gz: 190 }
  }
  return { ax: 0.04, ay: 0.02, az: 9.8, gx: 1, gy: 1, gz: 2 }
}

export function surfPhases(options?: {
  samples?: number
  intervalMs?: number
  kind?: SurfKind
}): InertialSample[] {
  const count = options?.samples ?? 600
  const intervalMs = options?.intervalMs ?? 50
  const kind = options?.kind ?? 'cutback'
  const out: InertialSample[] = []
  for (let i = 0; i < count; i++) {
    const u = count <= 1 ? 0 : i / (count - 1)
    const t = (i * intervalMs) / 1000
    out.push({
      timestamp: i * intervalMs,
      ...imu(modeAt(kind, u), t),
    })
  }
  return out
}
