"use client";

import { useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { measurePerformanceTask } from "../diagnostics/performance/performanceStore";
import { useRenderSchedulerStore } from "../runtime/render-scheduler";

import type { ScreenProjectionRef } from "../screenProjection";
import type { MutableRefObject } from "react";

interface PlanarProjectionProps {
  label: string;
  corners: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  screenRef: MutableRefObject<THREE.Mesh | null>;
  projectionRef: ScreenProjectionRef;
  enabled?: boolean;
}

export function PlanarProjection({
  label,
  corners,
  screenRef,
  projectionRef,
  enabled = true,
}: PlanarProjectionProps) {
  const { camera, size } = useThree();
  const scheduler = useRenderSchedulerStore();
  const previousMatrices = useRef(new Float64Array(48).fill(Number.NaN));
  const previousViewport = useRef({ width: 0, height: 0 });
  const previousProjection = useRef<ScreenProjectionRef | null>(null);
  const [projected] = useState(
    () =>
      corners.map(() => new THREE.Vector3()) as [
        THREE.Vector3,
        THREE.Vector3,
        THREE.Vector3,
        THREE.Vector3,
      ],
  );
  useFrame(() =>
    measurePerformanceTask(label, () => {
      if (!enabled) return;
      const screen = screenRef.current;
      if (!screen) return;
      screen.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      const matrices = previousMatrices.current;
      let changed =
        previousProjection.current !== projectionRef ||
        previousViewport.current.width !== size.width ||
        previousViewport.current.height !== size.height;
      for (let index = 0; index < 16; index++) {
        const world = camera.matrixWorld.elements[index];
        const projection = camera.projectionMatrix.elements[index];
        const screenWorld = screen.matrixWorld.elements[index];
        if (
          world !== matrices[index] ||
          projection !== matrices[index + 16] ||
          screenWorld !== matrices[index + 32]
        )
          changed = true;
        matrices[index] = world;
        matrices[index + 16] = projection;
        matrices[index + 32] = screenWorld;
      }
      if (!changed) return;
      previousProjection.current = projectionRef;
      previousViewport.current.width = size.width;
      previousViewport.current.height = size.height;
      projected.forEach((corner, index) => {
        corner.copy(corners[index]).applyMatrix4(screen.matrixWorld).project(camera);
      });
      projectionRef.publish({
        points: projected.map(({ x, y }) => ({
          x: (x * 0.5 + 0.5) * size.width,
          y: (-0.5 * y + 0.5) * size.height,
        })) as [
          { x: number; y: number },
          { x: number; y: number },
          { x: number; y: number },
          { x: number; y: number },
        ],
        viewport: { width: size.width, height: size.height },
      });
      scheduler.recordProjection();
    }),
  );
  return null;
}
