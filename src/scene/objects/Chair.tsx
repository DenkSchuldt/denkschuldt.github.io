"use client";

import { useLayoutEffect, useRef } from "react";

import * as THREE from "three";

import { roundedRectangleHole, roundedRectangleShape } from "./geometry";

const CHAIR_FRAME_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#1d2021",
  roughness: 0.68,
  metalness: 0.08,
});
const CHAIR_FABRIC_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#292827",
  roughness: 0.94,
  metalness: 0,
  side: THREE.DoubleSide,
});
const CHAIR_BACKING_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#343638",
  roughness: 0.86,
  metalness: 0,
  side: THREE.DoubleSide,
});
const CHAIR_METAL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#4a4c4c",
  roughness: 0.42,
  metalness: 0.58,
});
const CHAIR_BACK_FRAME_SHAPE = roundedRectangleShape(1.12, 1.52, 0.18);
CHAIR_BACK_FRAME_SHAPE.holes.push(roundedRectangleHole(0.91, 1.29, 0.12));
const CHAIR_BACK_FRAME_GEOMETRY = new THREE.ExtrudeGeometry(CHAIR_BACK_FRAME_SHAPE, {
  depth: 0.045,
  steps: 1,
  curveSegments: 2,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.012,
  bevelThickness: 0.012,
});
CHAIR_BACK_FRAME_GEOMETRY.center();
CHAIR_BACK_FRAME_GEOMETRY.computeVertexNormals();
const CHAIR_BACK_PANEL_GEOMETRY = new THREE.ExtrudeGeometry(
  roundedRectangleShape(0.9, 1.28, 0.12),
  {
    depth: 0.025,
    steps: 1,
    curveSegments: 2,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  },
);
CHAIR_BACK_PANEL_GEOMETRY.center();
CHAIR_BACK_PANEL_GEOMETRY.computeVertexNormals();
const CHAIR_BACK_MESH_GEOMETRY = new THREE.BufferGeometry();
CHAIR_BACK_MESH_GEOMETRY.setAttribute(
  "position",
  new THREE.BufferAttribute(
    new Float32Array([
      -0.38, -0.64, 0, 0.38, -0.64, 0, -0.44, -0.23, 0.04, 0.44, -0.23, 0.04, -0.44, 0.2, 0.06,
      0.44, 0.2, 0.06, -0.42, 0.64, 0.02, 0.42, 0.64, 0.02,
    ]),
    3,
  ),
);
CHAIR_BACK_MESH_GEOMETRY.setIndex([0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4, 4, 5, 7, 4, 7, 6]);
CHAIR_BACK_MESH_GEOMETRY.computeVertexNormals();
const CHAIR_SEAT_GEOMETRY = new THREE.ExtrudeGeometry(roundedRectangleShape(1.13, 0.98, 0.17), {
  depth: 0.12,
  steps: 1,
  curveSegments: 2,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.025,
  bevelThickness: 0.025,
});
CHAIR_SEAT_GEOMETRY.center();
CHAIR_SEAT_GEOMETRY.rotateX(-Math.PI / 2);
CHAIR_SEAT_GEOMETRY.computeVertexNormals();
const CHAIR_ARM_PAD_GEOMETRY = new THREE.ExtrudeGeometry(roundedRectangleShape(0.38, 0.11, 0.05), {
  depth: 0.055,
  steps: 1,
  curveSegments: 1,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.012,
  bevelThickness: 0.012,
});
CHAIR_ARM_PAD_GEOMETRY.center();
CHAIR_ARM_PAD_GEOMETRY.rotateX(-Math.PI / 2);
CHAIR_ARM_PAD_GEOMETRY.computeVertexNormals();
const CHAIR_ARM_SUPPORT_GEOMETRY = new THREE.CylinderGeometry(0.035, 0.045, 0.52, 6, 1, false);
const CHAIR_BASE_ARM_GEOMETRY = new THREE.BoxGeometry(1, 0.07, 0.09);
const CHAIR_CASTER_FORK_GEOMETRY = new THREE.BoxGeometry(0.07, 0.1, 0.055);
const CHAIR_CASTER_GEOMETRY = new THREE.CylinderGeometry(0.065, 0.065, 0.045, 8, 1, false);
const CHAIR_GAS_LIFT_GEOMETRY = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 8, 1, false);
const CHAIR_GAS_COLLAR_GEOMETRY = new THREE.CylinderGeometry(0.075, 0.09, 0.17, 8, 1, false);
const CHAIR_HUB_GEOMETRY = new THREE.CylinderGeometry(0.12, 0.14, 0.1, 10, 1, false);
const CHAIR_SPINE_GEOMETRY = new THREE.CylinderGeometry(0.026, 0.032, 0.7, 6, 1, false);
const CHAIR_LUMBAR_GEOMETRY = new THREE.CylinderGeometry(0.025, 0.025, 0.66, 6, 1, false);

