import type { Sample, Session } from '../../types'
import type { TrajectoryFrame, TrajectoryRide } from '../simulation/mockTrajectory'
import { flipChipAttitude } from '../live/imuMount'

export type GpsPoint = {
  index: number
  lat: number
  lon: number
  t: number
}

const EARTH_RADIUS_M = 6_378_137

export function hasGps(sample: Sample): boolean {
  const { lat, lon, fix } = sample
  if (lat == null || lon == null) return false
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false
  if (lat === 0 && lon === 0) return false
  if (fix != null && fix <= 0) return false
  return true
}

export function gpsTrack(samples: Sample[]): GpsPoint[] {
  const points: GpsPoint[] = []
  samples.forEach((sample, index) => {
    if (!hasGps(sample)) return
    points.push({
      index,
      lat: sample.lat as number,
      lon: sample.lon as number,
      t: sample.timestamp,
    })
  })
  return points
}

export function gpsAtCursor(
  samples: Sample[],
  cursor: number,
  track: GpsPoint[] = gpsTrack(samples),
): { lat: number; lon: number } | null {
  if (track.length === 0 || samples.length === 0) return null
  const index = Math.min(Math.max(cursor, 0), samples.length - 1)
  const t = samples[index]?.timestamp ?? track[0].t
  if (t <= track[0].t) return track[0]
  const last = track[track.length - 1]
  if (t >= last.t) return last

  let hi = 1
  while (hi < track.length && track[hi].t < t) hi += 1
  const b = track[hi]
  const a = track[hi - 1]
  const span = b.t - a.t
  const u = span === 0 ? 0 : (t - a.t) / span
  return {
    lat: a.lat + (b.lat - a.lat) * u,
    lon: a.lon + (b.lon - a.lon) * u,
  }
}

export function splitGpsTrack(samples: Sample[], cursor: number) {
  const track = gpsTrack(samples)
  const position = gpsAtCursor(samples, cursor, track)
  if (!position || track.length === 0 || samples.length === 0) {
    return { track, position: null, traveled: [] as GpsPoint[], remaining: [] as GpsPoint[] }
  }

  const index = Math.min(Math.max(cursor, 0), samples.length - 1)
  const t = samples[index]?.timestamp ?? track[0].t
  const pin = { index, lat: position.lat, lon: position.lon, t }
  const traveled = track.filter((point) => point.t <= t)
  if (traveled.length === 0 || traveled[traveled.length - 1].t < t) {
    traveled.push(pin)
  }
  const remaining = [pin, ...track.filter((point) => point.t > t)]
  return { track, position, traveled, remaining }
}

function toEnu(
  lat: number,
  lon: number,
  lat0: number,
  lon0: number,
): { east: number; north: number } {
  const dLat = ((lat - lat0) * Math.PI) / 180
  const dLon = ((lon - lon0) * Math.PI) / 180
  return {
    north: dLat * EARTH_RADIUS_M,
    east: dLon * EARTH_RADIUS_M * Math.cos((lat0 * Math.PI) / 180),
  }
}

/**
 * Local-meter GPS path fitted onto the simulation ocean.
 * Speed and distance stay in real meters; x/z are scaled to the water plane.
 */
export function sessionToTrajectory(
  session: Session,
  upsideDown = false,
): TrajectoryRide | null {
  const samples = session.samples
  const track = gpsTrack(samples)
  if (samples.length === 0 || track.length < 2) return null

  const origin = track[0]
  const enu = track.map((point) => ({
    ...point,
    ...toEnu(point.lat, point.lon, origin.lat, origin.lon),
  }))

  let minE = Infinity
  let maxE = -Infinity
  let minN = Infinity
  let maxN = -Infinity
  for (const point of enu) {
    minE = Math.min(minE, point.east)
    maxE = Math.max(maxE, point.east)
    minN = Math.min(minN, point.north)
    maxN = Math.max(maxN, point.north)
  }

  const spanE = Math.max(maxE - minE, 0.5)
  const spanN = Math.max(maxN - minN, 0.5)
  const scale = Math.min(1, 48 / spanE, 22 / spanN)
  const midE = (minE + maxE) / 2
  const midN = (minN + maxN) / 2
  const toScene = (east: number, north: number) => ({
    x: 6 + (east - midE) * scale,
    z: (north - midN) * scale,
  })

  const t0 = samples[0].timestamp
  const frames: TrajectoryFrame[] = []
  let distance = 0
  let prev: { east: number; north: number; x: number; z: number; tMs: number } | null =
    null
  let yaw = 0
  let segment = 0

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    const tMs = sample.timestamp
    while (segment < enu.length - 2 && enu[segment + 1].t < tMs) segment += 1

    const a = enu[Math.min(segment, enu.length - 1)]
    const b = enu[Math.min(segment + 1, enu.length - 1)]
    const span = b.t - a.t
    const u =
      span === 0 ? 0 : Math.min(1, Math.max(0, (tMs - a.t) / span))
    const east = a.east + (b.east - a.east) * u
    const north = a.north + (b.north - a.north) * u
    const scene = toScene(east, north)

    let speed = 0
    if (prev) {
      const step = Math.hypot(east - prev.east, north - prev.north)
      distance += step
      const dt = (tMs - prev.tMs) / 1000
      speed = dt > 0 ? step / dt : 0
      if (step > 0.05) {
        yaw = Math.atan2(scene.z - prev.z, scene.x - prev.x)
      }
    }

    const roll = Number.isFinite(sample.roll) ? (sample.roll as number) : 0
    const pitch = Number.isFinite(sample.pitch) ? (sample.pitch as number) : 0
    const mounted =
      upsideDown && Number.isFinite(sample.roll)
        ? flipChipAttitude(roll, pitch, 0)
        : { roll, pitch }

    frames.push({
      t: (tMs - t0) / 1000,
      x: scene.x,
      y: 0.22,
      z: scene.z,
      pitch: mounted.pitch,
      roll: mounted.roll,
      yaw,
      speed,
      height: 0.22,
      distance,
    })
    prev = { east, north, x: scene.x, z: scene.z, tMs }
  }

  const durationSec = frames[frames.length - 1]?.t ?? 0
  return {
    id: session.id,
    label: session.id,
    durationSec,
    frames,
  }
}
