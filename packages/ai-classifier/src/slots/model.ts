import { sampleQuaternion } from '../attitude'
import type { Classification, InertialSample, ModelFormat, Quaternion } from '../types'

export class ModelSlotUnavailableError extends Error {
  readonly format: ModelFormat

  constructor(format: ModelFormat, samples: number) {
    super(
      `Model slot (${format}) has no loaded network for ${samples} samples. Export an .onnx, .tflite, or binary and set CLASSIFIER_MODEL_PATH.`,
    )
    this.name = 'ModelSlotUnavailableError'
    this.format = format
  }
}

export type ModelWindow = {
  samples: InertialSample[]
  quaternions: Quaternion[]
}

const FORMATS = new Set<ModelFormat>(['onnx', 'tflite', 'binary'])

export function modelFormatFromEnv(value: string | undefined): ModelFormat {
  if (value && FORMATS.has(value as ModelFormat)) return value as ModelFormat
  return 'onnx'
}

/** Series the supervised model will read once a runtime is linked. */
export function buildModelWindow(samples: InertialSample[]): ModelWindow {
  return {
    samples,
    quaternions: samples.map(sampleQuaternion),
  }
}

export function classifyModel(samples: InertialSample[], format: ModelFormat): Classification {
  const window = buildModelWindow(samples)
  throw new ModelSlotUnavailableError(format, window.samples.length)
}
