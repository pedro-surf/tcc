/**
 * Independent roll/pitch Kalman filters (angle + gyro bias) plus yaw integration.
 * Gyro on the sample is degrees/second, matching the buoy MQTT payload.
 */

export type ImuSample = {
  timestamp: number
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
}

type Axis = {
  angle: number
  bias: number
  p00: number
  p01: number
  p10: number
  p11: number
}

export type KalmanAttitude = {
  roll: Axis
  pitch: Axis
  yaw: number
  lastMs: number | null
  primed: boolean
}

const Q_ANGLE = 0.001
const Q_BIAS = 0.003
const R_MEASURE = 0.03
const DEG_TO_RAD = Math.PI / 180

function axis(): Axis {
  return { angle: 0, bias: 0, p00: 1, p01: 0, p10: 0, p11: 1 }
}

export function createKalmanAttitude(): KalmanAttitude {
  return {
    roll: axis(),
    pitch: axis(),
    yaw: 0,
    lastMs: null,
    primed: false,
  }
}

export function accelTilt(sample: Pick<ImuSample, 'ax' | 'ay' | 'az'>) {
  return {
    roll: Math.atan2(sample.ay, sample.az),
    pitch: Math.atan2(-sample.ax, Math.hypot(sample.ay, sample.az)),
  }
}

function angDiff(measured: number, estimated: number) {
  let delta = measured - estimated
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return delta
}

function predict(axisState: Axis, gyroRadPerSec: number, dt: number) {
  const rate = gyroRadPerSec - axisState.bias
  axisState.angle += dt * rate
  axisState.p00 += dt * (dt * axisState.p11 - axisState.p01 - axisState.p10 + Q_ANGLE)
  axisState.p01 -= dt * axisState.p11
  axisState.p10 -= dt * axisState.p11
  axisState.p11 += Q_BIAS * dt
}

function correct(axisState: Axis, measured: number) {
  const innovation = angDiff(measured, axisState.angle)
  const innovationCov = axisState.p00 + R_MEASURE
  const k0 = axisState.p00 / innovationCov
  const k1 = axisState.p10 / innovationCov
  axisState.angle += k0 * innovation
  axisState.bias += k1 * innovation
  const p00 = axisState.p00
  const p01 = axisState.p01
  axisState.p00 -= k0 * p00
  axisState.p01 -= k0 * p01
  axisState.p10 -= k1 * p00
  axisState.p11 -= k1 * p01
}

export function stepKalman(state: KalmanAttitude, sample: ImuSample) {
  const tilt = accelTilt(sample)
  if (!state.primed || state.lastMs == null) {
    state.roll.angle = tilt.roll
    state.pitch.angle = tilt.pitch
    state.yaw = 0
    state.roll.bias = 0
    state.pitch.bias = 0
    state.lastMs = sample.timestamp
    state.primed = true
    return state
  }

  let dt = (sample.timestamp - state.lastMs) / 1000
  if (!Number.isFinite(dt) || dt <= 0) dt = 0.1
  dt = Math.min(0.25, Math.max(0.0001, dt))

  predict(state.roll, sample.gx * DEG_TO_RAD, dt)
  correct(state.roll, tilt.roll)
  predict(state.pitch, sample.gy * DEG_TO_RAD, dt)
  correct(state.pitch, tilt.pitch)
  state.yaw += sample.gz * DEG_TO_RAD * dt
  state.lastMs = sample.timestamp
  return state
}

export function replayKalman(samples: ImuSample[]) {
  const state = createKalmanAttitude()
  for (const sample of samples) stepKalman(state, sample)
  return state
}
