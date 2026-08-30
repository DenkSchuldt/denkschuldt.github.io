"use client";

import { Suspense } from "react";

import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { withSceneBasePath } from "../camera/sceneRoutes";

const WALL_IMAGES = ["arrival.jpg", "her.jpg", "interstellar.jpg", "matrix.jpg"].map((image) =>
  withSceneBasePath(`/wall/${image}`),
);

// Desktop/tablet hang the four frames in a single row. On a portrait viewport
// the projector throws the Projects overlay onto this wall (see Scene.tsx's
// ProjectsWallProjection), so the frames regroup into a 2x2 block clear of the
// projection area — reusing the two right-hand X positions of the row and
// stacking them into two rows.
const FRAME_POSITIONS: Record<"row" | "grid", readonly [number, number][]> = {
  row: [
    [-2.13, 0],
    [-0.71, 0],
    [0.71, 0],
    [2.13, 0],
  ],
  grid: [
    [0.71, 0.45],
    [2.13, 0.45],
    [0.71, -0.45],
    [2.13, -0.45],
  ],
};

const PICTURE_LIGHT_POSITION: Record<"row" | "grid", [number, number, number]> = {
  row: [0, 0.67, 0.08],
  grid: [1.42, 1.12, 0.08],
};

function PosterImages({ positions }: { positions: readonly [number, number][] }) {
  const textures = useTexture(WALL_IMAGES);
  textures.forEach((texture, index) => {
    const sourceAspect = index === 0 ? 1920 / 1200 : index === 3 ? 598 / 362 : 728 / 410;
    const frameAspect = 1.18 / 0.67;
    texture.colorSpace = THREE.SRGBColorSpace;
    if (sourceAspect > frameAspect) {
      texture.repeat.set(frameAspect / sourceAspect, 1);
      texture.offset.set((1 - texture.repeat.x) / 2, 0);
    } else {
      texture.repeat.set(1, sourceAspect / frameAspect);
      texture.offset.set(0, (1 - texture.repeat.y) / 2);
    }
  });
  return (
    <>
      {positions.map(([x, y], i) => (
        <mesh key={WALL_IMAGES[i]} position={[x, y, 0.035]}>
          <planeGeometry args={[1.18, 0.67]} />
          <meshStandardMaterial map={textures[i]} roughness={0.82} toneMapped />
        </mesh>
      ))}
    </>
  );
}

export function Posters({ mobile = false }: { mobile?: boolean }) {
  const layout = mobile ? "grid" : "row";
  const positions = FRAME_POSITIONS[layout];
  return (
    <group position={[1.7, 3, -3.84]}>
      <group position={PICTURE_LIGHT_POSITION[layout]}>
        <RoundedBox args={[0.92, 0.075, 0.12]} radius={0.035} castShadow>
          <meshStandardMaterial color="#343231" metalness={0.28} roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, -0.03, -0.12]}>
          <boxGeometry args={[0.08, 0.08, 0.22]} />
          <meshStandardMaterial color="#292827" metalness={0.2} roughness={0.6} />
        </mesh>
      </group>
      {positions.map(([x, y], i) => (
        <group key={WALL_IMAGES[i]} position={[x, y, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.3, 0.79, 0.06]} />
            <meshStandardMaterial color="#151413" roughness={0.72} />
          </mesh>
        </group>
      ))}
      {/* Wall images are part of the room's persistent visual composition. */}
      <Suspense fallback={null}>
        <PosterImages positions={positions} />
      </Suspense>
    </group>
  );
}