export function Chair() {
  const armSupportsRef = useRef<THREE.InstancedMesh>(null),
    armPadsRef = useRef<THREE.InstancedMesh>(null);
  const baseArmsRef = useRef<THREE.InstancedMesh>(null),
    casterForksRef = useRef<THREE.InstancedMesh>(null),
    castersRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const supports = armSupportsRef.current,
      pads = armPadsRef.current,
      baseArms = baseArmsRef.current,
      forks = casterForksRef.current,
      casters = castersRef.current;
    if (!supports || !pads || !baseArms || !forks || !casters) return;
    const dummy = new THREE.Object3D(),
      up = new THREE.Vector3(0, 1, 0),
      tangent = new THREE.Vector3();
    [-1, 1].forEach((side, index) => {
      dummy.position.set(side * 0.55, 0.43, 0.08);
      dummy.rotation.set(0, 0, side * -0.08);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      supports.setMatrixAt(index, dummy.matrix);
      dummy.position.set(side * 0.57, 0.7, -0.035);
      dummy.rotation.set(0, side * 0.035, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pads.setMatrixAt(index, dummy.matrix);
    });
    Array.from({ length: 5 }, (_, index) => (index * Math.PI * 2) / 5 + 0.18).forEach(
      (angle, index) => {
        dummy.position.set(Math.cos(angle) * 0.32, -0.405, Math.sin(angle) * 0.32);
        dummy.rotation.set(0, -angle, 0);
        dummy.scale.set(0.64, 1, 1);
        dummy.updateMatrix();
        baseArms.setMatrixAt(index, dummy.matrix);
        dummy.position.set(Math.cos(angle) * 0.65, -0.455, Math.sin(angle) * 0.65);
        dummy.rotation.set(0, -angle, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        forks.setMatrixAt(index, dummy.matrix);
        tangent.set(-Math.sin(angle), 0, Math.cos(angle));
        dummy.position.set(Math.cos(angle) * 0.68, -0.49, Math.sin(angle) * 0.68);
        dummy.quaternion.setFromUnitVectors(up, tangent);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        casters.setMatrixAt(index, dummy.matrix);
      },
    );
    [supports, pads, baseArms, forks, casters].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, []);
  return (
    <group
      position={[1.45, 0.55, 1.08]}
      rotation-y={Math.PI + THREE.MathUtils.degToRad(-135)}
      rotation-z={-0.018}
      dispose={null}
    >
      <mesh geometry={CHAIR_SEAT_GEOMETRY} position={[0, 0.12, 0]} castShadow receiveShadow>
        <primitive object={CHAIR_FABRIC_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 0.045, 0.03]} castShadow>
        <boxGeometry args={[1, 0.055, 0.78]} />
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <group position={[0, 1.02, 0.4]} rotation-x={-0.1}>
        <mesh geometry={CHAIR_BACK_FRAME_GEOMETRY} castShadow>
          <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
        </mesh>
        <mesh geometry={CHAIR_BACK_MESH_GEOMETRY} position={[0, 0, 0.03]} castShadow>
          <primitive object={CHAIR_FABRIC_MATERIAL} attach="material" />
        </mesh>
        <mesh geometry={CHAIR_BACK_PANEL_GEOMETRY} position={[0, 0, -0.045]} castShadow>
          <primitive object={CHAIR_BACKING_MATERIAL} attach="material" />
        </mesh>
      </group>
      <mesh geometry={CHAIR_SPINE_GEOMETRY} position={[0, 0.5, 0.37]} rotation-x={-0.12} castShadow>
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={CHAIR_LUMBAR_GEOMETRY}
        position={[0, 0.76, 0.385]}
        rotation-z={Math.PI / 2}
        castShadow
      >
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={armSupportsRef}
        args={[CHAIR_ARM_SUPPORT_GEOMETRY, CHAIR_FRAME_MATERIAL, 2]}
        castShadow
      />
      <instancedMesh
        ref={armPadsRef}
        args={[CHAIR_ARM_PAD_GEOMETRY, CHAIR_FABRIC_MATERIAL, 2]}
        castShadow
      />
      <mesh geometry={CHAIR_GAS_LIFT_GEOMETRY} position={[0, -0.145, 0]} castShadow>
        <primitive object={CHAIR_METAL_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={CHAIR_GAS_COLLAR_GEOMETRY} position={[0, -0.235, 0]} castShadow>
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={CHAIR_HUB_GEOMETRY} position={[0, -0.405, 0]} castShadow>
        <primitive object={CHAIR_METAL_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={baseArmsRef}
        args={[CHAIR_BASE_ARM_GEOMETRY, CHAIR_METAL_MATERIAL, 5]}
        castShadow
      />
      <instancedMesh
        ref={casterForksRef}
        args={[CHAIR_CASTER_FORK_GEOMETRY, CHAIR_FRAME_MATERIAL, 5]}
        castShadow
      />
      <instancedMesh
        ref={castersRef}
        args={[CHAIR_CASTER_GEOMETRY, CHAIR_FRAME_MATERIAL, 5]}
        castShadow
      />
    </group>
  );
}
