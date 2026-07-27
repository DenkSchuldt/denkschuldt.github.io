"use client";
import * as THREE from "three";
import { CAMERA_TARGETS } from "../constants";
const roomBounds = new THREE.Box3(new THREE.Vector3(-6, 0, -4.1), new THREE.Vector3(6, 8, 4));
export function DebugHelpers({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group>
      <axesHelper args={[2]} />
      <gridHelper args={[16, 16, "#6f6558", "#403a34"]} />
      <box3Helper args={[roomBounds, "#7ca6c2"]} />
      {Object.entries(CAMERA_TARGETS).map(([name, t]) => (
        <mesh key={name} position={t.lookAt}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshBasicMaterial color="#d79b5c" />
        </mesh>
      ))}
    </group>
  );
}
