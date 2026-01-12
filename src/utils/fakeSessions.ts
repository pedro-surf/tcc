import type { Session } from "../types";

export const fakeSessions: Session[] = [
  {
    id: "S-20251008-001",
    samples: Array.from({ length: 200 }, (_, i) => ({
      timestamp: Date.now() + i * 10,
      ax: Math.random() * 2 - 1,
      ay: Math.random() * 2 - 1,
      az: 9.8 + Math.random() * 0.5,
      gx: Math.random() * 100 - 50,
      gy: Math.random() * 100 - 50,
      gz: Math.random() * 100 - 50,
      lat: -28.5 + Math.random() * 0.01,
      lon: -48.8 + Math.random() * 0.01,
      fix: 1,
      alt: 5 + Math.random() * 1,
      sat: 7,
    })),
    results: [{ label: "Idle", value: 0.77 }],
    intervalMs: 10,
    manuevers: [],
    prediction: { label: "Idle", value: 0.77 }
  },
  {
    id: "AI-2026-01-11-01",
    samples: generateFakeRide(),
    results: [{ label: "Idle", value: 0.77 }],
    intervalMs: 10,
    manuevers: [],
    prediction: { label: "Idle", value: 0.77 }
  },
];

export function generateFakeRide(samples = 250, intervalMs = 10): Session['samples'] {
  const out: Session['samples'] = []

  let ax = 0
  let ay = 0
  let az = 9.6

  let gx = 0
  let gy = 0
  let gz = 0

  for (let i = 0; i < samples; i++) {
    const t = i * intervalMs

    // fase da manobra (entre 40% e 60%)
    const maneuverPhase = i > samples * 0.4 && i < samples * 0.6

    // aceleração longitudinal (drop / velocidade)
    ax += (maneuverPhase ? 0.08 : 0.01) + rand(-0.02, 0.02)
    ax *= 0.98

    // lateral (carve)
    ay += (maneuverPhase ? Math.sin(i * 0.15) * 0.15 : 0) + rand(-0.01, 0.01)
    ay *= 0.9

    // vertical (gravidade + impacto)
    az = 9.6 + (maneuverPhase ? Math.sin(i * 0.2) * 1.8 : rand(-0.1, 0.1))

    // rotação (bem importante pro 3D)
    gx += (maneuverPhase ? 2.5 : 0.2) * rand(-1, 1)
    gy += (maneuverPhase ? 1.8 : 0.1) * rand(-1, 1)
    gz += (maneuverPhase ? 3.0 : 0.2) * rand(-1, 1)

    gx *= 0.85
    gy *= 0.85
    gz *= 0.85

    out.push({
      timestamp: t,
      ax,
      ay,
      az,
      gx,
      gy,
      gz
    })
  }

  return out
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default fakeSessions;