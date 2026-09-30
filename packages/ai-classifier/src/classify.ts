import { classifyHeuristic } from './slots/heuristic'
import { classifyModel, modelFormatFromEnv } from './slots/model'
import type { ActivityLabel, ActivitySegment, Classification, InertialSample, SlotId } from './types'

export type ClassifyOptions = {
  slot?: SlotId
  modelFormat?: string
}

export function classify(samples: InertialSample[], options: ClassifyOptions = {}): Classification {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('samples are required')
  }
  const slot = options.slot ?? 'heuristic'
  if (slot === 'model') {
    return classifyModel(samples, modelFormatFromEnv(options.modelFormat))
  }
  if (slot !== 'heuristic') {
    throw new Error(`Unknown classifier slot: ${slot}`)
  }
  return classifyHeuristic(samples)
}

export function labelAt(segments: ActivitySegment[], timestamp: number): ActivityLabel | null {
  if (segments.length === 0) return null
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const last = i === segments.length - 1
    if (timestamp >= segment.startMs && (timestamp < segment.endMs || last)) {
      return segment.label
    }
  }
  return segments[segments.length - 1].label
}
