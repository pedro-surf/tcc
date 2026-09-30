export type SlotId = 'heuristic' | 'model'

export type ModelFormat = 'onnx' | 'tflite' | 'binary'

/** Body-frame IMU sample. Accel is m/s², gyro is deg/s, attitude is radians. */
export type InertialSample = {
  timestamp: number
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
  mx?: number
  my?: number
  mz?: number
  roll?: number
  pitch?: number
  yaw?: number
  pressure?: number
  temperature?: number
  lat?: number
  lon?: number
  fix?: number
  alt?: number
  sat?: number
}

export type ActivityLabel =
  | 'idle'
  | 'paddling'
  | 'dropping'
  | 'riding'
  | 'impacto'
  | 'rotacao'
  | 'manobra_composta'

export type ActivitySegment = {
  startMs: number
  endMs: number
  label: ActivityLabel
  score: number
}

export type ClassifierEvent = {
  timestamp: number
  type: ActivityLabel
  score: number
}

export type ClassifierPrediction = {
  label: ActivityLabel
  value: number
}

export type Classification = {
  slot: SlotId
  events: ClassifierEvent[]
  segments: ActivitySegment[]
  predictions: ClassifierPrediction[]
}

export type Quaternion = {
  w: number
  x: number
  y: number
  z: number
}

export type LambdaResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}
