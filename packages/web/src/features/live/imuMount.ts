import type { Sample } from '../../types'

/**
 * Chips-down mount: the GPS stack flipped the IMU 180° about the nose (+X).
 * +X stays forward. +Y and +Z reverse, so a flat board no longer reads as rolled 180°.
 */

export function wrapPi(angle: number) {
  let wrapped = angle
  while (wrapped > Math.PI) wrapped -= Math.PI * 2
  while (wrapped < -Math.PI) wrapped += Math.PI * 2
  return wrapped
}

export function flipImuSample<T extends Sample>(sample: T): T {
  return {
    ...sample,
    ay: -sample.ay,
    az: -sample.az,
    gy: -sample.gy,
    gz: -sample.gz,
    ...(sample.my == null ? {} : { my: -sample.my }),
    ...(sample.mz == null ? {} : { mz: -sample.mz }),
  }
}

export function flipChipAttitude(roll = 0, pitch = 0, yaw = 0) {
  return {
    roll: wrapPi(roll - Math.PI),
    pitch,
    yaw: -yaw,
  }
}
