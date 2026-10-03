"use client";

import * as THREE from "three";

import { roundedRectangleShape, useMacBookShellGeometry } from "./geometry";
import { useFeatureSettleLease } from "./runtimeHooks";

import type { MutableRefObject } from "react";

export const POEMS_TABLET_SCREEN_WIDTH = 1.42;
export const POEMS_TABLET_SCREEN_HEIGHT = 0.91;

const BODY_WIDTH = 1.55;
const BODY_HEIGHT = 1.04;
const GLASS_WIDTH = 1.52;
const GLASS_HEIGHT = 1.01;
const CAMERA_INSET = 0.04;

const LANDSCAPE_SCREEN_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(POEMS_TABLET_SCREEN_WIDTH, POEMS_TABLET_SCREEN_HEIGHT, 0.035),
  16,
);
const PORTRAIT_SCREEN_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(POEMS_TABLET_SCREEN_HEIGHT, POEMS_TABLET_SCREEN_WIDTH, 0.035),
  16,
);
const LANDSCAPE_GLASS_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(GLASS_WIDTH, GLASS_HEIGHT, 0.075),
  16,
);
const PORTRAIT_GLASS_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(GLASS_HEIGHT, GLASS_WIDTH, 0.075),
  16,
);
const SCREEN_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#010203",
  roughness: 0.16,
  metalness: 0.04,
});
const GLASS_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#090a0b",
  roughness: 0.24,
  metalness: 0.16,
});

interface PoemsTabletProps {
  position: [number, number];
  rotation: number;
  active: boolean;
  portrait: boolean;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}

export function poemsTabletScreenSize(portrait: boolean) {
  return portrait
    ? { width: POEMS_TABLET_SCREEN_HEIGHT, height: POEMS_TABLET_SCREEN_WIDTH }
    : { width: POEMS_TABLET_SCREEN_WIDTH, height: POEMS_TABLET_SCREEN_HEIGHT };
}

export function PoemsTablet({ position, rotation, active, portrait, screenRef }: PoemsTabletProps) {
  const bodyGeometry = useMacBookShellGeometry(
    portrait ? BODY_HEIGHT : BODY_WIDTH,
    portrait ? BODY_WIDTH : BODY_HEIGHT,
    0.035,
    0.09,
    0.0015,
  );
  const cameraOffset = (portrait ? BODY_WIDTH : BODY_HEIGHT) / 2 - CAMERA_INSET;
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
        geometry={portrait ? PORTRAIT_GLASS_GEOMETRY : LANDSCAPE_GLASS_GEOMETRY}
        position={[0, 0.02, 0]}
        rotation-x={-Math.PI / 2}
        dispose={null}
      >
        <primitive object={GLASS_MATERIAL} attach="material" />
      </mesh>
      <mesh
        ref={screenRef}
        geometry={portrait ? PORTRAIT_SCREEN_GEOMETRY : LANDSCAPE_SCREEN_GEOMETRY}
        position={[0, 0.024, 0]}
        rotation-x={-Math.PI / 2}
        dispose={null}
      >
        <primitive object={SCREEN_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 0.0205, -cameraOffset]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.006, 12]} />
        <meshBasicMaterial color="#181b1d" />
      </mesh>
    </group>
  );
}
