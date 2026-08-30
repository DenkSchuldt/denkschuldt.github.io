"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import * as THREE from "three";

import { useRuntimeTask } from "@denk/cinematic-navigation/react";

import { useRenderDemand } from "../runtime/render-scheduler";

import type { ReactNode } from "react";

interface MaterialFadeState {
  material: THREE.Material;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

interface FadingGroupProps {
  children: ReactNode;
  duration?: number;
  id: string;
  visible: boolean;
}

export function FadingGroup({ children, duration = 0.42, id, visible }: FadingGroupProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const groupRef = useRef<THREE.Group>(null);
  const materialStatesRef = useRef<MaterialFadeState[]>([]);
  const opacityRef = useRef(visible ? 1 : 0);
  const targetOpacityRef = useRef(visible ? 1 : 0);
  const demand = useRenderDemand(`fade:${id}`);

  useEffect(() => {
    targetOpacityRef.current = visible ? 1 : 0;
    const mountFrame = visible ? window.requestAnimationFrame(() => setIsMounted(true)) : null;
    if (!visible && !isMounted) return;
    const release = demand.acquireFor(
      { reason: "navigation-transition", priority: 2 },
      duration * 1_000 + 120,
    );
    return () => {
      if (mountFrame !== null) window.cancelAnimationFrame(mountFrame);
      release();
    };
  }, [demand, duration, isMounted, visible]);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const materialStates: MaterialFadeState[] = [];
    const seenMaterials = new Set<THREE.Material>();
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Sprite)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (seenMaterials.has(material)) return;
        seenMaterials.add(material);
        materialStates.push({
          material,
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        });
      });
    });
    materialStatesRef.current = materialStates;
    applyOpacity(materialStates, opacityRef.current);

    return () => {
      restoreMaterials(materialStates);
      materialStatesRef.current = [];
    };
  }, [isMounted]);

  const updateFade = useCallback(
    ({ delta }: { delta: number }) => {
      const target = targetOpacityRef.current;
      const nextOpacity = THREE.MathUtils.damp(
        opacityRef.current,
        target,
        fadeDamping(duration),
        delta,
      );
      opacityRef.current = Math.abs(nextOpacity - target) < 0.01 ? target : nextOpacity;
      applyOpacity(materialStatesRef.current, opacityRef.current);

      if (target === 0 && opacityRef.current === 0) setIsMounted(false);
    },
    [duration],
  );

  useRuntimeTask({
    id: `task:fade:${id}`,
    nodeId: "world",
    priority: 15,
    update: updateFade,
  });

  if (!isMounted) return null;
  return <group ref={groupRef}>{children}</group>;
}

function fadeDamping(duration: number) {
  return Math.log(100) / Math.max(duration, 0.01);
}

function applyOpacity(states: readonly MaterialFadeState[], opacity: number) {
  states.forEach((state) => {
    state.material.opacity = state.opacity * opacity;
    state.material.transparent = state.transparent || opacity < 1;
    state.material.depthWrite = opacity === 1 ? state.depthWrite : false;
    state.material.needsUpdate = true;
  });
}

function restoreMaterials(states: readonly MaterialFadeState[]) {
  states.forEach((state) => {
    state.material.opacity = state.opacity;
    state.material.transparent = state.transparent;
    state.material.depthWrite = state.depthWrite;
    state.material.needsUpdate = true;
  });
}
