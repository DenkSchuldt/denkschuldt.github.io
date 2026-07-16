"use client";
import { CAMERA_TARGETS } from "../constants";
export function DebugHelpers({visible}:{visible:boolean}) {if(!visible)return null;return <group><axesHelper args={[2]}/><gridHelper args={[16,16,"#6f6558","#403a34"]}/>{Object.entries(CAMERA_TARGETS).map(([name,t])=><mesh key={name} position={t.lookAt}><sphereGeometry args={[.06,10,10]}/><meshBasicMaterial color="#d79b5c"/></mesh>)}</group>}
