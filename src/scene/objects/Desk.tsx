"use client";

import { RoundedBox } from "@react-three/drei";

import { PALETTE as C } from "../constants";

export function Desk() {
  return (
    <group position={[0, 0, -1.5]}>
      <RoundedBox
        args={[5.5, 0.18, 2.2]}
        radius={0.08}
        position={[0, 1.15, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={C.wood} roughness={0.66} />
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
