import type { ActivityLabel, ActivitySegment, Classification, ClassifierEvent, ClassifierPrediction, InertialSample } from '../types'

const GRAVITY = 9.80665
const ACC_IMPACT = 6
const GYR_TURN = 100
const AX_DROP = 3.5
const GYR_QUIET = 45
const PADDLE_PEAK = 2
const RIDE_AX = 0.5

const SMOOTH_MS = 250
const PADDLE_WINDOW_MS = 1000

const MIN_HOLD_MS: Record<ActivityLabel, number> = {
  impacto: 100,
  rotacao: 250,
  manobra_composta: 400,
  dropping: 400,
  paddling: 700,
  riding: 500,
  idle: 500,
}

const EVENT_LABELS = new Set<ActivityLabel>([
  'paddling',
  'dropping',
  'impacto',
  'rotacao',
  'manobra_composta',
])

function hypot3(x: number, y: number, z: number) {
  return Math.hypot(x, y, z)
}

function stepMs(samples: InertialSample[]) {
  if (samples.length < 2) return 100
  const dt = samples[1].timestamp - samples[0].timestamp
  return dt > 0 ? dt : 100
}

function radiusFor(dt: number, windowMs: number) {
  return Math.max(1, Math.round(windowMs / dt / 2))
}

function smooth(values: number[], radius: number) {
  return values.map((_, index) => {
    let sum = 0
    let count = 0
    const start = Math.max(0, index - radius)
    const end = Math.min(values.length - 1, index + radius)
    for (let i = start; i <= end; i++) {
      sum += values[i]
      count += 1
    }
    return sum / count
  })
}

function peakToPeak(values: number[], radius: number) {
  return values.map((_, index) => {
    let lo = Infinity
    let hi = -Infinity
    const start = Math.max(0, index - radius)
    const end = Math.min(values.length - 1, index + radius)
    for (let i = start; i <= end; i++) {
      lo = Math.min(lo, values[i])
      hi = Math.max(hi, values[i])
    }
    return hi - lo
  })
}

function candidate(
  aDyn: number,
  gMag: number,
  ax: number,
  axPeak: number,
): ActivityLabel {
  if (aDyn > ACC_IMPACT && gMag > GYR_TURN) return 'manobra_composta'
  if (aDyn > ACC_IMPACT) return 'impacto'
  if (gMag > GYR_TURN) return 'rotacao'
  if (ax > AX_DROP && gMag < GYR_QUIET) return 'dropping'
  if (axPeak > PADDLE_PEAK && gMag < GYR_QUIET) return 'paddling'
  if (Math.abs(ax) > RIDE_AX && gMag < GYR_QUIET) return 'riding'
  return 'idle'
}

type Run = { label: ActivityLabel; start: number; end: number }

function runsOf(labels: ActivityLabel[]): Run[] {
  const runs: Run[] = []
  for (let i = 0; i < labels.length; i++) {
    const previous = runs[runs.length - 1]
    if (previous && previous.label === labels[i]) previous.end = i + 1
    else runs.push({ label: labels[i], start: i, end: i + 1 })
  }
  return runs
}

function paint(runs: Run[], length: number): ActivityLabel[] {
  const labels = new Array<ActivityLabel>(length)
  for (const run of runs) {
    for (let i = run.start; i < run.end; i++) labels[i] = run.label
  }
  return labels
}

function attenuate(labels: ActivityLabel[], times: number[]): ActivityLabel[] {
  let runs = runsOf(labels)
  let changed = true
  while (changed && runs.length > 1) {
    changed = false
    const next: Run[] = []
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i]
      const duration = times[run.end - 1] - times[run.start]
      if (duration >= MIN_HOLD_MS[run.label]) {
        const previous = next[next.length - 1]
        if (previous && previous.label === run.label) previous.end = run.end
        else next.push({ ...run })
        continue
      }
      changed = true
      if (next.length > 0) next[next.length - 1].end = run.end
      else if (i + 1 < runs.length) runs[i + 1] = { ...runs[i + 1], start: run.start }
      else next.push({ ...run })
    }
    runs = next
  }
  return paint(runs, labels.length)
}

function segmentScore(
  label: ActivityLabel,
  aDyn: number[],
  gMag: number[],
  ax: number[],
  axPeak: number[],
  start: number,
  end: number,
) {
  let score = 0
  for (let i = start; i < end; i++) {
    if (label === 'impacto') score = Math.max(score, aDyn[i])
    else if (label === 'rotacao') score = Math.max(score, gMag[i])
    else if (label === 'manobra_composta') score = Math.max(score, aDyn[i] + gMag[i] / 50)
    else if (label === 'dropping') score = Math.max(score, ax[i])
    else if (label === 'paddling') score = Math.max(score, axPeak[i])
    else score = Math.max(score, aDyn[i])
  }
  return score
}

export function classifyHeuristic(samples: InertialSample[]): Classification {
  const dt = stepMs(samples)
  const times = samples.map((sample) => sample.timestamp)
  const ax = samples.map((sample) => sample.ax)
  const aDyn = samples.map((sample) => Math.abs(hypot3(sample.ax, sample.ay, sample.az) - GRAVITY))
  const gMag = samples.map((sample) => hypot3(sample.gx, sample.gy, sample.gz))
  const smoothRadius = radiusFor(dt, SMOOTH_MS)
  const paddleRadius = radiusFor(dt, PADDLE_WINDOW_MS)
  const axSmooth = smooth(ax, smoothRadius)
  const aSmooth = smooth(aDyn, smoothRadius)
  const gSmooth = smooth(gMag, smoothRadius)
  const axPeak = peakToPeak(ax, paddleRadius)

  const raw = samples.map((_, index) =>
    candidate(aSmooth[index], gSmooth[index], axSmooth[index], axPeak[index]),
  )
  const labels = attenuate(raw, times)
  const runs = runsOf(labels)
  const endPad = samples.length > 1 ? dt : 0

  const segments: ActivitySegment[] = runs.map((run, index) => {
    const last = index === runs.length - 1
    return {
      startMs: times[run.start],
      endMs: last ? times[run.end - 1] + endPad : times[runs[index + 1].start],
      label: run.label,
      score: segmentScore(run.label, aDyn, gMag, ax, axPeak, run.start, run.end),
    }
  })

  const events: ClassifierEvent[] = segments
    .filter((segment) => EVENT_LABELS.has(segment.label))
    .map((segment) => ({
      timestamp: segment.startMs,
      type: segment.label,
      score: segment.score,
    }))

  const totals = new Map<ActivityLabel, number>()
  let total = 0
  for (const segment of segments) {
    const duration = Math.max(0, segment.endMs - segment.startMs)
    totals.set(segment.label, (totals.get(segment.label) ?? 0) + duration)
    total += duration
  }

  const predictions: ClassifierPrediction[] = [...totals.entries()]
    .map(([label, duration]) => ({
      label,
      value: total > 0 ? duration / total : 0,
    }))
    .sort((a, b) => b.value - a.value)

  return { slot: 'heuristic', events, segments, predictions }
}
