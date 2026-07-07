"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { Shirt } from "./Shirt";
import { useStore } from "@/lib/store";

/** Luzes que abrem (dura/baixa → ampla/difusa) conforme o scroll. */
function Rig() {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);

  useFrame((_, dt) => {
    const p = useStore.getState().scrollProgress;
    const l = 1 - Math.exp(-4 * dt);
    if (key.current)
      key.current.intensity = THREE.MathUtils.lerp(
        key.current.intensity,
        1.6 + p * 1.2,
        l
      );
    if (fill.current)
      fill.current.intensity = THREE.MathUtils.lerp(
        fill.current.intensity,
        0.25 + p * 0.9,
        l
      );
    if (rim.current)
      rim.current.intensity = THREE.MathUtils.lerp(
        rim.current.intensity,
        2.4 - p * 0.8,
        l
      );
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.4} groundColor={"#050505"} color={"#ffffff"} />
      <directionalLight ref={key} position={[3, 4, 5]} intensity={1.6} />
      <directionalLight ref={fill} position={[-4, 1, 2]} intensity={0.3} />
      <directionalLight ref={rim} position={[0, 2, -6]} intensity={2.4} />
    </>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 34 }}
      style={{ position: "fixed", inset: 0, zIndex: -10, pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Rig />
        <Shirt />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
