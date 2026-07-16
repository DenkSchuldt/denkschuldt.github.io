"use client";

import { ContactShadows } from "@react-three/drei";

export function Lighting({ desk, moon, moonColor, bounce }: { desk: number; moon: number; moonColor: string; bounce: number }) {
  return <>
    <hemisphereLight args={["#536173", "#160f0b", bounce * 0.16]} />
    <directionalLight position={[-5.7, 4.8, 1.2]} color={moonColor} intensity={moon} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-3} shadow-bias={-0.00018} />
    <spotLight position={[-1.65, 2.95, -0.82]} color="#ffad62" intensity={desk} angle={0.48} penumbra={0.92} distance={7} decay={2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.00012} />
    <pointLight position={[-1.55, 1.72, -1.05]} color="#ff9b50" intensity={desk * 0.2} distance={2.7} decay={2} />
    <rectAreaLight position={[0.3, 1.55, -3.55]} rotation={[0, 0, 0]} color="#b56d3e" intensity={bounce} width={4.4} height={1.6} />
    <pointLight position={[2.3, 0.65, -1.3]} color="#9d542f" intensity={bounce * 0.7} distance={3.2} decay={2} />
    <rectAreaLight position={[2.55, 3.7, -3.28]} rotation={[0, 0, 0]} color="#ffad62" intensity={1.35} width={5.2} height={1.35} />
    <ContactShadows position={[0, 0.012, -0.8]} opacity={0.48} scale={12} blur={3.4} far={4.5} />
  </>;
}
