import { useState } from "react";
import "./index.css";
import SessionDetail from "./SessionDetails";
import type { Session } from "./types";
import { loadCbor } from "./utils/loadCbor";
import { fakeSessions } from "./utils/fakeSessions";

function App() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [secondSelectedSession, setSecondSelectedSession] =
    useState<Session | null>(null);
  const [mode, setMode] = useState<"compare" | "single">("single");

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const {
      data: samples,
      results,
      intervalMs,
      manuevers,
      prediction,
    } = await loadCbor(file);
    const payload = {
      id: `Imported-${file.name}`,
      samples,
      results,
      intervalMs,
      manuevers,
      prediction,
    };
    if (samples?.length) {
      if (selectedSession) {
        setSecondSelectedSession(payload);
      } else {
        setSelectedSession(payload);
      }
    }
  };

  const hideInputs =
    (mode === "single" && selectedSession) ||
    (mode === "compare" && selectedSession && secondSelectedSession);
  return (
    <div className="app">
      <div className="d-flex">
        <h2
          style={{ marginRight: "12px" }}
          onDoubleClick={() => setSelectedSession(null)}
        >
          Surf Log
        </h2>
        {selectedSession && (
          <span>
            Session {selectedSession.id} - {selectedSession.samples.length}{" "}
            samples
          </span>
        )}
        <select
          value={mode}
          onChange={(sel) => setMode(sel.target.value as "single" | "compare")}
        >
          <option value="compare">Compare sample pair</option>
          <option value="single">Analyse single sample</option>
        </select>
      </div>
      {!hideInputs && (
        <>
          <div className="d-flex">
            <h2>Importar .cbor (Edge Impulse)</h2>
            <input type="file" accept=".cbor" onChange={handleImportFile} />
          </div>
          <div className="d-flex">
            <h2>Sessões geradas por IA</h2>
            {fakeSessions.map((s) => (
              <button key={s.id} onClick={() => setSelectedSession(s)}>
                {s.id} ({s.samples.length} amostras)
              </button>
            ))}
            <div className="d-flex">
              {mode === "compare" && !secondSelectedSession && selectedSession
                ? "Sample 1 ok. Select Sample 2"
                : ""}{" "}
            </div>
          </div>
        </>
      )}

      {mode === "single" && selectedSession && (
        <SessionDetail session={selectedSession} />
      )}
      {mode === "compare" && selectedSession && secondSelectedSession && (
        <div className="d-flex">
          <SessionDetail
            hideManuevers
            hideReplay
            hideTimeline
            session={selectedSession}
          />
          <SessionDetail
            hideManuevers
            hideReplay
            hideTimeline
            session={secondSelectedSession}
          />
        </div>
      )}
    </div>
  );
}

export default App;
