import { useState } from "react";

type Props = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (v: number) => void;
};

export default function WindMagnitudeSelect({
  min = 5,
  max = 30,
  step = 5,
  value = 10,
  onChange,
}: Props) {
  const [val, setVal] = useState(value);

  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }

  // gera roxo progressivo (claro → forte)
  const getColor = (v: number) => {
    const ratio = (v - min) / (max - min);
    const lightness = 85 - ratio * 40; // vai escurecendo
    return `hsl(270, 70%, ${lightness}%)`;
  };

  const handleClick = (v: number) => {
    setVal(v);
    onChange?.(v);
  };

  return (
    <div style={{ width: 320 }}>
      <div
        style={{
          display: "flex",
          gap: 6,
        }}
      >
        {steps.map((s) => {
          const active = s <= val;

          return (
            <div
              key={s}
              onClick={() => handleClick(s)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 8,
                cursor: "pointer",
                background: active ? getColor(s) : "#eee",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: active ? "#fff" : "#666",
              }}
            >
              {s}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 8 }}>{val} nós</div>
    </div>
  );
}
