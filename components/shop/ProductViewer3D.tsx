"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Version } from "@/lib/store";

const MODEL = "/tshirt.glb";
const TARGET_HEIGHT = 2.6;
const DARK = new THREE.Color("#17171a"); // Preta
const LIGHT = new THREE.Color("#ededea"); // Branca

function ShirtMesh({ version }: { version: Version }) {
  const { scene } = useGLTF(MODEL);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);
  const target = useRef(new THREE.Color().copy(version === "Preta" ? DARK : LIGHT));

  const model = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = TARGET_HEIGHT / (Math.max(size.x, size.y, size.z) || 1);
    root.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(scale);
    const collected: THREE.MeshStandardMaterial[] = [];
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const apply = (m: THREE.Material) => {
          const std = (m as THREE.MeshStandardMaterial).clone();
          std.roughness = Math.min(0.9, (std.roughness ?? 0.7) + 0.1);
          std.metalness = 0;
          collected.push(std);
          return std;
        };
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(apply)
          : apply(mesh.material);
      }
    });
    mats.current = collected;
    return wrapper;
  }, [scene]);

  useEffect(() => {
    target.current.copy(version === "Preta" ? DARK : LIGHT);
  }, [version]);

  useFrame((_, dt) => {
    const l = 1 - Math.exp(-6 * dt);
    for (const m of mats.current) m.color.lerp(target.current, l);
  });

  return <primitive object={model} />;
}

export default function ProductViewer3D({ version }: { version: Version }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 6], fov: 34 }}
    >
      <ambientLight intensity={0.5} />
      <hemisphereLight intensity={0.5} color={"#ffffff"} groundColor={"#222"} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <directionalLight position={[-4, 1, 2]} intensity={0.6} />
      <directionalLight position={[0, 2, -6]} intensity={1.6} />
      <Suspense fallback={null}>
        <ShirtMesh version={version} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}

useGLTF.preload(MODEL);
