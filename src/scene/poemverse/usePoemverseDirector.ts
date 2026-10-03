"use client";

import { useCallback, useEffect, useRef } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useMeasuredRuntimeTask } from "../objects/runtimeHooks";
import { useRenderDemand } from "../runtime/render-scheduler";
import { POEMS_TABLET_LAYOUT } from "../sceneLayout";
import { findSkyStar, resolveSkyLayout } from "./constellationLayout";
import { POEM_STAR_ORB_RATIO } from "./poemStarAsset";
import {
  createFlightPlan,
  FLIGHT_DURATION_SECONDS,
  FLIGHT_FOV_BOOST,
  FLIGHT_HOLD_SECONDS,
  flightProgress,
  flightRadius,
  flutterEnvelope,
  smoothstep,
} from "./poemverseFlight";

import type { CameraGaze } from "../camera/cameraGaze";
import type { PoemStarLook, PoemStarRig } from "./poemStarRig";
import type { PoemverseCeiling } from "./poemverseCeiling";
import type { FlightPlan } from "./poemverseFlight";
import type { PoemversePhase, PoemverseStore } from "./poemverseStore";
import type { SkyStage } from "./skyStage";
import type { StardustEmitter } from "./stardust";

type LeaseKind = "none" | "continuous" | "periodic";

interface DirectorState {
  plan: FlightPlan | null;
  flightId: number;
  flightStartedAt: number;
  landedAt: number;
  revealStartedAt: number;
  starPosition: THREE.Vector3;
  previousStarPosition: THREE.Vector3;
  starFade: number;
  crane: number;
  skyFraming: number;
  decalLevel: number;
  lastTime: number;
  lease: LeaseKind;
  releaseLease: (() => void) | null;
}

interface PoemverseDirectorOptions {
  store: PoemverseStore;
  gaze: CameraGaze;
  star: PoemStarRig;
  ceiling: PoemverseCeiling;
  stardust: StardustEmitter;
  skyStage: SkyStage;
  featuredSlug: string | null;
  reducedMotion: boolean;
}

const TABLET_SURFACE = new THREE.Plane(
  new THREE.Vector3(0, 1, 0),
  -(POEMS_TABLET_LAYOUT.worldCenter[1] + 0.03),
);
const TABLET_CENTER = new THREE.Vector3(...POEMS_TABLET_LAYOUT.worldCenter);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const LANDING_SETTLE_SECONDS = 4.5;
const SKY_FRAMING_DELAY_SECONDS = 0.9;
const REVEAL_SECONDS = 3.6;
const REVEAL_RADIUS = 12;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const cameraForward = new THREE.Vector3();
const drawingBuffer = new THREE.Vector2();
const framedTarget = new THREE.Vector3();
const framedCrane = new THREE.Vector3();
const look: PoemStarLook = {
  radius: 0.01,
  coreOpacity: 0,
  flatten: 0,
  glow: 1,
  haloOpacity: 0,
  spikeOpacity: 0,
  spikeRotation: 0,
  lightIntensity: 0,
};

