"use client";

import { Html, Line } from "@react-three/drei";
import { SHOT_REGISTRY } from "./shotRegistry";

export function ShotHelpers({ visible }: { visible:boolean }) {
  if (!visible || process.env.NODE_ENV === "production") return null;
  return <group>{Object.values(SHOT_REGISTRY).map((shot)=><group key={shot.id}>
    <mesh position={shot.framing.position}><sphereGeometry args={[.065,12,12]}/><meshBasicMaterial color="#5fa9d8"/></mesh>
    <mesh position={shot.framing.lookAt}><sphereGeometry args={[.045,12,12]}/><meshBasicMaterial color="#d69a55"/></mesh>
    <Line points={[shot.framing.position,shot.framing.lookAt]} color="#7b8790" lineWidth={1}/>
    <Html position={shot.framing.position} center style={{color:"#d6dde2",fontSize:10,pointerEvents:"none"}}>{shot.id}</Html>
  </group>)}</group>;
}

/** @deprecated Use ShotHelpers. */
export const CameraTargetHelpers=ShotHelpers;
