"use client";

import { useLayoutEffect, useRef } from "react";

import * as THREE from "three";

const ZZ_LEAF_DARK_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#334f36",
  roughness: 0.8,
  metalness: 0,
  side: THREE.DoubleSide,
});
const ZZ_LEAF_LIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#405f3d",
  roughness: 0.76,
  metalness: 0,
  side: THREE.DoubleSide,
});
const ZZ_POT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#927b67",
  roughness: 0.8,
  metalness: 0,
});
const ZZ_SOIL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#241a14",
  roughness: 1,
  metalness: 0,
});
const ZZ_STEM_GEOMETRY = new THREE.CylinderGeometry(0.012, 0.016, 1, 5, 1, false);
const ZZ_POT_GEOMETRY = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0.17, -0.11),
    new THREE.Vector2(0.183, -0.105),
    new THREE.Vector2(0.192, -0.09),
    new THREE.Vector2(0.222, 0.23),
    new THREE.Vector2(0.235, 0.275),
    new THREE.Vector2(0.252, 0.29),
    new THREE.Vector2(0.255, 0.305),
    new THREE.Vector2(0.248, 0.318),
    new THREE.Vector2(0.225, 0.325),
    new THREE.Vector2(0.212, 0.314),
    new THREE.Vector2(0.208, 0.29),
  ],
  12,
);
const ZZ_LEAF_GEOMETRY = new THREE.BufferGeometry();
ZZ_LEAF_GEOMETRY.setAttribute(
  "position",
  new THREE.BufferAttribute(
    new Float32Array([
      0, 0, 0, -0.035, 0.09, 0.002, 0.035, 0.09, 0.002, -0.065, 0.2, 0.012, 0.065, 0.2, 0.012,
      -0.045, 0.32, 0.032, 0.045, 0.32, 0.032, 0, 0.42, 0.06,
    ]),
    3,
  ),
);
ZZ_LEAF_GEOMETRY.setIndex([0, 2, 1, 1, 2, 4, 1, 4, 3, 3, 4, 6, 3, 6, 5, 5, 6, 7]);
ZZ_LEAF_GEOMETRY.computeVertexNormals();
const ZZ_STEMS = [
  { x: -0.07, z: 0.015, height: 0.88, leanX: -0.12, leanZ: 0.025, angle: 2.8 },
  { x: 0.045, z: -0.025, height: 1.02, leanX: 0.075, leanZ: -0.04, angle: 0.18 },
  { x: -0.015, z: 0.055, height: 0.78, leanX: 0.035, leanZ: 0.11, angle: 1.35 },
  { x: 0.09, z: 0.04, height: 0.9, leanX: 0.14, leanZ: 0.055, angle: 0.55 },
  { x: -0.1, z: -0.045, height: 0.74, leanX: -0.15, leanZ: -0.08, angle: -2.35 },
] as const;

export function Plant({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  const stemsRef = useRef<THREE.InstancedMesh>(null);
  const darkLeavesRef = useRef<THREE.InstancedMesh>(null);
  const lightLeavesRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const stemMesh = stemsRef.current,
      darkMesh = darkLeavesRef.current,
      lightMesh = lightLeavesRef.current;
    if (!stemMesh || !darkMesh || !lightMesh) return;
    const dummy = new THREE.Object3D(),
      up = new THREE.Vector3(0, 1, 0),
      start = new THREE.Vector3(),
      bend = new THREE.Vector3(),
      end = new THREE.Vector3(),
      direction = new THREE.Vector3(),
      leafDirection = new THREE.Vector3();
    let stemIndex = 0,
      darkIndex = 0,
      lightIndex = 0;
    ZZ_STEMS.forEach((stem, plantIndex) => {
      start.set(stem.x, 0.325, stem.z);
      bend.set(stem.x + stem.leanX * 0.42, 0.325 + stem.height * 0.5, stem.z + stem.leanZ * 0.42);
      end.set(stem.x + stem.leanX, 0.325 + stem.height, stem.z + stem.leanZ);
      (
        [
          [start, bend],
          [bend, end],
        ] as const
      ).forEach(([from, to]) => {
        direction.subVectors(to, from);
        const length = direction.length();
        dummy.position.copy(from).addScaledVector(direction, 0.5);
        dummy.quaternion.setFromUnitVectors(up, direction.normalize());
        dummy.scale.set(1, length, 1);
        dummy.updateMatrix();
        stemMesh.setMatrixAt(stemIndex++, dummy.matrix);
      });
      [0.4, 0.57, 0.74, 0.91].forEach((t, level) => {
        const leafPosition = new THREE.Vector3().lerpVectors(start, end, t);
        leafPosition.x += Math.sin(Math.PI * t) * stem.leanX * 0.18;
        leafPosition.z += Math.sin(Math.PI * t) * stem.leanZ * 0.18;
        [0, Math.PI].forEach((opposite, side) => {
          const angle = stem.angle + opposite + (level % 2 ? 0.14 : -0.1);
          leafDirection.set(Math.cos(angle), 0.27 + level * 0.045, Math.sin(angle)).normalize();
          dummy.position.copy(leafPosition);
          dummy.quaternion.setFromUnitVectors(up, leafDirection);
          dummy.rotateY((plantIndex - level + side) * 0.055);
          const scale = 0.68 - level * 0.035 + ((plantIndex + side) % 3) * 0.018;
          dummy.scale.set(scale * (side ? 0.96 : 1.03), scale, scale);
          dummy.updateMatrix();
          const target = (plantIndex + level + side) % 2 ? lightMesh : darkMesh;
          if (target === lightMesh) target.setMatrixAt(lightIndex++, dummy.matrix);
          else target.setMatrixAt(darkIndex++, dummy.matrix);
        });
      });
    });
    [stemMesh, darkMesh, lightMesh].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, []);
  return (
    <group position={position} rotation-y={THREE.MathUtils.degToRad(rotationY)} dispose={null}>
      <mesh geometry={ZZ_POT_GEOMETRY} castShadow receiveShadow>
        <primitive object={ZZ_POT_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 0.303, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.205, 16]} />
        <primitive object={ZZ_SOIL_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={stemsRef}
        args={[ZZ_STEM_GEOMETRY, ZZ_LEAF_DARK_MATERIAL, 10]}
        castShadow
      />
      <instancedMesh
        ref={darkLeavesRef}
        args={[ZZ_LEAF_GEOMETRY, ZZ_LEAF_DARK_MATERIAL, 20]}
        castShadow
      />
      <instancedMesh
        ref={lightLeavesRef}
        args={[ZZ_LEAF_GEOMETRY, ZZ_LEAF_LIGHT_MATERIAL, 20]}
        castShadow
      />
    </group>
  );
}
