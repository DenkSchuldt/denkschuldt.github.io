"use client";

import { Html, Line } from "@react-three/drei";
import { CAMERA_TARGETS } from "./cameraTargets";

export function CameraTargetHelpers({ visible }: { visible:boolean }) {
  if (!visible || process.env.NODE_ENV === "production") return null;
  return <group>{Object.values(CAMERA_TARGETS).map((target)=><group key={target.id}>
    <mesh position={target.position}><sphereGeometry args={[.065,12,12]}/><meshBasicMaterial color="#5fa9d8"/></mesh>
    <mesh position={target.lookAt}><sphereGeometry args={[.045,12,12]}/><meshBasicMaterial color="#d69a55"/></mesh>
    <Line points={[target.position,target.lookAt]} color="#7b8790" lineWidth={1}/>
    <Html position={target.position} center style={{color:"#d6dde2",fontSize:10,pointerEvents:"none"}}>{target.id}</Html>
  </group>)}</group>;
}
