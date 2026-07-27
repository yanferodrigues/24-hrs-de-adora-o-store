import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

// Projeta a estampa (frente = lettering, costas = ilustração) sobre a camiseta.
//
// Chamar DEPOIS de montar o `wrapper` (Group) com o `root` centrado, mas ANTES
// de aplicar a escala de auto-fit no wrapper: assim o DecalGeometry é gerado em
// espaço-mundo ~unitário e, ao adicionar os decals no wrapper (identidade), eles
// escalam/giram junto com a camiseta na coreografia de scroll.

export type DecalControls = {
  // fração da largura do corpo ocupada pela arte
  frontScale: number;
  backScale: number;
  // deslocamento vertical (fração da altura do corpo) a partir do centro
  frontY: number;
  backY: number;
  // espelhar horizontalmente a textura (a projeção traseira costuma inverter)
  frontMirror: boolean;
  backMirror: boolean;
};

export const DEFAULT_DECALS: DecalControls = {
  frontScale: 0.5,
  backScale: 0.52,
  frontY: 0.14,
  backY: 0.04,
  frontMirror: false,
  backMirror: true,
};

function findBodyMesh(root: THREE.Object3D): THREE.Mesh | null {
  let best: THREE.Mesh | null = null;
  let bestVol = -1;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox;
    if (!bb) return;
    const s = new THREE.Vector3();
    bb.getSize(s);
    const vol = s.x * s.y * s.z;
    if (vol > bestVol) {
      bestVol = vol;
      best = m;
    }
  });
  return best;
}

function prepTexture(tex: THREE.Texture, mirror: boolean) {
  const t = tex.clone();
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  if (mirror) {
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    t.offset.x = 1;
  }
  return t;
}

export function addShirtDecals(
  wrapper: THREE.Object3D,
  root: THREE.Object3D,
  frontTex: THREE.Texture,
  backTex: THREE.Texture,
  ctrl: DecalControls = DEFAULT_DECALS
) {
  wrapper.updateWorldMatrix(true, true);
  const body = findBodyMesh(root);
  if (!body) return;

  const bb = new THREE.Box3().setFromObject(body);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bb.getSize(size);
  bb.getCenter(center);

  const aspect = (tex: THREE.Texture) => {
    const img = tex.image as { width?: number; height?: number } | undefined;
    return img?.width && img?.height ? img.height / img.width : 1;
  };

  // profundidade rasa: a caixa só alcança a superfície de um lado (não atravessa
  // a camiseta nem vaza para o lado oposto). A frente é mais rasa (logo pequeno);
  // as costas um pouco mais fundas para envolver a curvatura sem chegar à frente.
  const frontDepth = size.z * 0.5;
  const backDepth = size.z * 0.98;

  const make = (
    tex: THREE.Texture,
    pos: THREE.Vector3,
    euler: THREE.Euler,
    dsize: THREE.Vector3,
    alphaTest: number
  ) => {
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      depthWrite: false,
      roughness: 0.7,
      metalness: 0,
    });
    const geo = new DecalGeometry(body as THREE.Mesh, pos, euler, dsize);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 3;
    wrapper.add(mesh);
  };

  // FRENTE — lettering no peito (+Z)
  const fTex = prepTexture(frontTex, ctrl.frontMirror);
  const fW = size.x * ctrl.frontScale;
  const fH = fW * aspect(frontTex);
  make(
    fTex,
    new THREE.Vector3(
      center.x,
      center.y + size.y * ctrl.frontY,
      center.z + size.z * 0.5 + 0.05
    ),
    new THREE.Euler(0, 0, 0),
    new THREE.Vector3(fW, fH, frontDepth),
    0.4
  );

  // COSTAS — ilustração (−Z)
  const bTex = prepTexture(backTex, ctrl.backMirror);
  const bW = size.x * ctrl.backScale;
  const bH = bW * aspect(backTex);
  make(
    bTex,
    new THREE.Vector3(
      center.x,
      center.y + size.y * ctrl.backY,
      center.z - size.z * 0.5 - 0.05
    ),
    new THREE.Euler(0, Math.PI, 0),
    new THREE.Vector3(bW, bH, backDepth),
    0.15
  );
}
