import React, { useState } from "react";

type Props = {
  min?: number;
  max?: number;
  value?: number;
  onChange?: (v: number) => void;
};

export default function WaveSizeInput({
  min = 0,
  max = 100,
  value = 20,
  onChange,
}: Props) {
  const [val, setVal] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVal(v);
    onChange?.(v);
  };

  // gera path da onda
  const generateWave = (amplitude: number) => {
    const width = 300;
    const height = 100;
    const points = 40;

    let path = `M 0 ${height / 2}`;

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const y = height / 2 + Math.sin((i / points) * Math.PI * 2) * amplitude;

      path += ` L ${x} ${y}`;
    }

    return path;
  };

  const amplitude = (val / max) * 40; // escala visual

  return (
    <div style={{ width: 320 }}>
      <svg width="100%" height="120">
        <path
          d={generateWave(amplitude)}
          fill="none"
          stroke="deepskyblue"
          strokeWidth="3"
        />
      </svg>

      <input
        type="range"
        min={min}
        max={max}
        value={val}
        onChange={handleChange}
        style={{ width: "100%" }}
      />

      <div style={{ textAlign: "center", marginTop: 8 }}>
        {val.toFixed(0)} cm
      </div>
    </div>
  );
}
