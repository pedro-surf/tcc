import type { Session } from "../types";

export const fakeSessions: Session[] = [
  {
    id: "AI-2026-10-08-001",
    samples: generateFakeRide(),
    results: [{ label: "Idle", value: 0.77 }],
    intervalMs: 10,
    manuevers: [],
    predictions: [{ label: "Idle", value: 0.77 }],
  },
  {
    id: "AI-2026-01-11-001",
    samples: generateFakeRide(),
    results: [{ label: "Idle", value: 0.77 }],
    intervalMs: 10,
    manuevers: [],
    predictions: [{ label: "Idle", value: 0.77 }, { label: "Pop", value: 0.35 }],
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