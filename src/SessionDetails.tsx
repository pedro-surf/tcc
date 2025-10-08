import { useState } from 'react';
import { detectManeuvers } from './utils/detectManeuvers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { Session, ManeuverEvent } from './types';

export default function SessionDetail({ session }: { session: Session }) {
  const [events, setEvents] = useState<ManeuverEvent[]>([]);

  const handleDetect = () => {
    const ev = detectManeuvers(session.samples);
    setEvents(ev);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Sessão {session.id}</h1>
      <p>{session.samples.length} amostras</p>

      <button
        onClick={handleDetect}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl w-fit"
      >
        Detectar Manobras
      </button>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={session.samples}>
            <XAxis dataKey="timestamp" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={(s) => Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2)}
              stroke="#2563eb"
              dot={false}
            />
            {events.map((e, i) => (
              <ReferenceDot
                key={i}
                x={e.timestamp}
                y={0}
                r={4}
                fill={e.type === 'manobra_composta' ? '#ef4444' : e.type === 'rotacao' ? '#f59e0b' : '#10b981'}
                label={{ value: e.type, position: 'top', fontSize: 10 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {events.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-medium">Manobras detectadas</h2>
          <ul className="mt-2 space-y-1">
            {events.map((e, i) => (
              <li key={i} className="text-sm text-gray-700">
                {new Date(e.timestamp).toLocaleTimeString()} → {e.type} ({e.score.toFixed(1)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
