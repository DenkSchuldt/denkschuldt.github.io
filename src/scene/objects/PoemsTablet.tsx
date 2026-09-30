"use client";

import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { useFeatureSettleLease } from "./runtimeHooks";
import { roundedRectangleShape } from "./geometry";

import type { MutableRefObject } from "react";

export const POEMS_TABLET_SCREEN_WIDTH = 1.42;
export const POEMS_TABLET_SCREEN_HEIGHT = 0.91;

const SCREEN_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(POEMS_TABLET_SCREEN_WIDTH, POEMS_TABLET_SCREEN_HEIGHT, 0.035),
  16,
);
SCREEN_GEOMETRY.rotateX(-Math.PI / 2);
const SCREEN_MATERIAL = new THREE.MeshBasicMaterial({ color: "#eee4d6", toneMapped: false });

interface PoemsTabletProps {
  position: [number, number];
  rotation: number;
  active: boolean;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}

export function PoemsTablet({ position, rotation, active, screenRef }: PoemsTabletProps) {
  useFeatureSettleLease("poems-feature", active, "poems-preview");

  return (
    <group
      position={[position[0], -0.052, position[1]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
    >
      <RoundedBox args={[1.55, 0.035, 1.04]} radius={0.055} castShadow receiveShadow>
        <meshStandardMaterial color="#514f4c" roughness={0.43} metalness={0.7} />
      </RoundedBox>
      <RoundedBox args={[1.535, 0.006, 1.025]} radius={0.052} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial color="#090a0b" roughness={0.24} metalness={0.16} />
      </RoundedBox>
      <mesh ref={screenRef} geometry={SCREEN_GEOMETRY} position={[0, 0.024, 0]} dispose={null}>
        <primitive object={SCREEN_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 0.024, -0.492]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.006, 12]} />
        <meshBasicMaterial color="#181b1d" />
      </mesh>
    </group>
  );
}
