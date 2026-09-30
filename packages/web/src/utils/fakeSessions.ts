import { classify, surfPhases, type SurfKind } from '@thesis/ai-classifier'
import type { Sample, Session } from '../types'

const ORIGINS = {
  cutback: { lat: -27.6025, lon: -48.432 },
  wipeout: { lat: -27.6295, lon: -48.4455 },
} as const

export const fakeSessions: Session[] = [
  buildFakeSession('AI-2026-10-08-001', 'cutback'),
  buildFakeSession('AI-2026-01-11-001', 'wipeout'),
]

function buildFakeSession(id: string, kind: SurfKind): Session {
  const samples = generateFakeRide(600, 50, ORIGINS[kind], kind)
  const classified = classify(samples)
  return {
    id,
    samples,
    intervalMs: 50,
    results: classified.predictions,
    predictions: classified.predictions,
    manuevers: classified.events,
    activities: classified.segments,
    classifierSlot: classified.slot,
  }
}

export function generateFakeRide(
  samples = 600,
  intervalMs = 50,
  origin: { lat: number; lon: number } = ORIGINS.cutback,
  kind: SurfKind = 'cutback',
): Sample[] {
  return surfPhases({ samples, intervalMs, kind }).map((sample, index) => {
    const u = samples <= 1 ? 0 : index / (samples - 1)
    const north = u * 70
    const east = 10 + Math.sin(u * Math.PI * 2) * 14
    const gps = offsetMeters(origin.lat, origin.lon, east, north)
    return {
      ...sample,
      lat: gps.lat,
      lon: gps.lon,
      fix: 1,
      alt: 1.2,
      sat: 9,
    }
  })
}

function offsetMeters(lat: number, lon: number, east: number, north: number) {
  const latRad = (lat * Math.PI) / 180
  return {
    lat: lat + north / 111_320,
    lon: lon + east / (111_320 * Math.cos(latRad)),
  }
}

export default fakeSessions
