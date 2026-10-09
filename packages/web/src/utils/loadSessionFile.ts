import { classify, parseCsv, type InertialSample } from '@thesis/ai-classifier'
import type { Sample, Session } from '../types'
import { loadCbor } from './loadCbor'

const GRAVITY_MPS2 = 9.80665

const DATED_NAME = /^SDCARD-(\d{4})-(\d{2})-(\d{2})-(\d+)/i

export async function loadSessionFile(file: File) {
  return loadSessionFiles([file])
}

export async function loadSessionFiles(files: File[]) {
  if (files.length === 0) throw new Error('Choose a file')

  const csvs = files.filter((file) => file.name.toLowerCase().endsWith('.csv'))
  const cbors = files.filter((file) => file.name.toLowerCase().endsWith('.cbor'))
  if (csvs.length > 0 && cbors.length > 0) {
    throw new Error('Import CSVs or one CBOR file, not both')
  }
  if (cbors.length > 1) throw new Error('CBOR import is one file at a time')
  if (cbors.length === 1) {
    const loaded = await loadCbor(cbors[0])
    return {
      label: cbors[0].name,
      data: loaded.data,
      intervalMs: loaded.intervalMs,
      skipped: [] as SkippedFile[],
    }
  }
  if (csvs.length === 0) throw new Error('Choose a .cbor or .csv file')
  return loadCsvFiles(csvs)
}

type SkippedFile = { name: string; reason: string }

async function loadCsvFiles(files: File[]) {
  const skipped: SkippedFile[] = []
  const parsed: { file: File; text: string; t0: number; samples: Sample[] }[] = []

  for (const file of files) {
    try {
      const text = await file.text()
      const t0 = sessionEpochMs(text)
      const inG = accelUnitIsG(text)
      const samples = parseCsv(text).map((sample) => {
        const scaled = inG ? scaleAccel(sample) : sample
        if (t0 > 0) scaled.timestamp += t0
        return scaled
      })
      if (samples.length === 0) {
        skipped.push({ name: file.name, reason: 'no sample rows' })
        continue
      }
      parsed.push({ file, text, t0, samples })
    } catch (err) {
      skipped.push({
        name: file.name,
        reason: err instanceof Error ? err.message : 'could not read file',
      })
    }
  }

  if (parsed.length === 0) {
    throw new Error(formatSkipped(skipped) ?? 'No usable CSV rows')
  }

  parsed.sort((a, b) => compareSessions(a.file.name, a.t0, b.file.name, b.t0))

  const data: Sample[] = parsed.flatMap((item) => item.samples)
  const first = stem(parsed[0].file.name)
  const last = stem(parsed[parsed.length - 1].file.name)
  return {
    data,
    intervalMs: intervalMsFrom(parsed[0].text, data),
    label: parsed.length === 1 ? first : `${first} … ${last}`,
    skipped,
  }
}

/** Kept slice for analysis. Replay clocks start at 0; wall time stays on the preview. */
export function sessionFromSamples(
  id: string,
  samples: Sample[],
  intervalMs: number,
): Session {
  const slice = samples.map((sample) => ({ ...sample }))
  const origin = slice[0]?.timestamp ?? 0
  if (origin !== 0) {
    for (const sample of slice) sample.timestamp -= origin
  }
  const classified = classify(slice)
  return {
    id,
    samples: slice,
    intervalMs,
    results: classified.predictions,
    predictions: classified.predictions,
    manuevers: classified.events,
    activities: classified.segments,
    classifierSlot: classified.slot,
  }
}

function formatSkipped(skipped: SkippedFile[]): string | null {
  if (skipped.length === 0) return null
  return `Skipped ${skipped.map((item) => `${item.name}: ${item.reason}`).join('; ')}`
}

function stem(name: string): string {
  return name.replace(/\.csv$/i, '')
}

/** SDCARD-YYYY-MM-DD-NNN first, then absolute t0, then leftover names. */
function compareSessions(aName: string, aT0: number, bName: string, bT0: number): number {
  const a = datedKey(aName)
  const b = datedKey(bName)
  if (a && b) {
    if (a.day !== b.day) return a.day - b.day
    return a.seq - b.seq
  }
  if (aT0 > 0 && bT0 > 0 && aT0 !== bT0) return aT0 - bT0
  if (a && !b) return -1
  if (b && !a) return 1
  return aName.localeCompare(bName)
}

function datedKey(name: string): { day: number; seq: number } | null {
  const match = name.match(DATED_NAME)
  if (!match || Number(match[1]) === 0) return null
  const day = Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3])
  return { day, seq: Number(match[4]) }
}

/** Header field written once Wi-Fi SNTP or a serial TIME line sets the clock. */
function sessionEpochMs(text: string): number {
  const match = text.match(/t0_unix_ms=(\d+)/)
  if (!match) return 0
  const t0 = Number(match[1])
  return Number.isFinite(t0) && t0 > 0 ? t0 : 0
}

/** Firmware logs accel in g. The session view and classifier use m/s². */
function accelUnitIsG(text: string): boolean {
  const match = text.match(/units=([^;\r\n]+)/i)
  if (!match) return false
  return match[1].split(',')[0]?.trim().toLowerCase() === 'g'
}

function scaleAccel(sample: InertialSample): Sample {
  return {
    ...sample,
    ax: sample.ax * GRAVITY_MPS2,
    ay: sample.ay * GRAVITY_MPS2,
    az: sample.az * GRAVITY_MPS2,
  }
}

function intervalMsFrom(text: string, samples: Sample[]): number {
  const match = text.match(/sample_hz=(\d+(?:\.\d+)?)/i)
  if (match) {
    const hz = Number(match[1])
    if (hz > 0) return Math.round(1000 / hz)
  }
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].timestamp - samples[i - 1].timestamp
    if (dt > 0) return dt
  }
  return 100
}
