import React from "react";
import ForecastRow from "./ForecastRow";

type Forecast = {
  ideal: boolean;
  score?: number;
  userId: string;
  swell: number;
  swellDir: number;
  period?: number;
  wind: number;
  windDir: number;
  energy?: number;
  gust?: string;
  power?: string;
  timestamp: Date;
};

type Props = {
  data: Forecast[];
};

export default function ForecastTable({ data }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.map((f, i) => (
        <ForecastRow
          key={i}
          date={new Date(f.timestamp)}
          swell={f.swell}
          period={f.period || 12}
          direction={f.swellDir}
          energy={f.energy}
          wind={f.wind}
          windDir={f.windDir}
          ideal={f.ideal}
        />
      ))}
    </div>
  );
}