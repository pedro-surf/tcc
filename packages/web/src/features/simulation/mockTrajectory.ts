export type TrajectoryFrame = {
  /** seconds from ride start */
  t: number
  /** world position in meters (x along wave, y height, z across face) */
  x: number
  y: number
  z: number
  /** Euler orientation in radians */
  pitch: number
  roll: number
  yaw: number
  /** m/s */
  speed: number
  /** meters above water baseline */
  height: number
  /** cumulative path length in meters */
  distance: number
}

export type TrajectoryRide = {
  id: string
  label: string
  durationSec: number
  frames: TrajectoryFrame[]
}

/**
 * Synthetic surf trajectory for 3D replay.
 * Not derived from IMU — absolute path needs GPS or offline fusion later.
 */
export function generateMockTrajectory(
  durationSec = 18,
  sampleHz = 30,
): TrajectoryRide {
  const frames: TrajectoryFrame[] = []
  const dt = 1 / sampleHz
  let distance = 0
  let prev: { x: number; y: number; z: number } | null = null

  for (let i = 0, t = 0; t <= durationSec; i++, t = i * dt) {
    const u = t / durationSec

    // Path: paddling out → drop → bottom turn → carve along face → kickout
    const along = -8 + u * 28 + Math.sin(u * Math.PI * 2) * 1.2
    const across =
      Math.sin(u * Math.PI) * 4.5 +
      Math.sin(u * Math.PI * 3) * 0.8 +
      (u > 0.35 && u < 0.75 ? Math.sin((u - 0.35) * 10) * 1.4 : 0)
    const height =
      0.15 +
      Math.max(0, Math.sin(u * Math.PI)) * 2.4 +
      (u > 0.42 && u < 0.58 ? Math.sin((u - 0.42) / 0.16 * Math.PI) * 1.1 : 0)

    const x = along
    const y = height
    const z = across

    if (prev) {
      const dx = x - prev.x
      const dy = y - prev.y
      const dz = z - prev.z
      distance += Math.hypot(dx, dy, dz)
    }
    prev = { x, y, z }

    // Finite-diff velocity
    const look = Math.min(durationSec, t + dt)
    const u2 = look / durationSec
    const x2 = -8 + u2 * 28 + Math.sin(u2 * Math.PI * 2) * 1.2
    const z2 =
      Math.sin(u2 * Math.PI) * 4.5 +
      Math.sin(u2 * Math.PI * 3) * 0.8 +
      (u2 > 0.35 && u2 < 0.75 ? Math.sin((u2 - 0.35) * 10) * 1.4 : 0)
    const y2 =
      0.15 +
      Math.max(0, Math.sin(u2 * Math.PI)) * 2.4 +
      (u2 > 0.42 && u2 < 0.58
        ? Math.sin(((u2 - 0.42) / 0.16) * Math.PI) * 1.1
        : 0)
    const speed = Math.hypot(x2 - x, y2 - y, z2 - z) / dt

    const yaw = Math.atan2(z2 - z, x2 - x)
    const pitch = Math.atan2(y2 - y, Math.hypot(x2 - x, z2 - z)) * 0.85
    const roll =
      Math.sin(u * Math.PI * 4) * 0.35 +
      (u > 0.4 && u < 0.7 ? Math.sin((u - 0.4) * 12) * 0.55 : 0)

    frames.push({
      t,
      x,
      y,
      z,
      pitch,
      roll,
      yaw,
      speed,
      height: y,
      distance,
    })
  }

  return {
    id: 'mock-ride-001',
    label: 'Mock right-hander carve',
    durationSec,
    frames,
  }
}

export function sampleTrajectory(
  ride: TrajectoryRide,
  timeSec: number,
): TrajectoryFrame {
  const frames = ride.frames
  if (frames.length === 0) {
    return {
      t: 0,
      x: 0,
      y: 0,
      z: 0,
      pitch: 0,
      roll: 0,
      yaw: 0,
      speed: 0,
      height: 0,
      distance: 0,
    }
  }

  const t = Math.min(Math.max(timeSec, 0), ride.durationSec)
  let lo = 0
  let hi = frames.length - 1
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (frames[mid].t < t) lo = mid + 1
    else hi = mid
  }
  const i1 = Math.max(0, lo)
  const i0 = Math.max(0, i1 - 1)
  const a = frames[i0]
  const b = frames[i1]
  if (a === b || b.t === a.t) return a

  const u = (t - a.t) / (b.t - a.t)
  const lerp = (p: number, q: number) => p + (q - p) * u
  return {
    t,
    x: lerp(a.x, b.x),
    y: lerp(a.y, b.y),
    z: lerp(a.z, b.z),
    pitch: lerp(a.pitch, b.pitch),
    roll: lerp(a.roll, b.roll),
    yaw: lerp(a.yaw, b.yaw),
    speed: lerp(a.speed, b.speed),
    height: lerp(a.height, b.height),
    distance: lerp(a.distance, b.distance),
  }
}
