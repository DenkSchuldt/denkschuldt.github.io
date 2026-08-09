"use client";

import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { CameraController } from "./camera/CameraController";
import { Lighting } from "./lighting/Lighting";
import { DebugHelpers } from "./components/DebugHelpers";
import {
  Room,
  Desk,
  Laptop,
  DeskObjects,
  Chair,
  Shelf,
  Posters,
  Plant,
} from "./objects/Primitives";
import { getCertificateFocusBySlug, type CertificateFocus } from "./objects/certificates";
import { DEFAULT_RENDER_ISOLATION, type RenderIsolationState } from "./rendering/renderIsolation";
import { measurePerformanceTask } from "./diagnostics/performance/performanceStore";
import { useRenderDemand, useRenderSchedulerStore } from "./runtime/render-scheduler";

import type { CinematicNavigationSystem } from "./camera/useCinematicCamera";
import type { PoemsContentState } from "./content/usePoems";
import type { ScreenProjectionRef } from "./screenProjection";
import type { RenderingQualityProfile, ResolvedQualityFeatures } from "./rendering/quality";

const LAPTOP_SCREEN_CORNERS: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] =
  [
    new THREE.Vector3(-0.5, 0.5, 0),
    new THREE.Vector3(0.5, 0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
  ];

// Half-extents of the paper's planeGeometry (0.708 x 1.008 scene units).
const PAPER_SURFACE_CORNERS: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] =
  [
    new THREE.Vector3(-0.354, 0.504, 0),
    new THREE.Vector3(0.354, 0.504, 0),
    new THREE.Vector3(0.354, -0.504, 0),
    new THREE.Vector3(-0.354, -0.504, 0),
  ];

// Half-extents of the polaroid card's planeGeometry (0.26 x 0.37 scene
// units) — see PolaroidPhoto's tracking mesh in objects/Primitives.tsx.
const POLAROID_SCREEN_CORNERS: readonly [
  THREE.Vector3,
  THREE.Vector3,
  THREE.Vector3,
  THREE.Vector3,
] = [
  new THREE.Vector3(-0.13, 0.185, 0),
  new THREE.Vector3(0.13, 0.185, 0),
  new THREE.Vector3(0.13, -0.185, 0),
  new THREE.Vector3(-0.13, -0.185, 0),
];

// Projects a flat mesh's four corners into screen-space pixel coordinates
// every frame, so an HTML overlay can be perspective-warped (via CSS
// matrix3d) to sit exactly over that mesh. Used for both the laptop screen
// and the desk paper.
function PlanarProjection({
  label,
  corners,
  screenRef,
  projectionRef,
  enabled = true,
}: {
  label: string;
  corners: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  screenRef: React.MutableRefObject<THREE.Mesh | null>;
  projectionRef: ScreenProjectionRef;
  enabled?: boolean;
}) {
  const { camera, size } = useThree();
  const scheduler = useRenderSchedulerStore();
  const lastSignature = useRef("");
  const projected = corners.map(() => new THREE.Vector3()) as [
    THREE.Vector3,
    THREE.Vector3,
    THREE.Vector3,
    THREE.Vector3,
  ];
  useFrame(() =>
    measurePerformanceTask(label, () => {
      if (!enabled) return;
      const screen = screenRef.current;
      if (!screen) return;
      screen.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      const signature = [
        size.width,
        size.height,
        ...camera.matrixWorld.elements,
        ...camera.projectionMatrix.elements,
        ...screen.matrixWorld.elements,
      ]
        .map((value) => Math.round(value * 100000) / 100000)
        .join(",");
      if (signature === lastSignature.current) return;
      lastSignature.current = signature;
      projected.forEach((corner, index) => {
        corner.copy(corners[index]).applyMatrix4(screen.matrixWorld).project(camera);
      });
      projectionRef.current = {
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
      };
      scheduler.recordProjection();
    }),
  );
  return null;
}

const CinematicEffects = lazy(() => import("./effects/CinematicEffects"));

export interface SceneSettings {
  desk: number;
  sun: number;
  sunColor: string;
  bounce: number;
  bloom: number;
  fog: number;
  exposure: number;
  dof: number;
  focusDistance: number;
  helpers: boolean;
  laptopPosition: [number, number, number];
  laptopRotation: number;
  folderPosition: [number, number];
  folderRotation: number;
  paperPosition: [number, number];
  paperRotation: number;
  penPosition: [number, number];
  penRotation: number;
  coffeePosition: [number, number, number];
  plantPosition: [number, number, number];
  plantRotationY: number;
  lampPosition: [number, number, number];
}

function nearsOpening(engine: CinematicNavigationSystem["engine"]) {
  const state = engine.getState();
  return state.sceneId === "opening" || state.requestedSceneId === "opening";
}

// The chair only belongs at the Opening desk. It stays mounted for as long as
// Opening is the current or destination scene — whether arriving there via
// ESC/return, the guided tour looping back around, or a fresh load — and
// unmounts once the camera has actually left for another scene.
function useChairMountState(cameraSystem: CinematicNavigationSystem) {
  const [mounted, setMounted] = useState(() => nearsOpening(cameraSystem.engine));
  useEffect(() => {
    const update = () => setMounted(nearsOpening(cameraSystem.engine));
    update();
    return cameraSystem.engine.subscribe(update);
  }, [cameraSystem.engine]);
  return mounted;
}

