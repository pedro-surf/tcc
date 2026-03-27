import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export interface Orientation {
  roll: number;  // radians
  pitch: number; // radians
  yaw: number;   // radians
}

function SurfboardMesh({ orientation }: { orientation: Orientation }) {
  const ref = useRef<Mesh | null>(null);

  // smoother interpolation
  useFrame(() => {
    if (!ref.current) return;
    // Lerp to target to smooth jitter
    ref.current.rotation.x += (orientation.pitch - ref.current.rotation.x) * 0.2;
    ref.current.rotation.y += (orientation.yaw - ref.current.rotation.y) * 0.2;
    ref.current.rotation.z += (orientation.roll - ref.current.rotation.z) * 0.2;
  });

  return (
    <mesh ref={ref} position={[0, 0.05, 0]} castShadow>
      {/* simple surfboard: long thin box, tilted */}
      <boxGeometry args={[1.6, 0.06, 0.36]} />
      <meshStandardMaterial color={"#ffffff"} metalness={0.2} roughness={0.4} />
    </mesh>
  );
}

export default function ThreeScene({ orientation }: { orientation: Orientation }) {
  return (
    <div style={{ width: "100%", height: "350px", borderRadius: 8, overflow: "hidden" }}>
      <Canvas shadows camera={{ position: [0, 1.2, 2.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <SuspenseFallback />
        <SurfboardMesh orientation={orientation} />
        <gridHelper args={[5, 10]} position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}

function SuspenseFallback() {
  return null;
}
