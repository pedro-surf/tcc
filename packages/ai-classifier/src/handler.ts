import './env'
import { classify } from './classify'
import { resolveRequest, authorize, resolveJson } from './helpers'
import { parseCsv, parseMqtt, parseSamples } from './ingest'
import { ModelSlotUnavailableError, modelFormatFromEnv } from './slots/model'
import type { InertialSample, LambdaResponse, SlotId } from './types'

function slotFrom(body: Record<string, unknown>): SlotId {
  const requested = body.slot ?? process.env.CLASSIFIER_SLOT
  if (requested === 'model') return 'model'
  if (requested === undefined || requested === 'heuristic') return 'heuristic'
  throw new Error(`Unknown classifier slot: ${String(requested)}`)
}

function samplesFrom(body: Record<string, unknown>): InertialSample[] {
  if (typeof body.csv === 'string') return parseCsv(body.csv)
  if (body.mqtt !== undefined) return parseMqtt(body.mqtt)
  if (body.samples !== undefined) return parseSamples(body.samples)
  throw new Error('Provide samples, mqtt, or csv')
}

export async function handler(event: unknown = {}): Promise<LambdaResponse> {
  try {
    const { job, body } = resolveRequest(event)
    if (!authorize(event, body)) {
      return resolveJson(401, { error: 'Unauthorized' })
    }
    if (job !== 'classify') throw new Error(`Unknown job: ${job}`)

    const slot = slotFrom(body)
    const samples = samplesFrom(body)
    const result = classify(samples, {
      slot,
      modelFormat:
        typeof body.modelFormat === 'string'
          ? body.modelFormat
          : modelFormatFromEnv(process.env.CLASSIFIER_MODEL_FORMAT),
    })
    return resolveJson(200, { samples: samples.length, ...result })
  } catch (error) {
    if (error instanceof ModelSlotUnavailableError) {
      return resolveJson(501, { error: error.message, slot: 'model', format: error.format })
    }
    const message = error instanceof Error ? error.message : 'Classifier job failed'
    return resolveJson(400, { error: message })
  }
}
