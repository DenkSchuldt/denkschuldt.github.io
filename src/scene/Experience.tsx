"use client";

import { Canvas } from "@react-three/fiber";
import { lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState } from "react";
import * as THREE from "three";
import { CinematicRuntimeProvider, RuntimeInspector, useCinematicRuntimeController, useRuntimeNodes } from "@denk/cinematic-navigation/react";
import type { RuntimeNodeRegistration } from "@denk/cinematic-navigation";
import { RuntimeFrameBridge } from "@denk/cinematic-navigation/r3f";
import { Scene,type SceneSettings } from "./Scene";
import { CinematicFade } from "./camera/CinematicFade";
import { NavigationDebugPanel } from "./camera/NavigationDebugPanel";
import { SceneNavigation } from "./camera/SceneNavigation";
import { shouldSyncRouteShot } from "./camera/cameraNavigation";
import type { NavigationLocation,SceneId } from "./camera/navigationTypes";
import { pathForFocus,pathForScene } from "./camera/sceneRoutes";
import { INTRO_DESTINATION } from "./camera/shotRegistry";
import { useAutoSceneNavigation,useCameraKeyboardNavigation,useCameraPinchNavigation,useCameraTapNavigation,useCinematicNavigation } from "./camera/useCinematicCamera";
import type { CinematicNavigationSystem } from "./camera/useCinematicCamera";
import { useSceneRouter } from "./camera/useSceneRouter";
import type { RenderingDiagnosticsSnapshot } from "./diagnostics/RenderingDiagnostics";
import { DEFAULT_RENDER_ISOLATION } from "./rendering/renderIsolation";
import { RENDERING_INTENT } from "./rendering/renderingIntent";
import { POEMS_FOLDER_LAYOUT } from "./sceneLayout";
import { usePoems } from "./content/usePoems";
import { FOCUS_COLLECTIONS,locationForScene } from "./camera/sceneRegistry";
import { GUIDED_SCENE_IDS } from "./camera/sceneRegistry";

const RenderingDiagnosticsProbe=lazy(()=>import("./diagnostics/RenderingDiagnostics").then((module)=>({default:module.RenderingDiagnosticsProbe})));
const RenderingDiagnosticsPanel=lazy(()=>import("./diagnostics/RenderingDiagnostics").then((module)=>({default:module.RenderingDiagnosticsPanel})));
// Keep the reading experience (and its draggable dialog dependency) out of
// the main scene bundle. This still resolves for direct /poems/:slug entries
// because the reader is rendered as soon as the route's poem is available.
const PoemReader=lazy(()=>import("./components/PoemReader").then((module)=>({default:module.PoemReader})));
const RUNTIME_NODES:readonly RuntimeNodeRegistration[]=[
  {id:"world",scope:"world",mountPolicy:"persistent"},
  ...GUIDED_SCENE_IDS.map((sceneId)=>({id:`scene:${sceneId}`,scope:"scene" as const,sceneId,mountPolicy:"persistent" as const})),
  ...Object.values(FOCUS_COLLECTIONS).map((collection)=>({id:`collection:${collection.id}`,scope:"collection" as const,sceneId:collection.sceneId,collectionId:collection.id,mountPolicy:"persistent" as const})),
];

function PortfolioRuntimeDeclaration({cameraSystem}:{cameraSystem:CinematicNavigationSystem}){
  const nodes=useMemo(()=>{
    const focusCollection=cameraSystem.selectedFocusCollection,focusItem=cameraSystem.selectedFocusItem;
    return focusCollection&&focusItem?[...RUNTIME_NODES,{id:`focus:${focusCollection}:${focusItem}`,scope:"focus-item" as const,sceneId:cameraSystem.selectedScene,collectionId:focusCollection,focusItemId:focusItem,mountPolicy:"persistent" as const}]:RUNTIME_NODES;
  },[cameraSystem.selectedFocusCollection,cameraSystem.selectedFocusItem,cameraSystem.selectedScene]);
  useRuntimeNodes(nodes);
  return null;
}
const SETTINGS:SceneSettings={desk:19,moon:1.05,moonColor:"#91a8c2",bounce:.62,bloom:.08,fog:16.5,exposure:RENDERING_INTENT.renderer.exposure,dof:.45,focusDistance:.02,helpers:false,laptopPosition:[-.55,0,-.28],laptopRotation:-3,folderPosition:POEMS_FOLDER_LAYOUT.position,folderRotation:POEMS_FOLDER_LAYOUT.rotationDegrees,paperPosition:[-2,.518],paperRotation:12,penPosition:[.46,.05],penRotation:78,coffeePosition:[1.18,.175,-.58],plantPosition:[-2.48,1.35,-2.34],plantRotationY:-12,lampPosition:[-1.9,-.07,-.45]};

