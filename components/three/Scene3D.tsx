"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { Shirt } from "./Shirt";

/** Iluminação fixa de hero (a cena vive só na primeira tela). */
function Rig() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.4} groundColor={"#050505"} color={"#ffffff"} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, 1, 2]} intensity={0.3} />
      <directionalLight position={[0, 2, -6]} intensity={2.4} />
    </>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 34 }}
      style={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Rig />
        <Shirt />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
