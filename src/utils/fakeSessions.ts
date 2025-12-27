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
  },
  {
    id: "S-20251008-002",
    samples: Array.from({ length: 150 }, (_, i) => ({
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
      sat: 6,
    })),
  },
];

export default fakeSessions;