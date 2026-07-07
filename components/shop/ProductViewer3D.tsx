"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL = "/tshirt.glb";
const TARGET_HEIGHT = 2.6;
const SHIRT_COLOR = new THREE.Color("#17171a"); // camiseta preta

function ShirtMesh() {
  const { scene } = useGLTF(MODEL);

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
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const apply = (m: THREE.Material) => {
          const std = (m as THREE.MeshStandardMaterial).clone();
          std.roughness = Math.min(0.9, (std.roughness ?? 0.7) + 0.1);
          std.metalness = 0;
          std.color.copy(SHIRT_COLOR);
          return std;
        };
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(apply)
          : apply(mesh.material);
      }
    });
    return wrapper;
  }, [scene]);

  return <primitive object={model} />;
}

export default function ProductViewer3D() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 6], fov: 34 }}
    >
      <ambientLight intensity={0.6} />
      <hemisphereLight intensity={0.6} color={"#ffffff"} groundColor={"#222"} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, 1, 2]} intensity={0.8} />
      <directionalLight position={[0, 2, -6]} intensity={1.8} />
      <Suspense fallback={null}>
        <ShirtMesh />
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
