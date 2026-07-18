"use client";

import { Canvas } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { Suspense, useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import { Scene, type SceneSettings } from "./Scene";
import { CameraLocationLabel, CinematicFade, INTRO_DESTINATION, MobileCameraNavigation, NavigationDebugPanel, pathForFocus, pathForScene, shouldSyncRouteShot, useCameraKeyboardNavigation, useCameraPinchNavigation, useCameraTapNavigation, useCinematicNavigation, useSceneRouter, type NavigationLocation, type SceneId } from "./camera";
import { DEFAULT_RENDER_ISOLATION, RenderingDiagnosticsPanel, RenderingDiagnosticsProbe, type RenderingDiagnosticsSnapshot } from "./diagnostics/RenderingDiagnostics";
import { RENDERING_INTENT } from "./rendering/renderingIntent";

export default function Experience() {
  const [renderIsolation,setRenderIsolation]=useState(DEFAULT_RENDER_ISOLATION);
  const [renderingDiagnostics,setRenderingDiagnostics]=useState<RenderingDiagnosticsSnapshot|null>(null);
  const [diagnosticMobileViewport,setDiagnosticMobileViewport]=useState(false);
  useEffect(()=>{
    if(process.env.NODE_ENV==="production")return;
    const frame=window.requestAnimationFrame(()=>{
      const params=new URLSearchParams(window.location.search);
      if(params.get("renderViewport")==="mobile")setDiagnosticMobileViewport(true);
      const disabled=new Set((params.get("renderDisable")??"").split(",").filter(Boolean));
      if(disabled.size)setRenderIsolation((current)=>({...current,postProcessing:!disabled.has("post"),ambientOcclusion:!disabled.has("ao"),vignette:!disabled.has("vignette"),bloom:!disabled.has("bloom"),shadows:!disabled.has("shadows"),environmentLighting:!disabled.has("environment"),fillLighting:!disabled.has("fill"),mobilePerformanceAdaptations:!disabled.has("mobile")}));
    });
    return()=>window.cancelAnimationFrame(frame);
  },[]);
  const route=useSceneRouter();
  const {focusCollectionId:routeFocusCollection,sceneId:routeScene,path:routePath,navigate:routeNavigate,navigateWithinScene,replaceWithinScene}=route;
  const commitNavigation=useCallback((location:NavigationLocation)=>{
    if(location.focusCollectionId&&location.focusItemId){
      const path=pathForFocus(location.focusCollectionId,location.focusItemId);
      if(routeFocusCollection===location.focusCollectionId)replaceWithinScene(path);else routeNavigate(path);
      return;
    }
    const path=pathForScene(location.sceneId);
    if(path===null)return;
    if(routeFocusCollection&&routeScene===location.sceneId)replaceWithinScene(path);
    else if(location.sceneId==="opening"||location.sceneId==="about")navigateWithinScene(path);
    else if(routePath!==path)routeNavigate(path);
  },[routeFocusCollection,routeScene,routePath,routeNavigate,navigateWithinScene,replaceWithinScene]);
  const cameraSystem=useCinematicNavigation(route,route.directEntry,{onNavigate:commitNavigation});
  const {syncRoute,goToScene,cameraState,introVersion}=cameraSystem;
  useEffect(()=>{
    if(!shouldSyncRouteShot(route.path,route.directEntry)) return;
    syncRoute({sceneId:route.sceneId,focusCollectionId:route.focusCollectionId,focusItemId:route.focusItemId,cameraTarget:route.cameraTarget});
  },[route.path,route.sceneId,route.focusCollectionId,route.focusItemId,route.cameraTarget,route.directEntry,syncRoute]);
  const navigateScene=useCallback((sceneId:SceneId)=>{
    goToScene(sceneId);
  },[goToScene]);
  useCameraKeyboardNavigation(cameraSystem,navigateScene);
  useCameraTapNavigation(cameraSystem,navigateScene);
  const goToWorkspace=useCallback(()=>{goToScene("opening","workspace");},[goToScene]);
  useCameraPinchNavigation(cameraSystem,goToWorkspace);
  useEffect(()=>{
    if(route.path!=="/"||route.directEntry) return;
    let frame=0;
    let sawOpening=false;
    const waitForOpening=()=>{
      const state=cameraState.current;
      if(state.isIntroActive) sawOpening=true;
      if(sawOpening&&state.introComplete&&state.currentTarget===INTRO_DESTINATION) {
        goToScene("about",INTRO_DESTINATION);
        return;
      }
      frame=window.requestAnimationFrame(waitForOpening);
    };
    frame=window.requestAnimationFrame(waitForOpening);
    return()=>window.cancelAnimationFrame(frame);
  },[route.path,route.directEntry,cameraState,introVersion,goToScene]);
  const controls = useControls("Cinematography", {
    deskLampIntensity: { value: 19, min: 0, max: 90, step: 1, label: "Lamp intensity" },
    moonlightIntensity: { value: 1.05, min: 0, max: 4, step: 0.02, label: "Moonlight" },
    moonlightColor: { value: "#91a8c2", label: "Moonlight color" },
    bounceIntensity: { value: 0.62, min: 0, max: 4, step: 0.01, label: "Warm bounce" },
    bloom: { value: 0.08, min: 0, max: 0.5, step: 0.01 },
    fog: { value: 16.5, min: 10, max: 30, step: 0.5 },
    exposure: { value: RENDERING_INTENT.renderer.exposure, min: 0.3, max: 1.4, step: 0.01 },
    dof: { value: 0.45, min: 0, max: 4, step: 0.05, label: "DOF" },
    focusDistance: { value: 0.02, min: 0.005, max: 0.08, step: 0.001, label: "Focus distance" },
    laptopPosition: { value: { x: -0.55, z: -0.08 }, step: 0.01, label: "Laptop position" },
    laptopRotation: { value: -3, min: -15, max: 15, step: 1, label: "Laptop rotation" },
    folderPosition: { value: { x: 1.55, z: 0.82 }, step: 0.01, label: "Folder position" },
    folderRotation: { value: 7, min: -15, max: 15, step: 1, label: "Folder rotation Y" },
    paperPosition: { value: { x: -2, z: 0.518 }, step: 0.01, label: "Paper position" },
    paperRotation: { value: 12, min: -15, max: 30, step: 1, label: "Paper rotation Y" },
    penPosition: { value: { x: 0.46, z: 0.05 }, step: 0.01, label: "Pen position" },
    penRotation: { value: 78, min: -90, max: 90, step: 1, label: "Pen rotation Y" },
    coffeePosition: { value: { x: 1.58, z: -0.58 }, step: 0.01, label: "Coffee position" },
    plantPosition: { value: { x: -2.48, y: 1.35, z: -2.34 }, step: 0.01, label: "Plant position" },
    plantRotationY: { value: -12, min: -45, max: 45, step: 1, label: "Plant rotation Y" },
    lampPosition: { value: { x: -1.5, y: -0.02, z: -0.45 }, step: 0.01, label: "Lamp position" },
    helpers: false,
  });
  const settings: SceneSettings = {
    desk: controls.deskLampIntensity,
    moon: controls.moonlightIntensity,
    moonColor: controls.moonlightColor,
    bounce: controls.bounceIntensity,
    bloom: controls.bloom,
    fog: controls.fog,
    exposure: controls.exposure,
    dof: controls.dof,
    focusDistance: controls.focusDistance,
    laptopPosition: [controls.laptopPosition.x, 0, controls.laptopPosition.z],
    laptopRotation: controls.laptopRotation,
    folderPosition: [controls.folderPosition.x, controls.folderPosition.z],
    folderRotation: controls.folderRotation,
    paperPosition: [controls.paperPosition.x, controls.paperPosition.z],
    paperRotation: controls.paperRotation,
    penPosition: [controls.penPosition.x, controls.penPosition.z],
    penRotation: controls.penRotation,
    coffeePosition: [controls.coffeePosition.x, 0.175, controls.coffeePosition.z],
    plantPosition: [controls.plantPosition.x, controls.plantPosition.y, controls.plantPosition.z],
    plantRotationY: controls.plantRotationY,
    lampPosition: [controls.lampPosition.x, controls.lampPosition.y, controls.lampPosition.z],
    helpers: controls.helpers,
  };
  return <div className={`canvas-stage${diagnosticMobileViewport?" diagnostic-mobile-viewport":""}`}>
    <Canvas shadows={renderIsolation.shadows} dpr={RENDERING_INTENT.renderer.dpr} camera={{ position: [-0.72, 1.9, 4.82], fov: 42, near: 0.1, far: 45 }} gl={{ antialias: RENDERING_INTENT.renderer.antialias, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: settings.exposure, powerPreference: RENDERING_INTENT.renderer.powerPreference }}>
      <Suspense fallback={null}><Scene s={settings} cameraSystem={cameraSystem} certificateSlug={route.slug} renderIsolation={renderIsolation} /></Suspense>
      {process.env.NODE_ENV!=="production"&&<RenderingDiagnosticsProbe settings={settings} isolation={renderIsolation} stateRef={cameraSystem.cameraState} onSnapshot={setRenderingDiagnostics} />}
    </Canvas>
    <Leva collapsed />
    <CameraLocationLabel stateRef={cameraSystem.cameraState} />
    <NavigationDebugPanel visible={cameraSystem.navigationDebug} stateRef={cameraSystem.cameraState} boundsVisible={settings.helpers} />
    <MobileCameraNavigation selectedScene={cameraSystem.selectedScene} selectedFocusCollection={cameraSystem.selectedFocusCollection} stateRef={cameraSystem.cameraState} onNavigate={navigateScene} />
    {process.env.NODE_ENV!=="production"&&<RenderingDiagnosticsPanel snapshot={renderingDiagnostics} isolation={renderIsolation} onChange={setRenderIsolation} mobileViewport={diagnosticMobileViewport} onMobileViewportChange={setDiagnosticMobileViewport} />}
    <CinematicFade replayKey={cameraSystem.introVersion} skipKey={cameraSystem.skipVersion} hold={route.directEntry?.18:cameraSystem.openingHold*.55} duration={route.directEntry?1.65:cameraSystem.fadeDuration} reducedMotion={cameraSystem.reducedMotion} />
  </div>;
}
