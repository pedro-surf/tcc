import { useEffect, useState } from "react";
import { detectManeuvers } from "./utils/detectManeuvers";
import type { Session, ManeuverEvent } from "./types";
import SensorCharts from "./SensorCharts";
import { Board3D } from "./Board";

export default function SessionDetail({ session }: { session: Session }) {
  const [events, setEvents] = useState<ManeuverEvent[]>([]);
  const [cursor, setCursor] = useState<number>(0);

  useEffect(() => {
    const ev = detectManeuvers(session.samples);
    setEvents(ev);
  }, [session.samples]);

  const currentSample = session.samples[cursor];
  const magnitudeAcc = Math.sqrt(
    currentSample.ax ** 2 + currentSample.ay ** 2 + currentSample.az ** 2
  );
  const magnitudeGyro = Math.sqrt(
    currentSample.gx ** 2 + currentSample.gy ** 2 + currentSample.gz ** 2
  );
  // const magnitudeMag = Math.sqrt(currentSample.mx ** 2 + currentSample.my ** 2 + currentSample.mz ** 2);

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <p
        style={{
          width: "100%",
          justifyContent: "space-evenly",
          display: "flex",
        }}
      >
        Magnitudes:
        <span>acelerômetro: {magnitudeAcc}</span>
        <span>giroscópio: {magnitudeGyro}</span>
      </p>
      <input
        type="range"
        min={0}
        max={session.samples.length - 1}
        value={cursor}
        onChange={(e) => setCursor(Number(e.target.value))}
        style={{ width: "100%" }}
      />
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ width: "48%", minHeight: 500 }}>
          <SensorCharts
            events={events}
            session={session}
            setCursor={setCursor}
          />
        </div>
        <div style={{ width: "50%", height: 500 }}>
          <h3>Replay</h3>
          <Board3D sample={currentSample} />
        </div>

        <div style={{ width: "50%", height: 500, paddingTop: "32px" }}>
          <h3>Manuevers</h3>
          {events.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-medium">Manobras detectadas</h2>
              <ul className="mt-2 space-y-1">
                {events.map((e, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {new Date(e.timestamp).toLocaleTimeString()} → {e.type} (
                    {e.score.toFixed(1)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
