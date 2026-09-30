import type { InertialSample, Quaternion } from './types'

/** ZYX yaw-pitch-roll, matching the buoy complementary frame (radians). */
export function eulerToQuaternion(roll: number, pitch: number, yaw: number): Quaternion {
  const cr = Math.cos(roll / 2)
  const sr = Math.sin(roll / 2)
  const cp = Math.cos(pitch / 2)
  const sp = Math.sin(pitch / 2)
  const cy = Math.cos(yaw / 2)
  const sy = Math.sin(yaw / 2)
  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
  }
}

export function sampleQuaternion(sample: InertialSample): Quaternion {
  const roll = sample.roll ?? 0
  const pitch = sample.pitch ?? 0
  const yaw = sample.yaw ?? 0
  if (![roll, pitch, yaw].every(Number.isFinite)) {
    return { w: 1, x: 0, y: 0, z: 0 }
  }
  return eulerToQuaternion(roll, pitch, yaw)
}
