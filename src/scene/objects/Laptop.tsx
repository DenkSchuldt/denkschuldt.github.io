"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";

import * as THREE from "three";

import { useMaterialReflections } from "../lighting/MaterialReflections";

import { useMacBookShellGeometry } from "./geometry";

import type { MutableRefObject } from "react";

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
  const materials = useLaptopMaterials();
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
        <primitive object={materials.chassis} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_PLANE_GEOMETRY}
        scale={[1.35, 0.5, 1]}
        position={[0, 0.058, -0.15]}
        rotation-x={-Math.PI / 2}
      >
        <primitive object={materials.keyboard} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_PLANE_GEOMETRY}
        scale={[0.62, 0.31, 1]}
        position={[0, 0.0585, 0.31]}
        rotation-x={-Math.PI / 2}
      >
        <primitive object={materials.trackpad} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_HINGE_GEOMETRY}
        position={[0, 0.061, -0.49]}
        rotation-z={Math.PI / 2}
        castShadow
      >
        <primitive object={materials.chassis} attach="material" />
      </mesh>
      <group position={[0, 0.061, -0.49]} rotation-x={THREE.MathUtils.degToRad(-13)}>
        <mesh geometry={lidGeometry} position={[0, 0.495, 0]} castShadow>
          <primitive object={materials.chassis} attach="material" />
        </mesh>
        <mesh
          ref={screenRef}
          geometry={MACBOOK_PLANE_GEOMETRY}
          scale={[1.57, 0.86, 1]}
          position={[0, 0.495, 0.017]}
        >
          <primitive object={materials.screen} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

function useLaptopMaterials() {
  const reflections = useMaterialReflections();
  const materials = useMemo(
    () => ({
      chassis: new THREE.MeshStandardMaterial({
        color: "#55585a",
        roughness: 0.42,
        metalness: 0.45,
      }),
      keyboard: new THREE.MeshStandardMaterial({
        color: "#090b0c",
        roughness: 0.72,
        metalness: 0.05,
      }),
      trackpad: new THREE.MeshStandardMaterial({
        color: "#5e6163",
        roughness: 0.5,
        metalness: 0.22,
      }),
      screen: new THREE.MeshStandardMaterial({
        color: "#090b0c",
        roughness: 0.2,
        metalness: 0,
      }),
    }),
    [],
  );

  useLayoutEffect(() => {
    [materials.chassis, materials.trackpad, materials.screen].forEach((material) => {
      const mapChanged = material.envMap !== reflections.envMap;
      material.envMap = reflections.envMap;
      material.envMapIntensity = reflections.envMapIntensity;
      if (mapChanged) material.needsUpdate = true;
    });
  }, [materials, reflections]);

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => {
        material.envMap = null;
        material.dispose();
      });
    },
    [materials],
  );
  return materials;
}