export function usePoemverseDirector({
  store,
  gaze,
  star,
  ceiling,
  stardust,
  skyStage,
  featuredSlug,
  reducedMotion,
}: PoemverseDirectorOptions) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const renderDemand = useRenderDemand("poemverse");
  const director = useRef<DirectorState>({
    plan: null,
    flightId: 0,
    flightStartedAt: -1,
    landedAt: -1,
    revealStartedAt: -1,
    starPosition: new THREE.Vector3(),
    previousStarPosition: new THREE.Vector3(),
    starFade: 0,
    crane: 0,
    skyFraming: 0,
    decalLevel: 0,
    lastTime: 0,
    lease: "none",
    releaseLease: null,
  });

  const syncLease = useCallback(
    (phase: PoemversePhase, time: number) => {
      const state = director.current;
      const next = resolveLease(state, phase, time, stardust, skyStage);
      if (next === state.lease) return;
      state.releaseLease?.();
      state.releaseLease = null;
      state.lease = next;
      if (next === "continuous")
        state.releaseLease = renderDemand.acquireContinuous({ reason: "poemverse", priority: 3 });
      if (next === "periodic")
        state.releaseLease = renderDemand.acquirePeriodic({
          reason: "poemverse",
          cadence: "30fps",
          priority: 1,
        });
    },
    [renderDemand, skyStage, stardust],
  );

  useEffect(() => {
    const state = director.current;
    const onChange = () => {
      syncLease(store.phase, state.lastTime);
      renderDemand.invalidate("poemverse");
    };
    onChange();
    const unsubscribe = store.subscribe(onChange);
    return () => {
      unsubscribe();
      state.releaseLease?.();
      state.releaseLease = null;
      state.lease = "none";
      gaze.reset();
    };
  }, [gaze, renderDemand, store, syncLease]);

  const beginFlight = useCallback(
    (time: number) => {
      const state = director.current;
      const handoff = store.handoff;
      const canvasBounds = gl.domElement.getBoundingClientRect();
      const spawn = TABLET_CENTER.clone();
      let startRadius = 0.03;
      if (handoff && canvasBounds.width > 0 && canvasBounds.height > 0) {
        pointer.set(
          ((handoff.x - canvasBounds.left) / canvasBounds.width) * 2 - 1,
          -((handoff.y - canvasBounds.top) / canvasBounds.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.intersectPlane(TABLET_SURFACE, spawn);
        startRadius = projectedRadius(
          camera,
          spawn,
          (handoff.size * POEM_STAR_ORB_RATIO) / 2,
          canvasBounds.height,
        );
      }
      const aspect = canvasBounds.width / Math.max(1, canvasBounds.height);
      const layout = resolveSkyLayout(aspect);
      const featured = findSkyStar(layout, featuredSlug);
      state.plan = createFlightPlan({
        spawn,
        cameraPosition: camera.position,
        cameraFov: camera instanceof THREE.PerspectiveCamera ? camera.fov : 42,
        aspect,
        startRadius,
        landingSky: featured?.sky ?? null,
        skyBounds: layout.bounds,
      });
      state.flightId = store.flightId;
      state.flightStartedAt = time;
      state.landedAt = -1;
      state.skyFraming = 0;
      state.starFade = 1;
      state.starPosition.copy(spawn);
      state.previousStarPosition.copy(spawn);
      ceiling.placeDecal(state.plan.landing, state.plan.away);
      skyStage.rebuild(layout, state.plan.sky, state.plan.landing, ceiling.orientation);
      camera.getWorldDirection(cameraForward);
      gaze.aimAt(
        cameraForward
          .multiplyScalar(camera.position.distanceTo(TABLET_CENTER))
          .add(camera.position),
      );
      if (!reducedMotion) stardust.emitBurst(spawn, time, 26, false);
    },
    [camera, ceiling, featuredSlug, gaze, gl, reducedMotion, skyStage, stardust, store],
  );

  const update = useCallback(
    ({ elapsed, delta }: { elapsed: number; delta: number }) => {
      const state = director.current;
      const time = elapsed;
      const step = Math.min(delta, 1 / 20);
      const phase = store.phase;
      state.lastTime = time;

      if (phase === "rising" && store.flightId !== state.flightId) beginFlight(time);

      const plan = state.plan;
      const responsiveness = reducedMotion ? 3 : 1;
      const isFlying = phase === "rising" && plan !== null;
      const hasLanded = plan !== null && state.landedAt >= 0;

      if (isFlying) {
        const flightTime = reducedMotion
          ? 1
          : THREE.MathUtils.clamp(
              (time - state.flightStartedAt - FLIGHT_HOLD_SECONDS) / FLIGHT_DURATION_SECONDS,
              0,
              1,
            );
        state.previousStarPosition.copy(state.starPosition);
        placeStarOnPath(plan, flightTime, state.starPosition);
        describeFlightLook(plan, flightTime, time - state.flightStartedAt, time);
        if (!reducedMotion)
          stardust.emitTrail(
            state.previousStarPosition,
            state.starPosition,
            time,
            step,
            smoothstep(0, 0.12, time - state.flightStartedAt),
          );
        state.decalLevel = THREE.MathUtils.damp(state.decalLevel, 0, 6, step);
        gaze.steerToward(state.starPosition, 3.4 * responsiveness, step);
        state.crane = THREE.MathUtils.damp(state.crane, 1, 0.75 * responsiveness, step);
        if (flightTime >= 1) {
          state.landedAt = time;
          state.revealStartedAt = time;
          skyStage.markLanded(time);
          stardust.emitBurst(plan.landing, time, reducedMotion ? 0 : 72, true);
          store.land();
        }
      } else if (hasLanded) {
        const sinceLanding = time - state.landedAt;
        state.starPosition.copy(plan.path.points[plan.path.points.length - 1]);
        describeLandingLook(sinceLanding);
        state.decalLevel = smoothstep(0.12, 0.42, sinceLanding);
      } else {
        state.starFade = THREE.MathUtils.damp(state.starFade, 0, 5, step);
        describeFadingLook(state.starFade, time);
      }

      if (phase === "landed" && plan) {
        const framingReady = time - state.landedAt > SKY_FRAMING_DELAY_SECONDS;
        if (framingReady)
          state.skyFraming = THREE.MathUtils.damp(state.skyFraming, 1, 0.55 * responsiveness, step);
        framedTarget.copy(plan.landing).lerp(plan.skyFocus, state.skyFraming);
        gaze.steerToward(framedTarget, 1.6 * responsiveness, step);
        state.crane = THREE.MathUtils.damp(state.crane, 1, 0.75 * responsiveness, step);
      }

      if (phase === "returning" || phase === "idle") {
        gaze.relax(1.5 * responsiveness, step);
        state.crane = THREE.MathUtils.damp(state.crane, 0, 1.5 * responsiveness, step);
        if (!gaze.isEngaged && state.crane < 0.002) {
          state.crane = 0;
          store.settle();
        }
      }

      if (plan) {
        framedCrane.copy(plan.flightCrane).lerp(plan.skyCrane, state.skyFraming);
        const fovBoost = THREE.MathUtils.lerp(FLIGHT_FOV_BOOST, plan.skyFovBoost, state.skyFraming);
        gaze.frame(framedCrane, state.crane, fovBoost * state.crane);
      }

      star.group.position.copy(state.starPosition);
      star.apply(look);

      const sinceLanding = state.landedAt >= 0 ? time - state.landedAt : -1;
      const revealTime =
        state.revealStartedAt >= 0 ? (time - state.revealStartedAt) / REVEAL_SECONDS : 0;
      ceiling.update({
        time,
        reveal: easeOutCubic(THREE.MathUtils.clamp(revealTime, 0, 1)) * REVEAL_RADIUS,
        impactAge: sinceLanding >= 0 && sinceLanding < 4 ? sinceLanding : -1,
        decalOpacity: state.decalLevel,
        glowOpacity: describeDecalGlow(state.decalLevel, sinceLanding, time),
      });

      gl.getDrawingBufferSize(drawingBuffer);
      const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 42;
      const pointScale = drawingBuffer.y / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
      stardust.update(time, pointScale);
      skyStage.tick(time, pointScale);

      syncLease(store.phase, time);
    },
    [
      beginFlight,
      camera,
      ceiling,
      gaze,
      gl,
      reducedMotion,
      skyStage,
      star,
      stardust,
      store,
      syncLease,
    ],
  );

  useMeasuredRuntimeTask({ id: "task:poemverse", nodeId: "world", priority: 25, update });
}

function resolveLease(
  state: DirectorState,
  phase: PoemversePhase,
  time: number,
  stardust: StardustEmitter,
  skyStage: SkyStage,
): LeaseKind {
  if (phase === "launching" || phase === "rising" || phase === "returning") return "continuous";
  if (stardust.isAlive(time)) return "continuous";
  if (state.landedAt >= 0 && time - state.landedAt < LANDING_SETTLE_SECONDS) return "continuous";
  if (phase === "landed" && (!skyStage.isSettled || state.skyFraming < 0.99)) return "continuous";
  if (phase === "landed") return "periodic";
  return "none";
}

function placeStarOnPath(plan: FlightPlan, flightTime: number, target: THREE.Vector3) {
  plan.path.getPointAt(flightProgress(flightTime), target);
  const envelope = flutterEnvelope(flightTime);
  target.addScaledVector(plan.side, Math.sin(flightTime * Math.PI * 2 * 2.4) * 0.14 * envelope);
  target.addScaledVector(
    WORLD_UP,
    Math.sin(flightTime * Math.PI * 2 * 1.6 + 0.6) * 0.07 * envelope,
  );
}

function describeFlightLook(plan: FlightPlan, flightTime: number, age: number, time: number) {
  const birth = smoothstep(0, 0.22, age);
  look.radius = flightRadius(flightTime, plan.startRadius);
  look.coreOpacity = 1;
  look.flatten = 0;
  look.glow = 1 + 1.4 * Math.exp(-age / 0.3);
  look.haloOpacity = 0.35 + 0.65 * birth;
  look.spikeOpacity = 0.75 * smoothstep(0.05, 0.45, age);
  look.spikeRotation = time * 0.55;
  look.lightIntensity = 2.6 * birth;
}

function describeLandingLook(sinceLanding: number) {
  look.radius = flightRadius(1, 0);
  look.flatten = 0.94 * smoothstep(0, 0.42, sinceLanding);
  look.coreOpacity = 1 - smoothstep(0.18, 0.5, sinceLanding);
  look.glow = 1 + 1.6 * Math.exp(-sinceLanding / 0.3);
  look.haloOpacity = 1 - smoothstep(0.2, 1.4, sinceLanding);
  look.spikeOpacity = 0.75 * (1 - smoothstep(0, 0.6, sinceLanding));
  look.lightIntensity = 2.4 * (1 - smoothstep(0, 1.6, sinceLanding));
}

function describeFadingLook(fade: number, time: number) {
  look.coreOpacity = fade;
  look.flatten = 0;
  look.glow = 1;
  look.haloOpacity = fade;
  look.spikeOpacity = 0.75 * fade;
  look.spikeRotation = time * 0.55;
  look.lightIntensity = 2.6 * fade;
}

function describeDecalGlow(decalLevel: number, sinceLanding: number, time: number) {
  const breathing = 0.42 + 0.08 * Math.sin(time * 1.4);
  const impactFlash = sinceLanding >= 0 ? 0.85 * Math.exp(-sinceLanding / 0.35) : 0;
  return decalLevel * breathing + impactFlash;
}

function projectedRadius(
  camera: THREE.Camera,
  point: THREE.Vector3,
  radiusInPixels: number,
  viewportHeight: number,
) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return 0.03;
  const distance = camera.position.distanceTo(point);
  const worldPerPixel =
    (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / viewportHeight;
  return radiusInPixels * worldPerPixel;
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}
