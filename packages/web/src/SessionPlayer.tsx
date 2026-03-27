import React, { useMemo, useState, useEffect } from "react";
import ThreeScene, { Orientation } from "./ThreeScene";
import { Sample, ManeuverEvent } from "../utils/detectManeuvers"; // adjust path if using shared-types
import { detectManeuvers } from "../utils/detectManeuvers";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Expect CSV rows parsed into Sample[] with fields:
 * { timestamp, ax, ay, az, gx, gy, gz, lat?, lon? }
 *
 * Player maps sample index <-> timeline.
 */

function samplesToOrientation(s: Sample): Orientation {
  // simple integration: convert gyro deg/s to radians small-angle approx for visualization
  // This is only for visual replay; for real orientation compute AHRS / complementary filter.
  const toRad = (d: number) => (d * Math.PI) / 180;
  // For a single sample we don't have orientation; we'll use small rotation proportional to gyro
  return {
    roll: toRad(s.gx) * 0.01,
    pitch: toRad(s.gy) * 0.01,
    yaw: toRad(s.gz) * 0.01,
  };
}

export default function SessionPlayer({ samples }: { samples: Sample[] }) {
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x
  const [events, setEvents] = useState<ManeuverEvent[]>([]);
  const [orientation, setOrientation] = useState<Orientation>({ roll: 0, pitch: 0, yaw: 0 });

  // preprocess for chart (magnitude of acceleration)
  const chartData = useMemo(
    () =>
      samples.map((s) => ({
        t: s.timestamp,
        acc: Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az),
      })),
    [samples]
  );

  useEffect(() => {
    // detect maneuvers once on load
    const ev = detectManeuvers(samples);
    setEvents(ev);
  }, [samples]);

  useEffect(() => {
    if (!playing) return;
    let anim: number;
    const step = () => {
      setIdx((i) => {
        const next = i + Math.max(1, Math.floor(1 * speed));
        return next >= samples.length ? samples.length - 1 : next;
      });
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [playing, speed, samples.length]);

  // update orientation from current sample
  useEffect(() => {
    const s = samples[Math.max(0, Math.min(samples.length - 1, idx))];
    if (s) setOrientation(samplesToOrientation(s));
  }, [idx, samples]);

  const onSeek = (value: number) => {
    setIdx(Math.round(value));
    setPlaying(false);
  };

  return (
    <div>
      <div className="mb-4">
        <ThreeScene orientation={orientation} />
      </div>

      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setPlaying((p) => !p)} className="px-3 py-1 bg-blue-600 text-white rounded">
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={() => setIdx(0)} className="px-3 py-1 bg-gray-200 rounded">
          Rewind
        </button>
        <div>
          <label className="mr-2 text-sm">Speed</label>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="px-2 py-1 border rounded">
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-600">
          {idx}/{samples.length - 1} • {new Date(samples[idx]?.timestamp ?? 0).toLocaleTimeString()}
        </div>
      </div>

      {/* slider */}
      <input
        type="range"
        min={0}
        max={Math.max(0, samples.length - 1)}
        value={idx}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full mb-4"
      />

      {/* chart with markers for maneuvers */}
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="t" hide />
            <Tooltip labelFormatter={(t) => new Date(t).toLocaleTimeString()} />
            <Line type="monotone" dataKey="acc" stroke="#2563eb" dot={false} isAnimationActive={false} />
            {/* markers (we map to nearest sample index by timestamp) */}
            {events.map((ev, i) => {
              // find nearest sample index for event timestamp
              const nearestIndex = samples.findIndex((s) => s.timestamp >= ev.timestamp);
              if (nearestIndex < 0) return null;
              const x = chartData[nearestIndex].t;
              const color = ev.type === "manobra_composta" ? "#ef4444" : ev.type === "rotacao" ? "#f59e0b" : "#10b981";
              return (
                <line
                  key={i}
                  x1={0}
                  x2={0}
                  // Recharts does not accept raw line primitives as children that map to axes easily,
                  // so we'll just ignore vector lines here; events are also shown below as list.
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* List events */}
      <div className="mt-3">
        <h4 className="font-medium">Eventos detectados</h4>
        <ul className="mt-2 text-sm">
          {events.map((e, i) => (
            <li key={i}>
              {new Date(e.timestamp).toLocaleTimeString()} — {e.type} ({e.score.toFixed(2)})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
