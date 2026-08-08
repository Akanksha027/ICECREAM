"use client";

import { Canvas } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const COLORS = ["#E77E86", "#F5E1AB", "#DBE9D9", "#C51C50", "#FFD49E"];

function Blob({
  position,
  scale,
  color,
  speed,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.rotation.x = t * 0.3;
    ref.current.rotation.y = t * 0.4;
    ref.current.position.y = position[1] + Math.sin(t) * 0.4;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
}

export default function AmbientScene() {
  const blobs = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        position: [
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 4 - 2,
        ] as [number, number, number],
        scale: 0.4 + Math.random() * 0.9,
        color: COLORS[i % COLORS.length],
        speed: 0.2 + Math.random() * 0.3,
      })),
    []
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={0.8} />
      {blobs.map((b, i) => (
        <Blob key={i} {...b} />
      ))}
    </Canvas>
  );
}
