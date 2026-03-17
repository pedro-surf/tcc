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
      predictions,
    } = await loadCbor(file);
    const payload = {
      id: `Imported-${file.name}`,
      samples,
      results,
      intervalMs,
      manuevers,
      predictions,
    };
    if (samples?.length) {
      if (selectedSession) {
        setSecondSelectedSession(payload);
      } else {
        setSelectedSession(payload);
      }
    }
  };

  const handleSelectSession = (s: Session) => {
    if (selectedSession) {
      setSecondSelectedSession(s);
      return;
    }
    setSelectedSession(s);
  };

  const handleClear = () => {
    setSelectedSession(null);
    setSecondSelectedSession(null);
  };

  const hideInputs =
    (mode === "single" && selectedSession) ||
    (mode === "compare" && selectedSession && secondSelectedSession);
  return (
    <div className="app">
      <div className="d-flex">
        <h2 style={{ marginRight: "12px" }} onClick={handleClear}>
          Surf Log
        </h2>
        {selectedSession && mode === "single" && (
          <span>
            Session {selectedSession.id} - {selectedSession.samples.length}{" "}
            samples
          </span>
        )}
      </div>
      {!hideInputs && (
        <>
          <div className="d-flex flex-clmn">
            <h2>Import CBOR file</h2>
            <div>
              <input type="file" accept=".cbor" onChange={handleImportFile} />
            </div>
          </div>
          <div className="d-flex flex-clmn">
            <h2>Mock sessions</h2>
            {fakeSessions.map((s) => (
              <button
                className="mb-2"
                key={s.id}
                onClick={() => handleSelectSession(s)}
              >
                {s.id} ({s.samples.length} amostras)
              </button>
            ))}
            <div className="d-flex flex-clmn">
              <select
                value={mode}
                onChange={(sel) =>
                  setMode(sel.target.value as "single" | "compare")
                }
              >
                <option selected={mode === "compare"} value="compare">
                  Compare sample pair
                </option>
                <option selected={mode === "single"} value="single">
                  Analyse single sample
                </option>
              </select>
              {mode === "compare" && !secondSelectedSession && selectedSession
                ? "Sample 1 ok. Select Sample 2"
                : ""}
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
