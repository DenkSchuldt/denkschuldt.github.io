"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { withSceneBasePath } from "../camera/sceneRoutes";
import { useRenderDemand } from "../runtime/render-scheduler";

const MINI_PROJECTOR_PATH = withSceneBasePath("/models/mini-projector.glb");
const PROJECTOR_TILT_RADIANS = THREE.MathUtils.degToRad(46);

interface MiniProjectorProps {
  active: boolean;
  position: [number, number, number];
  rotation: number;
}

export function MiniProjector({ active, position, rotation }: MiniProjectorProps) {
  const { scene } = useGLTF(MINI_PROJECTOR_PATH);
  const renderDemand = useRenderDemand("projector-lens");
  const { lensMaterial, projector } = useMemo(() => {
    const clone = scene.clone(true);
    const tiltingBody = clone.getObjectByName("ProjectorTilt");
    const lens = clone.getObjectByName("ProjectorLens");
    tiltingBody?.rotation.set(PROJECTOR_TILT_RADIANS, 0, 0);

    if (!(lens instanceof THREE.Mesh) || !(lens.material instanceof THREE.MeshStandardMaterial)) {
      return { lensMaterial: null, projector: clone };
    }

    const material = lens.material.clone();
    material.emissive.set("#b8dcff");
    material.emissiveIntensity = 0;
    lens.material = material;
    return { lensMaterial: material, projector: clone };
  }, [scene]);
  const lensMaterialRef = useRef(lensMaterial);

  useLayoutEffect(() => {
    projector.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [projector]);
  useEffect(() => {
    lensMaterialRef.current = lensMaterial;
    return () => {
      lensMaterial?.dispose();
      lensMaterialRef.current = null;
    };
  }, [lensMaterial]);
  useEffect(() => {
    const material = lensMaterialRef.current;
    if (!material) return;

    material.emissiveIntensity = active ? 2.4 : 0;
    renderDemand.invalidate("projection-sync");
  }, [active, lensMaterial, renderDemand]);

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
