import {
  LineChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Session } from "./types";
import { useState } from "react";

export type ChartCut = { start: number; end: number };

type SensorChartsProps = {
  cursor?: number;
  setCursor: (value: number) => void;
  session: Session;
  sensors?: string[];
  title?: string;
  /** Session replay uses seconds from 0. Import preview hides axis ticks. */
  clock?: "session" | "absolute";
  cut?: ChartCut;
  onCutChange?: (cut: ChartCut) => void;
};

const COLORS = [
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ec4899",
  "#0ea5e9",
  "#84cc16",
];
const SENSORS = [
  "ax",
  "ay",
  "az",
  "gx",
  "gy",
  "gz",
  "mx",
  "my",
  "mz",
  "pressure",
  "temperature",
];

export default function SensorCharts({
  setCursor,
 // cursor,
  session,
  title = 'Signature',
  clock = 'session',
  cut,
  onCutChange,
}: SensorChartsProps) {
  const [sensors, setSensors] = useState(["ax", "ay", "az", "gx", "gy", "gz"]);
  const [dragEdge, setDragEdge] = useState<'start' | 'end' | null>(null);
  const origin = session.samples[0]?.timestamp ?? 0;
  const data = session.samples.map(({ timestamp, ...sample }) => ({
    ...sample,
    t: (timestamp - origin) / 1000,
  }));
  const last = Math.max(0, data.length - 1);

  const moveCut = (index: number, edge: 'start' | 'end') => {
    if (!cut || !onCutChange || !Number.isFinite(index)) return;
    const i = Math.min(last, Math.max(0, index));
    if (edge === 'start') {
      onCutChange(i <= cut.end ? { start: i, end: cut.end } : { start: cut.end, end: i });
    } else {
      onCutChange(i >= cut.start ? { start: cut.start, end: i } : { start: i, end: cut.start });
    }
  };

  return (
    <div style={{ width: "100%", height: clock === 'absolute' ? 360 : 500 }}>
      {title ? <h3>{title}</h3> : null}
      {clock === 'session' ? <p className="app-meta">time in s</p> : null}
      {SENSORS.map((s) => (
        <>
          <label key={s} style={{ marginRight: 8 }}>
            <input
              type="checkbox"
              checked={sensors.includes(s)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSensors([...sensors, s]);
                } else {
                  setSensors(sensors.filter((x) => x !== s));
                }
              }}
            />
            {s}
          </label>
        </>
      ))}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          onMouseDown={(e) => {
            if (!cut || e?.activeTooltipIndex == null) return;
            const index = Number(e.activeTooltipIndex);
            const edge =
              Math.abs(index - cut.start) <= Math.abs(index - cut.end) ? 'start' : 'end';
            setDragEdge(edge);
            moveCut(index, edge);
          }}
          onMouseMove={(e) => {
            if (e?.activeTooltipIndex == null) return;
            const index = Number(e.activeTooltipIndex);
            if (dragEdge) moveCut(index, dragEdge);
            else setCursor(index);
          }}
          onMouseUp={() => setDragEdge(null)}
          onMouseLeave={() => setDragEdge(null)}
        >
          {cut ? (
            <ReferenceArea
              x1={data[cut.start]?.t}
              x2={data[cut.end]?.t}
              fill="#2563eb"
              fillOpacity={0.12}
            />
          ) : null}
          {cut ? <ReferenceLine x={data[cut.start]?.t} stroke="#2563eb" /> : null}
          {cut ? <ReferenceLine x={data[cut.end]?.t} stroke="#2563eb" /> : null}
          <XAxis
            type="number"
            dataKey="t"
            tick={clock === 'absolute' ? false : undefined}
            tickFormatter={(value) => Number(value).toFixed(1)}
          />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip labelFormatter={clock === 'absolute' ? () => '' : undefined} />
          {sensors.map((k, i) => (
            <Line
              key={k}
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
