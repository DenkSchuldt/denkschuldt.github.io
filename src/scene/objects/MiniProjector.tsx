"use client";

import { useLayoutEffect, useMemo } from "react";

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { withSceneBasePath } from "../camera/sceneRoutes";

const MINI_PROJECTOR_PATH = withSceneBasePath("/models/mini-projector.glb");

interface MiniProjectorProps {
  position: [number, number, number];
  rotation: number;
}

export function MiniProjector({ position, rotation }: MiniProjectorProps) {
  const { scene } = useGLTF(MINI_PROJECTOR_PATH);
  const projector = useMemo(() => {
    const clone = scene.clone(true);
    const tiltingBody = clone.getObjectByName("ProjectorTilt");
    tiltingBody?.rotation.set(THREE.MathUtils.degToRad(46), 0, 0);
    return clone;
  }, [scene]);

  useLayoutEffect(() => {
    projector.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [projector]);

  return (
    <group
      position={[position[0], 1.24 + position[1], -1.5 + position[2]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
      scale={5}
    >
      <primitive object={projector} dispose={null} />
    </group>
  );
}

useGLTF.preload(MINI_PROJECTOR_PATH);
