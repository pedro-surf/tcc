import { useQuery } from '@tanstack/react-query'
import { fetcher } from '../../graphql/fetcher'
import type { Sample } from '../../types'

const MY_SESSIONS = `
  query MySessions {
    mySessions {
      id
      notes
      date
      durationMin
      createdAt
    }
  }
`

const SESSION_BY_ID = `
  query SessionById($id: String!) {
    session(id: $id) {
      id
      notes
      date
      durationMin
      samples {
        timestamp
        ax
        ay
        az
        gx
        gy
        gz
        mx
        my
        mz
        roll
        pitch
        yaw
        pressure
        temperature
        lat
        lon
        fix
        alt
        sat
      }
    }
  }
`

const IMPORT_SESSION = `
  mutation ImportSession($data: ImportSessionInput!) {
    importSession(data: $data) {
      id
      notes
      date
      durationMin
    }
  }
`

export type SavedSessionSummary = {
  id: string
  notes: string | null
  date: string
  durationMin: number
  createdAt: string
}

type SampleRow = {
  timestamp: number
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
  mx: number | null
  my: number | null
  mz: number | null
  roll: number | null
  pitch: number | null
  yaw: number | null
  pressure: number | null
  temperature: number | null
  lat: number | null
  lon: number | null
  fix: number | null
  alt: number | null
  sat: number | null
}

export type SavedSessionDetail = {
  id: string
  notes: string | null
  date: string
  durationMin: number
  samples: SampleRow[]
}

export type ImportSessionInput = {
  notes: string
  date: string
  samples: Sample[]
  maneuvers: { timestamp: number; type: string; score: number }[]
}

function friendly(err: unknown): never {
  if (err instanceof Error && err.message === 'Authentication required') {
    throw new Error('Sign in to save this session')
  }
  throw err
}

export function useSavedSessions(enabled: boolean) {
  return useQuery({
    queryKey: ['SavedSessions'],
    enabled,
    queryFn: async () => {
      const data = await fetcher<{ mySessions: SavedSessionSummary[] }>(
        MY_SESSIONS,
      )()
      return data.mySessions
    },
  })
}

export async function fetchSavedSession(id: string) {
  try {
    const data = await fetcher<{ session: SavedSessionDetail | null }, { id: string }>(
      SESSION_BY_ID,
      { id },
    )()
    return data.session
  } catch (err) {
    friendly(err)
  }
}

export async function importSession(input: ImportSessionInput) {
  try {
    const data = await fetcher<
      { importSession: { id: string } },
      { data: ImportSessionInput }
    >(IMPORT_SESSION, { data: input })()
    return data.importSession
  } catch (err) {
    friendly(err)
  }
}

function optional(value: number | null | undefined) {
  return typeof value === 'number' ? value : undefined
}

export function samplesFromSaved(rows: SampleRow[]): Sample[] {
  return [...rows]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((row) => ({
      timestamp: row.timestamp,
      ax: row.ax,
      ay: row.ay,
      az: row.az,
      gx: row.gx,
      gy: row.gy,
      gz: row.gz,
      mx: optional(row.mx),
      my: optional(row.my),
      mz: optional(row.mz),
      roll: optional(row.roll),
      pitch: optional(row.pitch),
      yaw: optional(row.yaw),
      pressure: optional(row.pressure),
      temperature: optional(row.temperature),
      lat: optional(row.lat),
      lon: optional(row.lon),
      fix: optional(row.fix),
      alt: optional(row.alt),
      sat: optional(row.sat),
    }))
}

export function inferIntervalMs(samples: Sample[]): number {
  const deltas: number[] = []
  const limit = Math.min(samples.length, 40)
  for (let i = 1; i < limit; i++) {
    const delta = samples[i].timestamp - samples[i - 1].timestamp
    if (delta > 0) deltas.push(delta)
  }
  if (deltas.length === 0) return 100
  deltas.sort((a, b) => a - b)
  return deltas[Math.floor(deltas.length / 2)]
}
