import React, { useRef, useState } from "react";

type Props = {
  value?: number;
  onChange?: (angle: number) => void;
  size?: number;
};

export default function WindRose({ value = 0, onChange, size = 200 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(value);

  const updateAngle = (clientX: number, clientY: number) => {
    const rect = ref.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI + 90; // 0° = norte

    if (deg < 0) deg += 360;

    setAngle(deg);
    onChange?.(deg);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    updateAngle(e.clientX, e.clientY);

    const move = (ev: MouseEvent) => updateAngle(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid #ccc",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* marcador */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 2,
          height: size / 2,
          background: "red",
          transformOrigin: "bottom center",
          transform: `translate(-50%, -100%) rotate(${angle}deg)`,
        }}
      />

      {/* centro */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 8,
          height: 8,
          background: "#000",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* label */}
      <div
        style={{
          position: "absolute",
          bottom: -30,
          width: "100%",
          textAlign: "center",
        }}
      >
        {angle.toFixed(1)}°
      </div>
    </div>
  );
}
