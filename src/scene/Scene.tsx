"use client";

import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { CameraController } from "./camera/CameraController";
import { Lighting } from "./lighting/Lighting";
import { DebugHelpers } from "./components/DebugHelpers";
import { Chair } from "./objects/Chair";
import { Desk } from "./objects/Desk";
import { DeskObjects } from "./objects/DeskObjects";
import { FadingGroup } from "./objects/FadingGroup";
import { Laptop } from "./objects/Laptop";
import { MiniProjector } from "./objects/MiniProjector";
import { Plant } from "./objects/Plant";
import { Posters } from "./objects/Posters";
import { Room } from "./objects/Room";
import { Shelf } from "./objects/Shelf";
import { getCertificateFocusBySlug, type CertificateFocus } from "./objects/certificates";
import { DEFAULT_RENDER_ISOLATION, type RenderIsolationState } from "./rendering/renderIsolation";
import { PlanarProjection } from "./rendering/PlanarProjection";
import { isMobileRenderingViewport } from "./rendering/renderingIntent";
import { useRenderDemand } from "./runtime/render-scheduler";

import type { CinematicNavigationSystem } from "./camera/useCinematicCamera";
import type { ScreenProjectionRef } from "./screenProjection";
import type { RenderingQualityProfile, ResolvedQualityFeatures } from "./rendering/quality";

const LAPTOP_SCREEN_CORNERS: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] =
  [
    new THREE.Vector3(-0.5, 0.5, 0),
    new THREE.Vector3(0.5, 0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
  ];

const PROJECTS_WALL_PROJECTION_POSITION: [number, number, number] = [0, 3.2, -3.965];
const PROJECTS_WALL_PROJECTION_SCALE: [number, number, number] = [2.4, 4.24, 1];

const PAPER_SURFACE_CORNERS: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] =
  [
    new THREE.Vector3(-0.354, 0.504, 0),
    new THREE.Vector3(0.354, 0.504, 0),
    new THREE.Vector3(0.354, -0.504, 0),
    new THREE.Vector3(-0.354, -0.504, 0),
  ];

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

const POEMS_SCREEN_CORNERS: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] =
  [
    new THREE.Vector3(-0.352, 0.341, 0),
    new THREE.Vector3(0.352, 0.341, 0),
    new THREE.Vector3(0.352, -0.341, 0),
    new THREE.Vector3(-0.352, -0.341, 0),
  ];

const PHONE_SCREEN_CORNERS: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] =
  [
    new THREE.Vector3(-0.1495, 0.309, 0),
    new THREE.Vector3(0.1495, 0.309, 0),
    new THREE.Vector3(0.1495, -0.309, 0),
    new THREE.Vector3(-0.1495, -0.309, 0),
  ];

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

interface SceneProps {
  s: SceneSettings;
  cameraSystem: CinematicNavigationSystem;
  projectsOverlayVisible: boolean;
  certificateSlug?: string;
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
  poemsScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  poemsProjectionRef: ScreenProjectionRef;
  phoneScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  phoneProjectionRef: ScreenProjectionRef;
  onPhotoOpen?: () => void;
}

export function Scene({
  s,
  cameraSystem,
  projectsOverlayVisible,
  certificateSlug,
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
  poemsScreenRef,
  poemsProjectionRef,
  phoneScreenRef,
  phoneProjectionRef,
  onPhotoOpen,
}: SceneProps) {
  const { size } = useThree();
  const isMobileViewport = isMobileRenderingViewport(size.width / size.height);
  const renderDemand = useRenderDemand("scene");
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
      <Room mobile={isMobileViewport} />
      <Desk />
      {isMobileViewport ? (
        <>
          <MiniProjector
            active={projectsOverlayVisible}
            position={s.laptopPosition}
            rotation={-10}
          />
          {cameraSystem.selectedScene === "projects" && (
            <>
              <mesh
                ref={laptopScreenRef}
                name="ProjectsWallProjection"
                position={PROJECTS_WALL_PROJECTION_POSITION}
                scale={PROJECTS_WALL_PROJECTION_SCALE}
                visible={false}
              >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial />
              </mesh>
              <PlanarProjection
                label="ProjectsWallProjection"
                corners={LAPTOP_SCREEN_CORNERS}
                screenRef={laptopScreenRef}
                projectionRef={screenProjectionRef}
                enabled={qualityFeatures.screenProjection}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Laptop
            position={s.laptopPosition}
            rotation={s.laptopRotation}
            screenRef={laptopScreenRef}
          />
          <PlanarProjection
            label="LaptopScreenProjection"
            corners={LAPTOP_SCREEN_CORNERS}
            screenRef={laptopScreenRef}
            projectionRef={screenProjectionRef}
            enabled={qualityFeatures.screenProjection}
          />
        </>
      )}
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
        poemsScreenRef={poemsScreenRef}
        phoneScreenRef={phoneScreenRef}
        activeScene={cameraSystem.selectedScene}
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
      <PlanarProjection
        label="PoemsScreenProjection"
        corners={POEMS_SCREEN_CORNERS}
        screenRef={poemsScreenRef}
        projectionRef={poemsProjectionRef}
        enabled={qualityFeatures.screenProjection}
      />
      <PlanarProjection
        label="PhoneScreenProjection"
        corners={PHONE_SCREEN_CORNERS}
        screenRef={phoneScreenRef}
        projectionRef={phoneProjectionRef}
        enabled={qualityFeatures.screenProjection}
      />
      {!isMobileViewport && (
        <FadingGroup id="chair" visible={cameraSystem.selectedScene === "opening"}>
          <Chair />
        </FadingGroup>
      )}
      <Shelf
        illuminated={cameraSystem.selectedScene === "certificates"}
        onCertificateSelect={focusCertificate}
      />
      <Posters mobile={isMobileViewport} />
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
