"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { createWebStoragePersistence } from "@denk/cinematic-navigation/persistence";
import { getAdjacentShot, getFocusDirectionForKey, isTrackpadPinchOut } from "./cameraNavigation";
import type { CameraNavigationState, FocusCollectionId, FocusDirection, NavigationLocation, SceneId } from "./navigationTypes";
import { getAdjacentScene, locationForScene, SCENE_REGISTRY, sceneForCameraTarget } from "./sceneRegistry";
import { createPortfolioNavigationEngine, fromEngineLocation, toEngineLocation } from "./portfolioEngine";
import type { ShotId } from "./shotTypes";

type InitialNavigation=ShotId|NavigationLocation;
interface NavigationEngineOptions {onNavigate?:(location:NavigationLocation)=>void}
const locationFromTarget=(target:ShotId):NavigationLocation=>({sceneId:sceneForCameraTarget(target),focusCollectionId:null,focusItemId:null,cameraTarget:target});
const normalizeLocation=(value:InitialNavigation)=>typeof value==="string"?locationFromTarget(value):value;
const CAMERA_DEFAULTS={pauseTransitions:false,openingDuration:13.5,openingHold:2.4,fadeDuration:3.2,transitionSpeed:1,breathingEnabled:true,breathingStrength:1,breathingSpeed:1,overshootStrength:.018,nearClip:.1,farClip:45,targetHelpers:false,navigationDebug:false};
const DEFAULT_TUNING:Record<string,unknown>={};

interface GuidedInputSystem {selectedScene:SceneId;selectedFocusCollection:FocusCollectionId|null;selectedFocusItem:string|null;focusNeighbor:(direction:FocusDirection)=>string|null;cameraState:React.MutableRefObject<{introComplete:boolean;isTransitioning?:boolean}>}
const guidedInputDestination=(system:GuidedInputSystem,direction:-1|1)=>system.selectedFocusCollection?(direction>0?getAdjacentScene(system.selectedScene,1):system.selectedScene):getAdjacentScene(system.selectedScene,direction);

export function useCameraKeyboardNavigation(system:GuidedInputSystem,navigateTo:(scene:SceneId)=>void){
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{
      if(!system.cameraState.current.introComplete||event.metaKey||event.ctrlKey||event.altKey)return;
      const element=event.target as HTMLElement|null;
      if(element?.matches("input, textarea, select, button, [contenteditable='true']"))return;
      const focusDirection=getFocusDirectionForKey(event.key);
      if(system.selectedFocusCollection&&system.selectedFocusItem&&focusDirection){event.preventDefault();system.focusNeighbor(focusDirection);return;}
      const direction=event.key==="ArrowRight"||event.key==="ArrowDown"||event.code==="Space"?1:event.key==="ArrowLeft"||event.key==="ArrowUp"?-1:0;
      if(!direction)return;
      event.preventDefault();
      const scene=guidedInputDestination(system,direction as -1|1);
      if(scene)navigateTo(scene);
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  },[system,navigateTo]);
}

export function useCameraTapNavigation(system:GuidedInputSystem,navigateTo:(scene:SceneId)=>void){
  useEffect(()=>{
    if(!window.matchMedia("(pointer: coarse)").matches)return;
    let start:{x:number;y:number;time:number}|null=null;
    const onTouchStart=(event:TouchEvent)=>{
      if(event.touches.length!==1){start=null;return;}
      const element=event.target as HTMLElement|null;
      if(element?.closest("input, textarea, select, button, [contenteditable='true']")){start=null;return;}
      const touch=event.touches[0];start={x:touch.clientX,y:touch.clientY,time:Date.now()};
    };
    const onTouchEnd=(event:TouchEvent)=>{
      if(!start||event.changedTouches.length!==1){start=null;return;}
      const touch=event.changedTouches[0],dx=touch.clientX-start.x,dy=touch.clientY-start.y,elapsed=Date.now()-start.time;start=null;
      if(!system.cameraState.current.introComplete||system.cameraState.current.isTransitioning)return;
      if(elapsed<=500&&Math.abs(dx)<12&&Math.abs(dy)<12){const scene=guidedInputDestination(system,1);if(scene)navigateTo(scene);}
    };
    const cancel=()=>{start=null;};
    window.addEventListener("touchstart",onTouchStart,{passive:true});window.addEventListener("touchend",onTouchEnd,{passive:true});window.addEventListener("touchcancel",cancel,{passive:true});
    return()=>{window.removeEventListener("touchstart",onTouchStart);window.removeEventListener("touchend",onTouchEnd);window.removeEventListener("touchcancel",cancel);};
  },[system,navigateTo]);
}

