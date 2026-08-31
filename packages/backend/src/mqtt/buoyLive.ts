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
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function parseSample(topic: string, raw: Buffer): BuoySample | null {
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw.toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }

  const deviceFromTopic = topic.split('/')[1]
  const device =
    typeof body.device === 'string' && body.device
      ? body.device
      : deviceFromTopic || 'unknown'

  return {
    device,
    timestamp: num(body.t_ms),
    ax: num(body.ax),
    ay: num(body.ay),
    az: num(body.az),
    gx: num(body.gx),
    gy: num(body.gy),
    gz: num(body.gz),
    mx: num(body.mx),
    my: num(body.my),
    mz: num(body.mz),
    pressure: num(body.p),
    temperature: num(body.tc),
  }
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
    clean: true,
    reconnectPeriod: 3000,
  })

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
    const sample = parseSample(topic, payload)
    if (sample) {
      pushSample(sample)
    }
  })
}
