"use client";

import * as THREE from "three";

import { useMacBookShellGeometry } from "./geometry";

import type { MutableRefObject } from "react";

const MACBOOK_CHASSIS_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#55585a",
  roughness: 0.46,
  metalness: 0.24,
});
const MACBOOK_DARK_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#090b0c",
  roughness: 0.72,
  metalness: 0.05,
});
const MACBOOK_TRACKPAD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#5e6163",
  roughness: 0.54,
  metalness: 0.16,
});
const MACBOOK_PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);
const MACBOOK_HINGE_GEOMETRY = new THREE.CylinderGeometry(0.026, 0.026, 1.18, 8, 1, false);

export function Laptop({
  position,
  rotation,
  screenRef,
}: {
  position: [number, number, number];
  rotation: number;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}) {
  const bodyGeometry = useMacBookShellGeometry(1.72, 1.04, 0.044, 0.075, 0.006);
  const lidGeometry = useMacBookShellGeometry(1.7, 0.99, 0.022, 0.07, 0.005);
  return (
    <group
      position={[position[0], 1.24 + position[1], -1.5 + position[2]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
      dispose={null}
    >
      <mesh
        geometry={bodyGeometry}
        position={[0, 0.028, 0]}
        rotation-x={-Math.PI / 2}
        castShadow
        receiveShadow
      >
        <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_PLANE_GEOMETRY}
        scale={[1.35, 0.5, 1]}
        position={[0, 0.058, -0.15]}
        rotation-x={-Math.PI / 2}
      >
        <primitive object={MACBOOK_DARK_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_PLANE_GEOMETRY}
        scale={[0.62, 0.31, 1]}
        position={[0, 0.0585, 0.31]}
        rotation-x={-Math.PI / 2}
      >
        <primitive object={MACBOOK_TRACKPAD_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_HINGE_GEOMETRY}
        position={[0, 0.061, -0.49]}
        rotation-z={Math.PI / 2}
        castShadow
      >
        <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material" />
      </mesh>
      <group position={[0, 0.061, -0.49]} rotation-x={THREE.MathUtils.degToRad(-13)}>
        <mesh geometry={lidGeometry} position={[0, 0.495, 0]} castShadow>
          <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material" />
        </mesh>
        <mesh
          ref={screenRef}
          geometry={MACBOOK_PLANE_GEOMETRY}
          scale={[1.57, 0.86, 1]}
          position={[0, 0.495, 0.017]}
        >
          <primitive object={MACBOOK_DARK_MATERIAL} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