interface SceneProps {
  s: SceneSettings;
  cameraSystem: CinematicNavigationSystem;
  certificateSlug?: string;
  poemsContent: PoemsContentState;
  onPoemRead: () => void;
  renderIsolation?: RenderIsolationState;
  qualityProfile: RenderingQualityProfile;
  qualityFeatures: ResolvedQualityFeatures;
  onReady?: () => void;
  laptopScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  screenProjectionRef: ScreenProjectionRef;
  paperScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  paperProjectionRef: ScreenProjectionRef;
  polaroidScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  polaroidProjectionRef: ScreenProjectionRef;
  onPhotoOpen?: () => void;
}

export function Scene({
  s,
  cameraSystem,
  certificateSlug,
  poemsContent,
  onPoemRead,
  renderIsolation = DEFAULT_RENDER_ISOLATION,
  qualityProfile,
  qualityFeatures,
  onReady,
  laptopScreenRef,
  screenProjectionRef,
  paperScreenRef,
  paperProjectionRef,
  polaroidScreenRef,
  polaroidProjectionRef,
  onPhotoOpen,
}: SceneProps) {
  const { size } = useThree();
  const renderDemand = useRenderDemand("scene");
  const chairMounted = useChairMountState(cameraSystem);
  const focusRef = useRef(s.focusDistance);
  const [effectsReady, setEffectsReady] = useState(false);
  const certificateFocusRef = useRef<CertificateFocus | null>(
    getCertificateFocusBySlug(certificateSlug),
  );

  const focusCertificate = (slug: string) => {
    certificateFocusRef.current = getCertificateFocusBySlug(slug);
    cameraSystem.enterFocus("certificates", slug);
  };

  useEffect(() => {
    if (cameraSystem.selectedFocusCollection !== "certificates") certificateFocusRef.current = null;
  }, [cameraSystem.selectedFocusCollection]);

  useLayoutEffect(() => {
    if (cameraSystem.selectedFocusCollection !== "certificates") return;
    certificateFocusRef.current =
      getCertificateFocusBySlug(certificateSlug) ?? certificateFocusRef.current;
  }, [cameraSystem.selectedFocusCollection, certificateSlug]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      onReady?.();
      renderDemand.invalidate("initial-render");
    });
    const timer = window.setTimeout(() => {
      setEffectsReady(true);
      renderDemand.invalidate("effects-settle");
    }, 350);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [onReady, renderDemand]);

  return (
    <>
      <color attach="background" args={["#2c3238"]} />
      <fog attach="fog" args={["#31373d", 7, s.fog]} />
      <Lighting
        desk={s.desk}
        sun={s.sun}
        sunColor={s.sunColor}
        bounce={s.bounce}
        fillEnabled={renderIsolation.fillLighting}
        shadowsEnabled={renderIsolation.shadows}
        profile={qualityProfile}
        features={qualityFeatures}
      />
      <CameraController
        system={cameraSystem}
        focusRef={focusRef}
        certificateFocusRef={certificateFocusRef}
      />
      <Room />
      <Desk />
      <Laptop position={s.laptopPosition} rotation={s.laptopRotation} screenRef={laptopScreenRef} />
      <PlanarProjection
        label="LaptopScreenProjection"
        corners={LAPTOP_SCREEN_CORNERS}
        screenRef={laptopScreenRef}
        projectionRef={screenProjectionRef}
        enabled={qualityFeatures.screenProjection}
      />
      <DeskObjects
        coffeePosition={s.coffeePosition}
        lampPosition={s.lampPosition}
        folderPosition={s.folderPosition}
        folderRotation={s.folderRotation}
        paperPosition={s.paperPosition}
        paperRotation={s.paperRotation}
        penPosition={s.penPosition}
        penRotation={s.penRotation}
        paperScreenRef={paperScreenRef}
        photoScreenRef={polaroidScreenRef}
        activeScene={cameraSystem.selectedScene}
        poemsContent={poemsContent}
        activePoemSlug={
          cameraSystem.selectedFocusCollection === "poems" ? cameraSystem.selectedFocusItem : null
        }
        onPoemRead={onPoemRead}
        onPhotoOpen={onPhotoOpen}
      />
      <PlanarProjection
        label="PaperScreenProjection"
        corners={PAPER_SURFACE_CORNERS}
        screenRef={paperScreenRef}
        projectionRef={paperProjectionRef}
        enabled={qualityFeatures.screenProjection}
      />
      <PlanarProjection
        label="PolaroidScreenProjection"
        corners={POLAROID_SCREEN_CORNERS}
        screenRef={polaroidScreenRef}
        projectionRef={polaroidProjectionRef}
        enabled={qualityFeatures.screenProjection}
      />
      {size.width > 760 && chairMounted && <Chair />}
      <Shelf
        illuminated={cameraSystem.selectedScene === "certificates"}
        onCertificateSelect={focusCertificate}
      />
      <Posters />
      <Plant position={s.plantPosition} rotationY={s.plantRotationY} />
      <DebugHelpers visible={s.helpers} />
      {effectsReady && (
        <Suspense fallback={null}>
          <CinematicEffects
            s={s}
            focusRef={focusRef}
            readingMode={
              cameraSystem.selectedScene === "about" ||
              cameraSystem.selectedScene === "certificates" ||
              cameraSystem.selectedScene === "poems" ||
              cameraSystem.cameraState.current.introActive
            }
            isolation={renderIsolation}
            profile={qualityProfile}
            features={qualityFeatures}
          />
        </Suspense>
      )}
    </>
  );
}
