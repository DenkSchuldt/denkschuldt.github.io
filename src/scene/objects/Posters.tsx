"use client";

import { Suspense } from "react";

import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { withSceneBasePath } from "../camera/sceneRoutes";

const WALL_IMAGES = ["arrival.jpg", "her.jpg", "interstellar.jpg", "matrix.jpg"].map((image) =>
  withSceneBasePath(`/wall/${image}`),
);

function PosterImages() {
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
      {[-2.13, -0.71, 0.71, 2.13].map((x, i) => (
        <mesh key={WALL_IMAGES[i]} position={[x, 0, 0.035]}>
          <planeGeometry args={[1.18, 0.67]} />
          <meshStandardMaterial map={textures[i]} roughness={0.82} toneMapped />
        </mesh>
      ))}
    </>
  );
}

export function Posters() {
  return (
    <group position={[1.7, 3, -3.84]}>
      <group position={[0, 0.67, 0.08]}>
        <RoundedBox args={[0.92, 0.075, 0.12]} radius={0.035} castShadow>
          <meshStandardMaterial color="#343231" metalness={0.28} roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, -0.03, -0.12]}>
          <boxGeometry args={[0.08, 0.08, 0.22]} />
          <meshStandardMaterial color="#292827" metalness={0.2} roughness={0.6} />
        </mesh>
      </group>
      {[-2.13, -0.71, 0.71, 2.13].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.3, 0.79, 0.06]} />
            <meshStandardMaterial color="#151413" roughness={0.72} />
          </mesh>
        </group>
      ))}
      {/* Wall images are part of the room's persistent visual composition. */}
      <Suspense fallback={null}>
        <PosterImages />
      </Suspense>
    </group>
  );
}
