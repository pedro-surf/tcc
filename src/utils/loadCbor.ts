/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error no types
import { decode } from 'cbor-web'
import type { Sample } from '../types'

export async function loadCbor(file: File): Promise<Sample[]> {
  const buffer = await file.arrayBuffer()
  const decoded: any = decode(new Uint8Array(buffer))

  const payload = decoded.payload
  const sensors = payload.sensors.map((s: any) => s.name)
  const intervalMs = payload.interval_ms

  return payload.values.map((row: number[], index: number) => {
    const sample: any = {
      timestamp: index * intervalMs,
    }

    sensors.forEach((name: string, i: number) => {
      // normaliza nomes
      if (name === 'accX') sample.ax = row[i]
      if (name === 'accY') sample.ay = row[i]
      if (name === 'accZ') sample.az = row[i]
      if (name === 'gyrX') sample.gx = row[i]
      if (name === 'gyrY') sample.gy = row[i]
      if (name === 'gyrZ') sample.gz = row[i]
      if (name === 'magX') sample.mx = row[i]
      if (name === 'magY') sample.my = row[i]
      if (name === 'magZ') sample.mz = row[i]
    })

    return sample as Sample
  })
}
