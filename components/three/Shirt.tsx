"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";

const MODEL = "/tshirt.glb";
const TARGET_HEIGHT = 2.6; // altura desejada em unidades de cena

// camiseta preta (modelo é branco → tingimos de escuro)
const SHIRT_COLOR = new THREE.Color("#17171a");

function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

export function Shirt() {
  const { scene } = useGLTF(MODEL);
  const outer = useRef<THREE.Group>(null);

  // clona a cena, normaliza escala/centro e tinge de preto
  const model = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_HEIGHT / maxDim;

    root.position.sub(center); // centraliza na origem
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(scale);

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const apply = (m: THREE.Material) => {
          const std = m as THREE.MeshStandardMaterial;
          const cloned = std.clone();
          cloned.roughness = Math.min(0.85, (std.roughness ?? 0.7) + 0.1);
          cloned.metalness = 0.0;
          cloned.color.copy(SHIRT_COLOR);
          return cloned;
        };
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(apply)
          : apply(mesh.material);
      }
    });
    return wrapper;
  }, [scene]);

  useFrame((state, dt) => {
    const p = useStore.getState().scrollProgress;
    const t = state.clock.elapsedTime;
    const g = outer.current;
    if (!g) return;

    // rotação conduzida pelo scroll (~1.1 volta) + respiração idle
    const targetRotY = -0.35 + p * Math.PI * 2.1 + Math.sin(t * 0.4) * 0.04;
    const targetRotX = 0.05 + Math.sin(p * Math.PI) * 0.12; // inclina no meio
    g.rotation.y = damp(g.rotation.y, targetRotY, 4, dt);
    g.rotation.x = damp(g.rotation.x, targetRotX, 4, dt);

    // aproxima no trecho da "arte" (~0.25) e no CTA final (~0.9)
    const zoom =
      1 + Math.exp(-Math.pow((p - 0.25) / 0.12, 2)) * 0.18 +
      Math.exp(-Math.pow((p - 0.92) / 0.08, 2)) * 0.22;
    const targetScale = zoom;
    const cs = g.scale.x;
    const ns = damp(cs, targetScale, 4, dt);
    g.scale.setScalar(ns);

    // flutuação vertical sutil + deslocamento à direita no herói e no CTA final
    const heroX = Math.max(0, (0.12 - p) / 0.12) * 1.15;
    const finalX = Math.max(0, (p - 0.82) / 0.18) * 1.1;
    const xOffset = heroX + finalX;
    g.position.x = damp(g.position.x, xOffset, 3.5, dt);
    g.position.y = damp(g.position.y, Math.sin(t * 0.5) * 0.06, 3, dt);
  });

  return (
    <group ref={outer}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL);
