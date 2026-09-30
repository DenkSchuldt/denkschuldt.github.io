"use client";

import * as THREE from "three";

import { roundedRectangleShape, useMacBookShellGeometry } from "./geometry";
import { useFeatureSettleLease } from "./runtimeHooks";

import type { MutableRefObject } from "react";

export const POEMS_TABLET_SCREEN_WIDTH = 1.42;
export const POEMS_TABLET_SCREEN_HEIGHT = 0.91;

const SCREEN_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(POEMS_TABLET_SCREEN_WIDTH, POEMS_TABLET_SCREEN_HEIGHT, 0.035),
  16,
);
const GLASS_GEOMETRY = new THREE.ShapeGeometry(roundedRectangleShape(1.52, 1.01, 0.075), 16);
const SCREEN_MATERIAL = new THREE.MeshBasicMaterial({ color: "#eee4d6", toneMapped: false });
const GLASS_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#090a0b",
  roughness: 0.24,
  metalness: 0.16,
});

interface PoemsTabletProps {
  position: [number, number];
  rotation: number;
  active: boolean;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}

export function PoemsTablet({ position, rotation, active, screenRef }: PoemsTabletProps) {
  const bodyGeometry = useMacBookShellGeometry(1.55, 1.04, 0.035, 0.09, 0.0015);
  useFeatureSettleLease("poems-feature", active, "poems-preview");

  return (
    <group
      position={[position[0], -0.052, position[1]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
    >
      <mesh geometry={bodyGeometry} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <meshStandardMaterial color="#d2d5d9" roughness={0.3} metalness={0.72} />
      </mesh>
      <mesh
        geometry={GLASS_GEOMETRY}
        position={[0, 0.02, 0]}
        rotation-x={-Math.PI / 2}
        dispose={null}
      >
        <primitive object={GLASS_MATERIAL} attach="material" />
      </mesh>
      <mesh
        ref={screenRef}
        geometry={SCREEN_GEOMETRY}
        position={[0, 0.024, 0]}
        rotation-x={-Math.PI / 2}
        dispose={null}
      >
        <primitive object={SCREEN_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 0.0205, -0.48]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.006, 12]} />
        <meshBasicMaterial color="#181b1d" />
      </mesh>
    </group>
  );
}
