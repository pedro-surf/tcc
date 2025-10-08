// utils/detectManeuvers.ts

export interface Sample {
  timestamp: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  lat?: number;
  lon?: number;
  fix?: number;
  alt?: number;
  sat?: number;
}

export interface ManeuverEvent {
  timestamp: number;
  type: 'impacto' | 'rotacao' | 'manobra_composta';
  score: number;
}

export interface DetectParams {
  rate?: number;
  accThr?: number;
  gyrThr?: number;
  minSep?: number; // segundos
}

export function detectManeuvers(samples: Sample[], params: DetectParams = {}): ManeuverEvent[] {
  // const RATE = params.rate || 100;
  const ACC_THR = params.accThr || 3.0; // m/s^2
  const GYRO_THR = params.gyrThr || 150.0; // deg/s
  const MIN_SEP = (params.minSep || 0.5) * 1000; // ms

  const mag = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

  const events: ManeuverEvent[] = [];
  let lastEventTs = -Infinity;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const aMag = Math.max(0, Math.abs(mag(s.ax, s.ay, s.az) - 9.80665));
    const gMag = mag(s.gx, s.gy, s.gz);

    let type: ManeuverEvent['type'] | null = null;
    let score = 0;

    if (aMag > ACC_THR && gMag > GYRO_THR) {
      type = 'manobra_composta';
      score = aMag + gMag / 100;
    } else if (aMag > ACC_THR) {
      type = 'impacto';
      score = aMag;
    } else if (gMag > GYRO_THR) {
      type = 'rotacao';
      score = gMag;
    }

    if (type) {
      const now = s.timestamp;
      if (now - lastEventTs > MIN_SEP) {
        events.push({ timestamp: now, type, score });
        lastEventTs = now;
      }
    }
  }

  return events;
}

/*
Exemplo de uso:
import { detectManeuvers } from './utils/detectManeuvers';
const events = detectManeuvers(samples);
*/