export default function Experience({initialPath="/"}:{initialPath?:string}) {
  const [renderIsolation,setRenderIsolation]=useState(DEFAULT_RENDER_ISOLATION);
  const [renderingDiagnostics,setRenderingDiagnostics]=useState<RenderingDiagnosticsSnapshot|null>(null);
  const [diagnosticMobileViewport,setDiagnosticMobileViewport]=useState(false);
  const [sceneReady,setSceneReady]=useState(false);
  const [poemReaderOpen,setPoemReaderOpen]=useState(false);
  const [readerPoemSlug,setReaderPoemSlug]=useState<string|null>(null);
  const directPoemEntry=useRef(/^\/poems\/[^/]+(?:\/)?$/.test(initialPath));
  const directPoemOpened=useRef(false);
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
  const runtime=useCinematicRuntimeController(cameraSystem.engine);
  const poemsSceneActive=cameraSystem.selectedScene==="poems";
  const poemsContent=usePoems(poemsSceneActive&&routeFocusCollection==="poems"?route.slug??null:null,poemsSceneActive);
  const poemNavigationKey=poemsContent.poems.map(({slug,title,date,imageUrl})=>`${slug}\u0000${title}\u0000${date}\u0000${imageUrl??""}`).join("\u0001");
  const poemNavigationItems=useMemo(()=>poemsContent.poems.map(({slug,title,date,imageUrl})=>({slug,title,date,imageUrl})),[poemNavigationKey]);
  const {syncRoute,goToScene,resumeFromStart,cameraState,introVersion}=cameraSystem;
  useEffect(()=>{
    if(!directPoemEntry.current||directPoemOpened.current||route.focusCollectionId!=="poems"||!route.slug||poemsContent.loading)return;
    if(!poemsContent.poems.some((poem)=>poem.slug===route.slug))return;
    directPoemOpened.current=true;
    setReaderPoemSlug(route.slug);
    setPoemReaderOpen(true);
  },[poemsContent.loading,poemsContent.poems,route.focusCollectionId,route.slug]);
  useEffect(()=>{
    const collection=FOCUS_COLLECTIONS.poems;
    const unregister=poemNavigationItems.map((poem,index)=>cameraSystem.engine.registerFocusItem("poems",{
      id:poem.slug,subjectId:`poem:${poem.slug}`,cameraTargetId:"poem-detail",framing:collection.defaultFraming,transition:collection.transition,
      neighbors:{left:poemNavigationItems[index-1]?.slug,right:poemNavigationItems[index+1]?.slug},
      spatial:{x:index,y:0,column:index,row:0},metadata:{label:poem.title,route:`/poems/${poem.slug}`,date:poem.date,imageUrl:poem.imageUrl},
    }));
    return()=>unregister.forEach((dispose)=>dispose());
  },[cameraSystem.engine,poemNavigationItems]);
  useEffect(()=>{
    if(!shouldSyncRouteShot(route.path,route.directEntry)) return;
    syncRoute({sceneId:route.sceneId,focusCollectionId:route.focusCollectionId,focusItemId:route.focusItemId,cameraTarget:route.cameraTarget});
  },[route.path,route.sceneId,route.focusCollectionId,route.focusItemId,route.cameraTarget,route.directEntry,syncRoute]);
  const navigateScene=useCallback((sceneId:SceneId)=>{
    if(resumeFromStart(sceneId))return;
    goToScene(sceneId);
  },[resumeFromStart,goToScene]);
  const openPoemReader=useCallback(()=>{
    const slug=cameraSystem.selectedFocusCollection==="poems"?cameraSystem.selectedFocusItem:poemsContent.poems[0]?.slug;
    if(!slug)return;
    setReaderPoemSlug(slug);
    // Reading mode is URL-addressable even when it was opened from the
    // collection preview, so the first poem gets a shareable slug immediately.
    if(routeScene==="poems")replaceWithinScene(pathForFocus("poems",slug));
    setPoemReaderOpen(true);
  },[cameraSystem.selectedFocusCollection,cameraSystem.selectedFocusItem,poemsContent.poems,replaceWithinScene,routeScene]);
  const changeReaderPoem=useCallback((slug:string)=>{
    setReaderPoemSlug(slug);
    // Keep the shareable poem slug authoritative while the reader remains a
    // UI overlay. Poems deliberately keep the same camera framing, so this
    // route replacement does not trigger a camera refocus or notebook motion.
    if(routeScene==="poems")replaceWithinScene(pathForFocus("poems",slug));
  },[replaceWithinScene,routeScene]);
  const closePoemReader=useCallback(()=>{
    setPoemReaderOpen(false);
    // Reading mode is an overlay, not a separate camera destination. Return
    // to the Poems parent location in-place so the reader closes without
    // invoking the collection's normal `exitBehavior: "start"` rule.
    if(cameraSystem.selectedScene==="poems"&&cameraSystem.selectedFocusCollection==="poems"){
      cameraSystem.syncRoute(locationForScene("poems"));
      replaceWithinScene(pathForScene("poems"));
    }
  },[cameraSystem,replaceWithinScene]);
  useCameraKeyboardNavigation(cameraSystem,navigateScene);
  useCameraTapNavigation(cameraSystem,navigateScene);
  useAutoSceneNavigation(cameraSystem,navigateScene);
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
  return <CinematicRuntimeProvider runtime={runtime}>
    <PortfolioRuntimeDeclaration cameraSystem={cameraSystem}/>
    <div className={`canvas-stage${diagnosticMobileViewport?" diagnostic-mobile-viewport":""}${poemReaderOpen?" poem-reader-open":""}`}>
    {/* Use the explicit PCF mode instead of Canvas' boolean default. The
        boolean form selects THREE.PCFSoftShadowMap, which is deprecated in
        the installed Three.js version and gets re-applied whenever the
        experience re-renders. */}
    <Canvas shadows={renderIsolation.shadows ? "percentage" : false} dpr={RENDERING_INTENT.renderer.dpr} camera={{ position: [-0.72, 1.9, 4.82], fov: 42, near: 0.1, far: 45 }} gl={{ antialias: RENDERING_INTENT.renderer.antialias, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: settings.exposure, powerPreference: RENDERING_INTENT.renderer.powerPreference }}>
      <CinematicRuntimeProvider runtime={runtime}>
        <RuntimeFrameBridge runtime={runtime} paused={poemReaderOpen}/>
        <Suspense fallback={null}><Scene s={settings} cameraSystem={cameraSystem} certificateSlug={route.slug} poemsContent={poemsContent} onPoemRead={openPoemReader} renderIsolation={renderIsolation} onReady={onSceneReady}/></Suspense>
        {process.env.NODE_ENV!=="production"&&<Suspense fallback={null}><RenderingDiagnosticsProbe settings={settings} isolation={renderIsolation} stateRef={cameraSystem.cameraState} onSnapshot={setRenderingDiagnostics}/></Suspense>}
      </CinematicRuntimeProvider>
    </Canvas>
    <div className={`experience-loading${sceneReady?" is-ready":""}`} role="status" aria-live="polite"><span>Entering workspace</span></div>
    <NavigationDebugPanel visible={cameraSystem.navigationDebug} stateRef={cameraSystem.cameraState} boundsVisible={settings.helpers} />
    <RuntimeInspector visible={cameraSystem.navigationDebug} metrics={renderingDiagnostics?{drawCalls:renderingDiagnostics.performance.drawCalls,shadowCasters:renderingDiagnostics.performance.shadowCasters,gpuResources:renderingDiagnostics.performance.gpuResources}:undefined} />
    <SceneNavigation selectedScene={cameraSystem.selectedScene} selectedFocusCollection={cameraSystem.selectedFocusCollection} selectedFocusItem={cameraSystem.selectedFocusItem} resumeScene={cameraSystem.resumeScene} visitedAutoScenes={cameraSystem.visitedAutoScenes} stateRef={cameraSystem.cameraState} onNavigate={navigateScene} onEnterFocus={cameraSystem.enterFocus} onExitFocus={cameraSystem.exitFocus} />
    <Suspense fallback={null}><PoemReader open={poemReaderOpen} poems={poemsContent.poems} slug={readerPoemSlug} onSlugChange={changeReaderPoem} onClose={closePoemReader}/></Suspense>
    {process.env.NODE_ENV!=="production"&&<Suspense fallback={null}><RenderingDiagnosticsPanel snapshot={renderingDiagnostics} isolation={renderIsolation} onChange={setRenderIsolation} mobileViewport={diagnosticMobileViewport} onMobileViewportChange={setDiagnosticMobileViewport}/></Suspense>}
    <CinematicFade replayKey={cameraSystem.introVersion} skipKey={cameraSystem.skipVersion} hold={route.directEntry?.18:cameraSystem.openingHold*.55} duration={route.directEntry?1.65:cameraSystem.fadeDuration} reducedMotion={cameraSystem.reducedMotion} />
    </div>
  </CinematicRuntimeProvider>;
}
