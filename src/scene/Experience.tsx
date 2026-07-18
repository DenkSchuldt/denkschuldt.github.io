"use client";

import { Canvas } from "@react-three/fiber";
import { lazy,Suspense,useCallback,useEffect,useState } from "react";
import * as THREE from "three";
import type { SceneSettings } from "./Scene";
import { CinematicFade } from "./camera/CinematicFade";
import { NavigationDebugPanel } from "./camera/NavigationDebugPanel";
import { SceneNavigation } from "./camera/SceneNavigation";
import { shouldSyncRouteShot } from "./camera/cameraNavigation";
import type { NavigationLocation,SceneId } from "./camera/navigationTypes";
import { pathForFocus,pathForScene } from "./camera/sceneRoutes";
import { INTRO_DESTINATION } from "./camera/shotRegistry";
import { useCameraKeyboardNavigation,useCameraPinchNavigation,useCameraTapNavigation,useCinematicNavigation } from "./camera/useCinematicCamera";
import { useSceneRouter } from "./camera/useSceneRouter";
import type { RenderingDiagnosticsSnapshot } from "./diagnostics/RenderingDiagnostics";
import { DEFAULT_RENDER_ISOLATION } from "./rendering/renderIsolation";
import { RENDERING_INTENT } from "./rendering/renderingIntent";
import { POEMS_FOLDER_LAYOUT } from "./sceneLayout";

const Scene=lazy(()=>import("./Scene").then((module)=>({default:module.Scene})));
const RenderingDiagnosticsProbe=lazy(()=>import("./diagnostics/RenderingDiagnostics").then((module)=>({default:module.RenderingDiagnosticsProbe})));
const RenderingDiagnosticsPanel=lazy(()=>import("./diagnostics/RenderingDiagnostics").then((module)=>({default:module.RenderingDiagnosticsPanel})));
const SETTINGS:SceneSettings={desk:19,moon:1.05,moonColor:"#91a8c2",bounce:.62,bloom:.08,fog:16.5,exposure:RENDERING_INTENT.renderer.exposure,dof:.45,focusDistance:.02,helpers:false,laptopPosition:[-.55,0,-.28],laptopRotation:-3,folderPosition:POEMS_FOLDER_LAYOUT.position,folderRotation:POEMS_FOLDER_LAYOUT.rotationDegrees,paperPosition:[-2,.518],paperRotation:12,penPosition:[.46,.05],penRotation:78,coffeePosition:[1.18,.175,-.58],plantPosition:[-2.48,1.35,-2.34],plantRotationY:-12,lampPosition:[-1.9,-.07,-.45]};

export default function Experience({initialPath="/"}:{initialPath?:string}) {
  const [renderIsolation,setRenderIsolation]=useState(DEFAULT_RENDER_ISOLATION);
  const [renderingDiagnostics,setRenderingDiagnostics]=useState<RenderingDiagnosticsSnapshot|null>(null);
  const [diagnosticMobileViewport,setDiagnosticMobileViewport]=useState(false);
  const [sceneReady,setSceneReady]=useState(false);
  const onSceneReady=useCallback(()=>setSceneReady(true),[]);
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
  const route=useSceneRouter(initialPath);
  const {focusCollectionId:routeFocusCollection,sceneId:routeScene,navigate:routeNavigate,navigateWithinScene,replaceWithinScene}=route;
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
    else routeNavigate(path);
  },[routeFocusCollection,routeScene,routeNavigate,navigateWithinScene,replaceWithinScene]);
  const cameraSystem=useCinematicNavigation(route,route.directEntry,{onNavigate:commitNavigation});
  const {syncRoute,goToScene,resumeFromStart,cameraState,introVersion}=cameraSystem;
  useEffect(()=>{
    if(!shouldSyncRouteShot(route.path,route.directEntry)) return;
    syncRoute({sceneId:route.sceneId,focusCollectionId:route.focusCollectionId,focusItemId:route.focusItemId,cameraTarget:route.cameraTarget});
  },[route.path,route.sceneId,route.focusCollectionId,route.focusItemId,route.cameraTarget,route.directEntry,syncRoute]);
  const navigateScene=useCallback((sceneId:SceneId)=>{
    if(resumeFromStart(sceneId))return;
    goToScene(sceneId);
  },[resumeFromStart,goToScene]);
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
      if(sawOpening&&state.introComplete&&state.currentTarget==="opening"&&state.requestedTarget==="opening")return;
      if(sawOpening&&state.introComplete&&state.currentTarget===INTRO_DESTINATION) {
        goToScene("about",INTRO_DESTINATION);
        return;
      }
      frame=window.requestAnimationFrame(waitForOpening);
    };
    frame=window.requestAnimationFrame(waitForOpening);
    return()=>window.cancelAnimationFrame(frame);
  },[route.path,route.directEntry,cameraState,introVersion,goToScene]);
  const settings=SETTINGS;
  return <div className={`canvas-stage${diagnosticMobileViewport?" diagnostic-mobile-viewport":""}`}>
    <Canvas shadows={renderIsolation.shadows} dpr={RENDERING_INTENT.renderer.dpr} camera={{ position: [-0.72, 1.9, 4.82], fov: 42, near: 0.1, far: 45 }} gl={{ antialias: RENDERING_INTENT.renderer.antialias, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: settings.exposure, powerPreference: RENDERING_INTENT.renderer.powerPreference }}>
      <Suspense fallback={null}><Scene s={settings} cameraSystem={cameraSystem} certificateSlug={route.slug} renderIsolation={renderIsolation} onReady={onSceneReady}/></Suspense>
      {process.env.NODE_ENV!=="production"&&<Suspense fallback={null}><RenderingDiagnosticsProbe settings={settings} isolation={renderIsolation} stateRef={cameraSystem.cameraState} onSnapshot={setRenderingDiagnostics}/></Suspense>}
    </Canvas>
    <div className={`experience-loading${sceneReady?" is-ready":""}`} role="status" aria-live="polite"><span>Entering workspace</span></div>
    <NavigationDebugPanel visible={cameraSystem.navigationDebug} stateRef={cameraSystem.cameraState} boundsVisible={settings.helpers} />
    <SceneNavigation selectedScene={cameraSystem.selectedScene} selectedFocusCollection={cameraSystem.selectedFocusCollection} selectedFocusItem={cameraSystem.selectedFocusItem} resumeScene={cameraSystem.resumeScene} stateRef={cameraSystem.cameraState} onNavigate={navigateScene} onEnterFocus={cameraSystem.enterFocus} onExitFocus={cameraSystem.exitFocus} />
    {process.env.NODE_ENV!=="production"&&<Suspense fallback={null}><RenderingDiagnosticsPanel snapshot={renderingDiagnostics} isolation={renderIsolation} onChange={setRenderIsolation} mobileViewport={diagnosticMobileViewport} onMobileViewportChange={setDiagnosticMobileViewport}/></Suspense>}
    <CinematicFade replayKey={cameraSystem.introVersion} skipKey={cameraSystem.skipVersion} hold={route.directEntry?.18:cameraSystem.openingHold*.55} duration={route.directEntry?1.65:cameraSystem.fadeDuration} reducedMotion={cameraSystem.reducedMotion} />
  </div>;
}
