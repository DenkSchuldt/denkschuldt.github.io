"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import * as THREE from "three";

import { PALETTE as C } from "../constants";
import { RENDERING_INTENT } from "../rendering/renderingIntent";

const mat = { roughness: 0.82, metalness: 0 };

const ARCHITECTURAL_WOOD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#39271d",
  roughness: 0.78,
  metalness: 0,
  vertexColors: true,
});
const ARCHITECTURAL_PANEL_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const ARCHITECTURAL_BASEBOARD_GEOMETRY = (() => {
  const crossSection: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ] = [
    [0, 0],
    [0, 0.05],
    [0.09, 0.05],
    [0.105, 0.037],
    [0.105, 0],
  ];
  const positions: number[] = [];
  for (const x of [-0.5, 0.5]) for (const [y, z] of crossSection) positions.push(x, y, z);
  const indices: number[] = [];
  for (let index = 0; index < crossSection.length; index++) {
    const next = (index + 1) % crossSection.length;
    indices.push(index, next, 5 + next, index, 5 + next, 5 + index);
  }
  indices.push(0, 2, 1, 0, 3, 2, 0, 4, 3, 5, 6, 7, 5, 7, 8, 5, 8, 9);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
})();

const WALL_GRAIN_TEXTURE_SIZE = 128;
const WALL_GRAIN_TILE_SIZE = 0.35;

function createWallGrainTexture(strength: number) {
  const canvas = document.createElement("canvas");
  canvas.width = WALL_GRAIN_TEXTURE_SIZE;
  canvas.height = WALL_GRAIN_TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(WALL_GRAIN_TEXTURE_SIZE, WALL_GRAIN_TEXTURE_SIZE);
  const low = 255 * (1 - strength);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.round(low + Math.random() * (255 - low));
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function useWallGrainTexture(width: number, height: number) {
  const base = useMemo(
    () =>
      typeof document === "undefined"
        ? null
        : createWallGrainTexture(RENDERING_INTENT.architecture.wallGrainStrength),
    [],
  );
  const tiled = useMemo(() => {
    if (!base) return null;
    const texture = base.clone();
    texture.repeat.set(
      Math.round(width / WALL_GRAIN_TILE_SIZE),
      Math.round(height / WALL_GRAIN_TILE_SIZE),
    );
    texture.needsUpdate = true;
    return texture;
  }, [base, width, height]);
  useEffect(() => () => tiled?.dispose(), [tiled]);
  useEffect(() => () => base?.dispose(), [base]);
  return tiled;
}

export function Room({ mobile = false }: { mobile?: boolean }) {
  const backWallGrain = useWallGrainTexture(18, 8);
  const accentWallGrain = useWallGrainTexture(8, 8);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial color={C.floor} {...mat} />
      </mesh>
      <mesh position={[0, 4, -4]} receiveShadow>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial
          color={RENDERING_INTENT.architecture.lightWallColor}
          roughness={RENDERING_INTENT.architecture.wallRoughness}
          roughnessMap={backWallGrain}
          metalness={0}
        />
      </mesh>
      <mesh position={[-6, 4, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#303239" {...mat} />
      </mesh>
      <mesh position={[5.85, 4, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color={RENDERING_INTENT.architecture.accentWallColor}
          roughness={RENDERING_INTENT.architecture.wallRoughness}
          roughnessMap={accentWallGrain}
          metalness={0}
        />
      </mesh>
      <mesh position={[0, 8, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial color="#24221f" {...mat} />
      </mesh>
      <ArchitecturalWoodwork mobile={mobile} />
    </group>
  );
}

type WoodworkTransform = {
  position: readonly [number, number, number];
  rotation: number;
  scale: readonly [number, number, number];
};

const FLOOR_BASEBOARD_TRANSFORMS: readonly WoodworkTransform[] = [
  { position: [-0.075, 0, -3.995], rotation: 0, scale: [11.85, 1, 1] },
  { position: [-5.995, 0, 1.75], rotation: Math.PI / 2, scale: [11.5, 1, 1] },
  { position: [5.845, 0, 1.75], rotation: -Math.PI / 2, scale: [11.5, 1, 1] },
];
const DADO_RAIL_TRANSFORM: WoodworkTransform = {
  position: [0, 2.055, -3.95],
  rotation: 0,
  scale: [5.62, 0.28, 0.7],
};
const WAINSCOT_PANEL_COLORS = [
  "#3b291e",
  "#36241b",
  "#402c20",
  "#39271d",
  "#3d2a1f",
  "#35241b",
  "#3f2b20",
];

function ArchitecturalWoodwork({ mobile = false }: { mobile?: boolean }) {
  const baseboardsRef = useRef<THREE.InstancedMesh>(null),
    panelsRef = useRef<THREE.InstancedMesh>(null);
  const baseboardTransforms = useMemo(
    () =>
      mobile ? FLOOR_BASEBOARD_TRANSFORMS : [...FLOOR_BASEBOARD_TRANSFORMS, DADO_RAIL_TRANSFORM],
    [mobile],
  );
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const baseboards = baseboardsRef.current;
    if (baseboards) {
      baseboardTransforms.forEach(({ position, rotation, scale }, index) => {
        dummy.position.set(...position);
        dummy.rotation.set(0, rotation, 0);
        dummy.scale.set(...scale);
        dummy.updateMatrix();
        baseboards.setMatrixAt(index, dummy.matrix);
      });
      baseboards.instanceMatrix.needsUpdate = true;
      baseboards.computeBoundingSphere();
    }
    const panels = panelsRef.current;
    if (panels) {
      WAINSCOT_PANEL_COLORS.forEach((color, index) => {
        dummy.position.set((index - 3) * 0.8, 1.08, -3.975);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.786, 1.94, 0.04);
        dummy.updateMatrix();
        panels.setMatrixAt(index, dummy.matrix);
        panels.setColorAt(index, new THREE.Color(color));
      });
      panels.instanceMatrix.needsUpdate = true;
      panels.computeBoundingSphere();
      if (panels.instanceColor) panels.instanceColor.needsUpdate = true;
    }
  }, [baseboardTransforms]);
  return (
    <group dispose={null}>
      <instancedMesh
        ref={baseboardsRef}
        args={[
          ARCHITECTURAL_BASEBOARD_GEOMETRY,
          ARCHITECTURAL_WOOD_MATERIAL,
          baseboardTransforms.length,
        ]}
        castShadow
        receiveShadow
      />
      {!mobile && (
        <instancedMesh
          ref={panelsRef}
          args={[
            ARCHITECTURAL_PANEL_GEOMETRY,
            ARCHITECTURAL_WOOD_MATERIAL,
            WAINSCOT_PANEL_COLORS.length,
          ]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}
