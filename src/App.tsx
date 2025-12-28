import { useState } from "react";
import "./index.css";
import SessionDetail from "./SessionDetails";
import type { Session } from "./types";
import { loadCbor } from "./utils/loadCbor";
import { fakeSessions } from "./utils/fakeSessions";

function App() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  return (
    <div className="app">
      <h2>Surf Log</h2>
      {selectedSession && (
        <p>
          Session {selectedSession.id} - {selectedSession.samples.length} samples
        </p>
      )}

      {!selectedSession && (
        <div>
          <h2>Sessões Disponíveis</h2>
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
      <input
        type="file"
        accept=".cbor"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const samples = await loadCbor(file);
          if (samples?.length) {
            setSelectedSession({ id: `Imported-${file.name}`, samples });
          }
        }}
      />
      {selectedSession && <SessionDetail session={selectedSession} />}
    </div>
  );
}

export default App;
