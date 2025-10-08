import { useState } from 'react';
import './index.css';
import SessionDetail from './SessionDetails';
import type { Sample } from './utils/detectManeuvers';

export interface Session {
  id: string;
  samples: Sample[];
}

const fakeSessions: Session[] = [
  {
    id: 'S-20251008-001',
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
      sat: 7
    }))
  },
  {
    id: 'S-20251008-002',
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
      sat: 6
    }))
  }
];

function App() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Surf Log</h1>

      {!selectedSession && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Sessões Disponíveis</h2>
          {fakeSessions.map((s) => (
            <button
              key={s.id}
              className="block w-full text-left px-4 py-2 rounded-md border hover:bg-gray-100"
              onClick={() => setSelectedSession(s)}
            >
              {s.id} ({s.samples.length} amostras)
            </button>
          ))}
        </div>
      )}

      {selectedSession && (
        <div>
          <button
            className="mb-2 px-3 py-1 bg-gray-300 rounded-md hover:bg-gray-400"
            onClick={() => setSelectedSession(null)}
          >
            Voltar
          </button>
          <SessionDetail session={selectedSession} />
        </div>
      )}
    </div>
  );
}

export default App;
