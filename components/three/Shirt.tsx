"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { addShirtDecals } from "@/lib/shirtDecals";

const MODEL = "/tshirt.glb";
const FRONT_ART = "/designs/front.webp";
const BACK_ART = "/designs/back.webp";
const TARGET_HEIGHT = 2.6; // altura desejada em unidades de cena

// camiseta preta (modelo é branco → tingimos de escuro)
const SHIRT_COLOR = new THREE.Color("#17171a");

function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

export function Shirt() {
  const { scene } = useGLTF(MODEL);
  const [frontTex, backTex] = useTexture([FRONT_ART, BACK_ART]);
  const outer = useRef<THREE.Group>(null);

  // clona a cena, normaliza escala/centro, tinge de preto e projeta a estampa
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

    // projeta a estampa enquanto o wrapper ainda está em escala 1
    addShirtDecals(wrapper, root, frontTex, backTex);
    wrapper.scale.setScalar(scale);
    return wrapper;
  }, [scene, frontTex, backTex]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = outer.current;
    if (!g) return;

    // pose fixa de hero: leve balanço idle, sem giro por scroll
    const targetRotY = -0.15 + Math.sin(t * 0.4) * 0.08;
    const targetRotX = 0.05;
    g.rotation.y = damp(g.rotation.y, targetRotY, 4, dt);
    g.rotation.x = damp(g.rotation.x, targetRotX, 4, dt);

    // à direita com a estampa inteira, um pouco acima
    g.position.x = damp(g.position.x, 1.9, 3.5, dt);
    g.position.y = damp(g.position.y, -0.45 + Math.sin(t * 0.5) * 0.06, 3, dt);
  });

  return (
    <group ref={outer}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL);
