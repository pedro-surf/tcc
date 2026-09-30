import type { InertialSample } from './types'

const CSV_ALIASES: Record<string, keyof InertialSample> = {
  timestamp_ms: 'timestamp',
  timestamp: 'timestamp',
  t_ms: 'timestamp',
  ax: 'ax',
  ay: 'ay',
  az: 'az',
  gx: 'gx',
  gy: 'gy',
  gz: 'gz',
  mx: 'mx',
  my: 'my',
  mz: 'mz',
  roll: 'roll',
  pitch: 'pitch',
  yaw: 'yaw',
  pressure_pa: 'pressure',
  pressure: 'pressure',
  p: 'pressure',
  temperature_c: 'temperature',
  temperature: 'temperature',
  tc: 'temperature',
  lat: 'lat',
  lon: 'lon',
  fix: 'fix',
  alt: 'alt',
  sat: 'sat',
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function sampleFromRecord(body: Record<string, unknown>, index = 0): InertialSample | null {
  const ax = num(body.ax)
  const ay = num(body.ay)
  const az = num(body.az)
  const gx = num(body.gx)
  const gy = num(body.gy)
  const gz = num(body.gz)
  if (
    ax === undefined ||
    ay === undefined ||
    az === undefined ||
    gx === undefined ||
    gy === undefined ||
    gz === undefined
  ) {
    return null
  }

  const timestamp = num(body.t_ms ?? body.timestamp ?? body.timestamp_ms) ?? index
  const sample: InertialSample = { timestamp, ax, ay, az, gx, gy, gz }
  const optional: (keyof InertialSample)[] = [
    'mx',
    'my',
    'mz',
    'roll',
    'pitch',
    'yaw',
    'pressure',
    'temperature',
    'lat',
    'lon',
    'fix',
    'alt',
    'sat',
  ]
  for (const key of optional) {
    const raw =
      key === 'pressure'
        ? (body.pressure ?? body.pressure_pa ?? body.p)
        : key === 'temperature'
          ? (body.temperature ?? body.temperature_c ?? body.tc)
          : body[key]
    const value = num(raw)
    if (value !== undefined) sample[key] = value
  }
  return sample
}

export function parseSamples(input: unknown): InertialSample[] {
  if (!Array.isArray(input)) {
    throw new Error('samples must be an array')
  }
  const samples: InertialSample[] = []
  for (let i = 0; i < input.length; i++) {
    if (!isRecord(input[i])) continue
    const sample = sampleFromRecord(input[i], i)
    if (sample) samples.push(sample)
  }
  if (samples.length === 0) throw new Error('samples did not contain an IMU row')
  return samples.sort((a, b) => a.timestamp - b.timestamp)
}

export function parseMqtt(input: unknown): InertialSample[] {
  const messages = Array.isArray(input) ? input : [input]
  const records: Record<string, unknown>[] = []
  for (const message of messages) {
    if (typeof message === 'string') {
      const parsed: unknown = JSON.parse(message)
      if (isRecord(parsed)) records.push(parsed)
      continue
    }
    if (isRecord(message)) records.push(message)
  }
  return parseSamples(records)
}

export function parseCsv(text: string): InertialSample[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (lines.length < 2) throw new Error('csv must include a header and one row')

  const header = lines[0].split(',').map((cell) => cell.trim().toLowerCase())
  const rows: Record<string, unknown>[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    const row: Record<string, unknown> = {}
    header.forEach((name, index) => {
      const key = CSV_ALIASES[name]
      if (!key) return
      row[key] = cells[index]?.trim() ?? ''
    })
    rows.push(row)
  }
  return parseSamples(rows)
}
