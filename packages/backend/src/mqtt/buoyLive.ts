import { EventEmitter } from 'node:events'
import mqtt from 'mqtt'

export type BuoySample = {
  device: string
  timestamp: number
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
  mx: number
  my: number
  mz: number
  pressure: number
  temperature: number
}

const MQTT_URL = process.env.MQTT_BROKER_URL ?? 'mqtt://broker.emqx.io:1883'
const MQTT_TOPIC = process.env.MQTT_TOPIC ?? 'buoy-sensor-v1/+/sample'
const BUFFER_MAX = 600

const bus = new EventEmitter()
bus.setMaxListeners(50)

const recent: BuoySample[] = []
let connected = false

function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function payloadToUtf8(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (Buffer.isBuffer(raw)) return raw.toString('utf8')
  if (raw instanceof Uint8Array) return Buffer.from(raw).toString('utf8')
  return String(raw ?? '')
}

function asObject(parsed: unknown): Record<string, unknown> | null {
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return null
    }
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>
  }
  return null
}

function parseSample(topic: string, raw: unknown): BuoySample | null {
  const text = payloadToUtf8(raw).trim()
  if (!text) {
    console.warn(`[buoy-mqtt] empty payload on ${topic}`)
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    console.warn(`[buoy-mqtt] not JSON on ${topic}: ${text.slice(0, 180)}`)
    return null
  }

  const body = asObject(parsed)
  if (!body) {
    console.warn(`[buoy-mqtt] unexpected JSON on ${topic}: ${text.slice(0, 180)}`)
    return null
  }

  const deviceFromTopic = topic.split('/')[1]
  const device =
    typeof body.device === 'string' && body.device
      ? body.device
      : deviceFromTopic || 'unknown'

  const sample: BuoySample = {
    device,
    timestamp: num(body.t_ms ?? body.timestamp),
    ax: num(body.ax),
    ay: num(body.ay),
    az: num(body.az),
    gx: num(body.gx),
    gy: num(body.gy),
    gz: num(body.gz),
    mx: num(body.mx),
    my: num(body.my),
    mz: num(body.mz),
    pressure: num(body.p ?? body.pressure),
    temperature: num(body.tc ?? body.temperature),
  }

  const looksEmpty =
    sample.timestamp === 0 &&
    sample.ax === 0 &&
    sample.ay === 0 &&
    sample.az === 0 &&
    !('t_ms' in body) &&
    !('ax' in body)

  if (looksEmpty) {
    console.warn(
      `[buoy-mqtt] ignored empty message on ${topic} keys=${Object.keys(body).join(',') || '(none)'} raw=${text.slice(0, 180)}`,
    )
    return null
  }

  return sample
}

function pushSample(sample: BuoySample) {
  recent.push(sample)
  if (recent.length > BUFFER_MAX) {
    recent.splice(0, recent.length - BUFFER_MAX)
  }
  bus.emit('sample', sample)
}

export function getRecentSamples(): BuoySample[] {
  return recent.slice()
}

export function isBuoyMqttConnected(): boolean {
  return connected
}

export function onBuoySample(handler: (sample: BuoySample) => void): () => void {
  bus.on('sample', handler)
  return () => bus.off('sample', handler)
}

export function startBuoyMqtt() {
  const client = mqtt.connect(MQTT_URL, {
    clientId: `surf-log-backend-${Math.random().toString(16).slice(2, 8)}`,
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 3000,
  })

  let logged = 0

  client.on('connect', () => {
    connected = true
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error(`[buoy-mqtt] subscribe failed: ${err.message}`)
        return
      }
      console.log(`[buoy-mqtt] subscribed ${MQTT_TOPIC} on ${MQTT_URL}`)
    })
  })

  client.on('reconnect', () => {
    connected = false
  })

  client.on('close', () => {
    connected = false
  })

  client.on('error', (err) => {
    console.error(`[buoy-mqtt] ${err.message}`)
  })

  client.on('message', (topic, payload) => {
    if (logged < 8) {
      console.log(`[buoy-mqtt] ${topic} ${payloadToUtf8(payload).slice(0, 300)}`)
      logged += 1
    }
    const sample = parseSample(topic, payload)
    if (sample) {
      pushSample(sample)
    }
  })
}
