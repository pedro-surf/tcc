import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Session, ManeuverEvent } from "./types";
import { useState } from "react";

type SensorChartsProps = {
  events: ManeuverEvent[];
  cursor?: number;
  setCursor: (value: number) => void;
  session: Session;
  sensors?: string[];
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
const SENSORS = ["ax", "ay", "az", "gx", "gy", "gz", "mx", "my", "mz"];

export default function SensorCharts({
  setCursor,
  session,
}: SensorChartsProps) {
  const [sensors, setSensors] = useState(SENSORS);
  return (
    <div style={{ width: "100%", height: 500 }}>
      <h3>Assinatura</h3>
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
          data={session.samples}
          onMouseMove={(e) => {
            if (e?.activeTooltipIndex != null) {
              setCursor(Number(e.activeTooltipIndex));
            }
          }}
        >
          <XAxis dataKey="timestamp" />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          {sensors.map((k, i) => (
            <Line
              key={k}
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={1.5}
            />
          ))}
          {/* <Line
            type="monotone"
            dataKey={(s) => Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2)}
            stroke="#2563eb"
            dot={false}
          /> */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
