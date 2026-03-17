import { useEffect, useRef, useState } from "react";
import type { Session } from "./types";
import SensorCharts from "./SensorCharts";
import { Board3D } from "./Board";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2] as const;

type Props = {
  session: Session;
  hideTimeline?: boolean;
  hideReplay?: boolean;
  hideManuevers?: boolean;
};

export default function SessionDetail({
  session,
  hideReplay,
  hideTimeline,
  hideManuevers,
}: Props) {
  const [cursor, setCursor] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const playerRef = useRef(0);
  useEffect(() => {
    if (!playing) return;

    const player = setInterval(() => {
      setCursor((c) => {
        playerRef.current += speed;
        const step = Math.floor(playerRef.current);
        playerRef.current -= step;

        return Math.min(c + step, session.samples.length - 1);
      });
    }, 16);

    return () => clearInterval(player);
  }, [playing, speed, session.samples.length]);

  const currentSample = session.samples[cursor];
  const magnitudeAcc = Math.sqrt(
    currentSample.ax ** 2 + currentSample.ay ** 2 + currentSample.az ** 2,
  );
  const magnitudeGyro = Math.sqrt(
    currentSample.gx ** 2 + currentSample.gy ** 2 + currentSample.gz ** 2,
  );
  // const magnitudeMag = Math.sqrt(currentSample.mx ** 2 + currentSample.my ** 2 + currentSample.mz ** 2);

  return (
    <div className="d-flex flex-clmn" style={{ flex: 1 }}>
      {!hideTimeline && (
        <>
          <div>
            <button onClick={() => setPlaying((p) => !p)}>
              {playing ? "Pause" : "Play"}
            </button>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>
          <input
            type="range"
            min={0}
            max={session.samples.length - 1}
            value={cursor}
            onChange={(e) => setCursor(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </>
      )}
      <Results predictions={session.predictions} />
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ width: "48%", minHeight: 500 }}>
          <SensorCharts session={session} setCursor={setCursor} />
        </div>
        {!hideReplay && (
          <div style={{ width: "50%", height: 500 }}>
            <h3>Replay</h3>
            <Board3D sample={currentSample} />

            <p>acc: {magnitudeAcc}</p>
            <p>gyr: {magnitudeGyro}</p>
          </div>
        )}

        {!hideManuevers && (
          <div style={{ width: "50%", height: 500, paddingTop: "32px" }}>
            <h3>Manuevers</h3>
            {session.manuevers.length > 0 && (
              <ul>
                {session.manuevers.map((e, i) => (
                  <li key={i}>
                    {e.timestamp}ms → {e.type} (Score: {e.score.toFixed(1)})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const Results = ({
  predictions = [],
}: {
  predictions: Session["predictions"];
}) => {
  return predictions.map((prediction) => (
    <h3>
      {prediction.label}: {(100 * prediction.value).toFixed(2)}%
    </h3>
  ));
};