export function useCameraPinchNavigation(system:{cameraState:React.MutableRefObject<{introComplete:boolean;isTransitioning:boolean}>},goToWorkspace:()=>void){
  useEffect(()=>{
    let triggered=false,trackpadDelta=0,trackpadReset=0;
    const onWheel=(event:WheelEvent)=>{
      if(!event.ctrlKey)return;event.preventDefault();window.clearTimeout(trackpadReset);trackpadReset=window.setTimeout(()=>{trackpadDelta=0;triggered=false;},180);
      if(triggered||event.deltaY>=0)return;trackpadDelta+=-event.deltaY;if(!isTrackpadPinchOut(trackpadDelta)||!system.cameraState.current.introComplete)return;triggered=true;goToWorkspace();
    };
    window.addEventListener("wheel",onWheel,{passive:false});
    return()=>{window.removeEventListener("wheel",onWheel);window.clearTimeout(trackpadReset);};
  },[system,goToWorkspace]);
}

export function usePrefersReducedMotion(){
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{const query=window.matchMedia("(prefers-reduced-motion: reduce)"),update=()=>setReduced(query.matches);update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update);},[]);
  return reduced;
}

export function useCinematicNavigation(initialValue:InitialNavigation=locationForScene("about"),directEntry=false,options:NavigationEngineOptions={}){
  const onNavigate=options.onNavigate;
  const reducedMotion=usePrefersReducedMotion();
  const [introVersion,setIntroVersion]=useState(0),[skipVersion,setSkipVersion]=useState(0);
  const [focusVersion,setFocusVersion]=useState(0);
  const routeLocation=normalizeLocation(initialValue);
  const initialRequested=directEntry?routeLocation:locationForScene("about");
  const initialCurrent=directEntry?routeLocation:locationForScene("opening");
  const [engine]=useState(()=>{
    const persistence=typeof window==="undefined"?undefined:createWebStoragePersistence(window.localStorage);
    const instance=createPortfolioNavigationEngine(initialCurrent,persistence);
    if(initialRequested.sceneId!==initialCurrent.sceneId||initialRequested.cameraTarget!==initialCurrent.cameraTarget)instance.goToScene(initialRequested.sceneId,initialRequested.cameraTarget);
    return instance;
  });
  const [requestedLocation,setRequestedLocation]=useState<NavigationLocation>(initialRequested);
  const stateRef=useRef<CameraNavigationState>({...initialCurrent,requestedScene:initialRequested.sceneId,requestedFocusCollection:initialRequested.focusCollectionId,requestedFocusItem:initialRequested.focusItemId,requestedCameraTarget:initialRequested.cameraTarget,transitionState:"idle",lastVisitedScene:null,introCompleted:directEntry,introActive:!directEntry,transitionProgress:directEntry?1:0,viewport:"desktop",cameraPosition:[0,0,0],cameraLookAt:[0,0,0],currentShot:initialCurrent.cameraTarget,requestedShot:initialRequested.cameraTarget,transitioning:false,currentTarget:initialCurrent.cameraTarget,requestedTarget:initialRequested.cameraTarget,isTransitioning:false,isIntroActive:!directEntry,introComplete:directEntry,lastVisitedShot:null});

  const requestLocation=useCallback((location:NavigationLocation,reframeFocus=false)=>{
    const previous=stateRef.current;
    if(reframeFocus&&previous.requestedCameraTarget===location.cameraTarget&&previous.requestedFocusItem!==location.focusItemId)setFocusVersion((value)=>value+1);
    stateRef.current.requestedScene=location.sceneId;stateRef.current.requestedFocusCollection=location.focusCollectionId;stateRef.current.requestedFocusItem=location.focusItemId;stateRef.current.requestedCameraTarget=location.cameraTarget;
    setRequestedLocation(location);
  },[]);
  const goToScene=useCallback((sceneId:SceneId,cameraTarget:ShotId=SCENE_REGISTRY[sceneId].cameraTarget)=>{const result=engine.goToScene(sceneId,cameraTarget);if(!result)return null;const location=fromEngineLocation(result);requestLocation(location);onNavigate?.(location);return location;},[engine,requestLocation,onNavigate]);
  const enterFocus=useCallback((collectionId:FocusCollectionId,itemId:string)=>{const result=engine.enterFocus(collectionId,itemId);if(!result)return null;const location=fromEngineLocation(result);requestLocation(location,true);onNavigate?.(location);return location;},[engine,requestLocation,onNavigate]);
  const previewFocus=useCallback((collectionId:FocusCollectionId,itemId:string)=>{
    const result=engine.enterFocus(collectionId,itemId);if(!result)return null;
    const continuousPointerFocus=stateRef.current.requestedFocusCollection===collectionId&&stateRef.current.requestedCameraTarget===result.cameraTargetId;
    const location=fromEngineLocation(result);requestLocation(location,!continuousPointerFocus);onNavigate?.(location);return location;
  },[engine,requestLocation,onNavigate]);
  const exitFocus=useCallback(()=>{const result=engine.exitFocus();if(!result)return null;const location=fromEngineLocation(result);requestLocation(location);onNavigate?.(location);return location;},[engine,requestLocation,onNavigate]);
  const goToCameraTarget=useCallback((target:ShotId)=>{
    const location=target==="certificate-detail"&&stateRef.current.requestedFocusCollection==="certificates"?{...requestedLocation,cameraTarget:target}:locationFromTarget(target);
    engine.syncLocation(toEngineLocation(location));requestLocation(location);
  },[engine,requestLocation,requestedLocation]);
  const syncRoute=useCallback((location:NavigationLocation)=>{const result=engine.syncLocation(toEngineLocation(location));if(result)requestLocation(fromEngineLocation(result),true);},[engine,requestLocation]);
  const nextScene=useCallback(()=>{const result=engine.nextScene();if(!result)return null;const location=fromEngineLocation(result);requestLocation(location);onNavigate?.(location);return location.sceneId;},[engine,requestLocation,onNavigate]);
  const previousScene=useCallback(()=>{const result=engine.previousScene();if(!result)return null;const location=fromEngineLocation(result);requestLocation(location);onNavigate?.(location);return location.sceneId;},[engine,requestLocation,onNavigate]);
  const moveFocus=useCallback((direction:-1|1)=>{const result=engine.moveFocus(direction);if(!result)return null;const location=fromEngineLocation(result);requestLocation(location,true);onNavigate?.(location);return location.focusItemId;},[engine,requestLocation,onNavigate]);
  const focusNeighbor=useCallback((direction:FocusDirection)=>{const result=engine.moveFocus(direction);if(!result)return null;const location=fromEngineLocation(result);requestLocation(location,true);onNavigate?.(location);return location.focusItemId;},[engine,requestLocation,onNavigate]);

  useEffect(()=>{if(requestedLocation.sceneId!=="opening")stateRef.current.lastVisitedScene=requestedLocation.sceneId;},[requestedLocation]);

  const resumeLastVisitedScene=()=>{const result=engine.restoreLastVisitedScene();if(!result)return null;const location=fromEngineLocation(result);requestLocation(location);onNavigate?.(location);return location.sceneId;};

  return {...CAMERA_DEFAULTS,engine,selectedTarget:requestedLocation.cameraTarget,selectedShot:requestedLocation.cameraTarget,selectedScene:requestedLocation.sceneId,selectedFocusCollection:requestedLocation.focusCollectionId,selectedFocusItem:requestedLocation.focusItemId,requestedShot:requestedLocation.cameraTarget,requestedLocation,navigateTo:goToCameraTarget,goToShot:goToCameraTarget,goToScene,enterFocus,previewFocus,exitFocus,nextScene,previousScene,nextFocus:()=>moveFocus(1),previousFocus:()=>moveFocus(-1),focusNeighbor,syncRoute,getCurrentScene:()=>stateRef.current.sceneId,getCurrentFocus:()=>stateRef.current.focusItemId,getCurrentShot:()=>stateRef.current.currentTarget,getPreviousShot:()=>getAdjacentShot(stateRef.current.currentTarget,-1),getNextShot:()=>getAdjacentShot(stateRef.current.currentTarget,1),resumeLastVisitedScene,resumeLastVisitedShot:resumeLastVisitedScene,replayIntro:()=>setIntroVersion((value)=>value+1),skipIntro:()=>setSkipVersion((value)=>value+1),cameraState:stateRef,introVersion,skipVersion,workspaceVersion:0,focusVersion,reducedMotion,directEntry,tuning:DEFAULT_TUNING};
}

/** @deprecated Use useCinematicNavigation. */
export const useCinematicShots=useCinematicNavigation;
/** @deprecated Use useCinematicNavigation. */
export const useCinematicCamera=useCinematicNavigation;
export type CinematicNavigationSystem=ReturnType<typeof useCinematicNavigation>;
