type Props = {
  date: Date;
  swell: number; // metros
  swellDir: number; // swell direction em graus
  period: number; // segundos
  energy?: number; // kJ
  wind: number; // nós
  windDir: number; // graus
  ideal?: boolean;
};

const degToArrow = (deg: number) => {
  return `rotate(${deg}deg)`;
};

// helpers de cor
const scale = (v: number, min: number, max: number) =>
  Math.max(0, Math.min(1, (v - min) / (max - min)));

const swellColor = (v: number) => {
  const t = scale(v, 0, 3);
  return `hsl(200, 70%, ${90 - t * 50}%)`; // azul
};

const periodColor = (v: number) => {
  const t = scale(v, 5, 20);
  return `hsl(260, 60%, ${90 - t * 50}%)`; // roxo
};

const windColor = (v: number) => {
  const t = scale(v, 0, 30);
  return `hsl(10, 70%, ${90 - t * 50}%)`; // vermelho/laranja
};

const formatDate = (d: Date) => {
  const day = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const hour = d.getHours().toString().padStart(2, "0");
  return `${day} ${hour}h`;
};

const ForecastRow = ({
  date,
  swell,
  swellDir,
  period,
  energy,
  wind,
  windDir,
  ideal,
}: Props) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "110px 70px 60px 60px 80px 70px 60px",
        gap: 6,
        padding: 6,
        borderRadius: 8,
        background: ideal ? "#e6ffe6" : "#f7f7f7",
        alignItems: "center",
        fontSize: 13,
      }}
    >
      {/* data */}
      <div>{formatDate(date)}</div>

      {/* swell */}
      <div
        style={{
          background: swellColor(swell),
          borderRadius: 6,
          textAlign: "center",
          padding: "4px 0",
        }}
      >
        {swell.toFixed(1)}m
      </div>

      <div style={{ textAlign: "center" }}>
        <span
          style={{ display: "inline-block", transform: degToArrow(swellDir) }}
        >
          ↑
        </span>
      </div>

      <div
        style={{
          background: periodColor(period),
          borderRadius: 6,
          textAlign: "center",
          padding: "4px 0",
        }}
      >
        {period}s
      </div>

      {/* energia */}
      <div style={{ textAlign: "center" }}>{energy ? `${energy} kJ` : "-"}</div>

      {/* vento */}
      <div
        style={{
          background: windColor(wind),
          borderRadius: 6,
          textAlign: "center",
          padding: "4px 0",
        }}
      >
        {wind}kt
      </div>

      <div style={{ textAlign: "center" }}>
        <span
          style={{ display: "inline-block", transform: degToArrow(windDir) }}
        >
          ↑
        </span>
      </div>
    </div>
  );
};

export default ForecastRow;
