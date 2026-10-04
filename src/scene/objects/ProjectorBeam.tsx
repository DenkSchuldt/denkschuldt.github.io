"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useActiveReality } from "../reality";
import { useRenderDemand } from "../runtime/render-scheduler";
import { ProjectorBeamRig } from "./projectorBeamRig";
import { useMeasuredRuntimeTask } from "./runtimeHooks";

import type { MutableRefObject } from "react";
import type { RuntimeTaskContext } from "@denk/cinematic-navigation";
import type { ProjectorBeamTarget } from "./projectorBeamRig";

interface ProjectorBeamProps {
  active: boolean;
  reducedMotion: boolean;
  lensRef: MutableRefObject<THREE.Object3D | null>;
  target: ProjectorBeamTarget;
}

const FADE_IN_SECONDS = 0.9;
const FADE_OUT_SECONDS = 0.45;
const POWER_ON_FLICKER: readonly (readonly [number, number])[] = [
  [0.05, 0.55],
  [0.09, 0.08],
  [0.15, 0.8],
  [0.2, 0.25],
  [0.3, 0.95],
];
const REDUCED_MOTION_TIME = 12;
const TIME_WRAP_SECONDS = 1000;

export function ProjectorBeam({ active, reducedMotion, lensRef, target }: ProjectorBeamProps) {
  const isBlueprint = useActiveReality((reality) => reality.id === "blueprint");
  const getThreeState = useThree((state) => state.get);
  const fadeRef = useRef(0);
  const powerOnAtRef = useRef<number | null>(null);
  const isPowerOnPendingRef = useRef(false);
  const renderDemand = useRenderDemand("projector-beam");
  const isLit = active && !isBlueprint;
  const rig = useMemo(() => new ProjectorBeamRig(), []);

  useEffect(() => () => rig.dispose(), [rig]);

  useEffect(() => {
    if (isLit) isPowerOnPendingRef.current = true;
    const fadeSeconds = isLit ? FADE_IN_SECONDS : FADE_OUT_SECONDS;
    return renderDemand.acquireFor(
      { reason: "navigation-transition", priority: 2 },
      fadeSeconds * 1_000 + 120,
    );
  }, [isLit, renderDemand]);

  useEffect(() => {
    if (!isLit || reducedMotion) return;
    return renderDemand.acquirePeriodic({
      reason: "projector-beam",
      cadence: "30fps",
      priority: 0,
    });
  }, [isLit, reducedMotion, renderDemand]);

  const update = useCallback(
    ({ delta, elapsed }: RuntimeTaskContext) => {
      const lens = lensRef.current;
      if (!lens) return;
      if (!isLit && fadeRef.current === 0) {
        rig.update({ lens, target, time: 0, opacity: 0, pointScale: 1 });
        return;
      }

      if (isPowerOnPendingRef.current) {
        isPowerOnPendingRef.current = false;
        powerOnAtRef.current = elapsed;
      }
      const fadeStep = delta / (isLit ? FADE_IN_SECONDS : FADE_OUT_SECONDS);
      fadeRef.current = THREE.MathUtils.clamp(
        fadeRef.current + (isLit ? fadeStep : -fadeStep),
        0,
        1,
      );

      const sincePowerOn =
        powerOnAtRef.current === null ? Infinity : elapsed - powerOnAtRef.current;
      const flicker = isLit && !reducedMotion ? powerOnFlicker(sincePowerOn) : 1;
      const easedFade = 1 - Math.pow(1 - fadeRef.current, 3);
      const { camera, size, viewport } = getThreeState();
      const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 42;
      const pointScale =
        (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));

      rig.update({
        lens,
        target,
        time: reducedMotion ? REDUCED_MOTION_TIME : elapsed % TIME_WRAP_SECONDS,
        opacity: easedFade * flicker,
        pointScale,
      });
    },
    [getThreeState, isLit, lensRef, reducedMotion, rig, target],
  );
  useMeasuredRuntimeTask({ id: "task:projector-beam", nodeId: "world", priority: 30, update });

  return <primitive object={rig.group} dispose={null} />;
}

function powerOnFlicker(sincePowerOn: number) {
  const step = POWER_ON_FLICKER.find(([until]) => sincePowerOn < until);
  return step ? step[1] : 1;
}
