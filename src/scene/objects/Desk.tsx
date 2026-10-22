"use client";

import { useLayoutEffect, useRef } from "react";

import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

import { PALETTE as C } from "../constants";

import { DESK_CONTACT_EXTENT } from "./contactOcclusion";
import { useDeskContactOcclusion } from "./useDeskContactOcclusion";
import { useSurfaceTextures } from "./surfaceTextures";

export function Desk({
  paperPosition,
  paperRotation,
  contactEnabled = true,
}: {
  paperPosition: [number, number];
  paperRotation: number;
  contactEnabled?: boolean;
}) {
  const topRef = useRef<THREE.Mesh>(null);
  const contact = useDeskContactOcclusion(paperPosition, paperRotation, contactEnabled);
  useLayoutEffect(() => {
    const geometry = topRef.current?.geometry;
    if (!geometry) return;
    const position = geometry.getAttribute("position");
    const uv = new Float32Array(position.count * 2);
    for (let index = 0; index < position.count; index++) {
      uv[index * 2] = position.getX(index) / DESK_CONTACT_EXTENT[0] + 0.5;
      uv[index * 2 + 1] = position.getZ(index) / DESK_CONTACT_EXTENT[1] + 0.5;
    }
    geometry.setAttribute("uv1", new THREE.BufferAttribute(uv, 2));
  }, []);
  const { map, surface } = useSurfaceTextures("walnut");
  return (
    <group position={[0, 0, -1.5]}>
      <RoundedBox
        ref={topRef}
        args={[5.5, 0.18, 2.2]}
        radius={0.08}
        position={[0, 1.15, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          key={`walnut:${Boolean(map)}:${Boolean(surface)}:${Boolean(contact)}`}
          color={map ? "#c7b7a4" : C.wood}
          map={map}
          aoMap={contact}
          aoMapIntensity={0.8}
          roughness={surface ? 0.9 : 0.68}
          roughnessMap={surface}
          bumpMap={surface}
          bumpScale={0.003}
        />
      </RoundedBox>
      {[-2.35, 2.35].flatMap((x) =>
        [-0.75, 0.75].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.56, z]} castShadow>
            <boxGeometry args={[0.13, 1.12, 0.13]} />
            <meshStandardMaterial color={C.metal} metalness={0.65} roughness={0.34} />
          </mesh>
        )),
      )}
      <Drawer />
    </group>
  );
}

function Drawer() {
  return (
    <group position={[1.72, 0.68, 0]}>
      <RoundedBox args={[1.5, 0.72, 1.72]} radius={0.04} castShadow>
        <meshStandardMaterial color={C.woodEdge} roughness={0.72} />
      </RoundedBox>
      {[0.86, 0.62].map((y) => (
        <group key={y}>
          <mesh position={[0, y - 0.68, 0.87]}>
            <boxGeometry args={[1.37, 0.19, 0.04]} />
            <meshStandardMaterial color={C.wood} />
          </mesh>
          <mesh position={[0, y - 0.68, 0.91]}>
            <boxGeometry args={[0.28, 0.035, 0.05]} />
            <meshStandardMaterial color={C.metal} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
