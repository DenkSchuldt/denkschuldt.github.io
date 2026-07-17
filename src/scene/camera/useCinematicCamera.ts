"use client";

import { button, folder, useControls } from "leva";
import { useEffect, useMemo, useRef, useState } from "react";
import { CAMERA_TARGETS } from "./cameraTargets";
import { getAdjacentShot, isTrackpadPinchOut } from "./cameraNavigation";
import { INTRO_DESTINATION, SHOT_REGISTRY } from "./shotRegistry";
import type { ShotId } from "./shotTypes";

const LAST_SHOT_KEY="cinematic-room:last-shot";
type CameraTargetId=ShotId;

export function useCameraKeyboardNavigation(system: { selectedTarget:CameraTargetId; cameraState:React.MutableRefObject<{introComplete:boolean}> }, navigateTo:(target:CameraTargetId)=>void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!system.cameraState.current.introComplete || event.metaKey || event.ctrlKey || event.altKey) return;
      const element = event.target as HTMLElement | null;
      if (element?.matches("input, textarea, select, button, [contenteditable='true']")) return;
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" || event.code === "Space" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      const target=getAdjacentShot(system.selectedTarget,direction as -1|1);
      if(target) navigateTo(target);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [system,navigateTo]);
}

export function useCameraTapNavigation(system: { selectedTarget:CameraTargetId; cameraState:React.MutableRefObject<{introComplete:boolean;isTransitioning:boolean}> }, navigateTo:(target:CameraTargetId)=>void) {
  useEffect(() => {
    if(!window.matchMedia("(pointer: coarse)").matches) return;
    let start:{x:number;y:number;time:number}|null=null;
    const onTouchStart=(event:TouchEvent)=>{
      if(event.touches.length!==1) { start=null; return; }
      const element=event.target as HTMLElement|null;
      if(element?.closest("input, textarea, select, button, [contenteditable='true']")) { start=null; return; }
      const touch=event.touches[0];
      start={x:touch.clientX,y:touch.clientY,time:Date.now()};
    };
    const onTouchEnd=(event:TouchEvent)=>{
      if(!start||event.changedTouches.length!==1) { start=null; return; }
      const touch=event.changedTouches[0];
      const dx=touch.clientX-start.x;
      const dy=touch.clientY-start.y;
      const elapsed=Date.now()-start.time;
      start=null;
      if(!system.cameraState.current.introComplete||system.cameraState.current.isTransitioning) return;
      const isTap=elapsed<=500&&Math.abs(dx)<12&&Math.abs(dy)<12;
      if(isTap) {
        const target=getAdjacentShot(system.selectedTarget,1);
        if(target) navigateTo(target);
        return;
      }
    };
    const cancel=()=>{start=null;};
    window.addEventListener("touchstart",onTouchStart,{passive:true});
    window.addEventListener("touchend",onTouchEnd,{passive:true});
    window.addEventListener("touchcancel",cancel,{passive:true});
    return()=>{
      window.removeEventListener("touchstart",onTouchStart);
      window.removeEventListener("touchend",onTouchEnd);
      window.removeEventListener("touchcancel",cancel);
    };
  },[system,navigateTo]);
}

export function useCameraPinchNavigation(system:{cameraState:React.MutableRefObject<{introComplete:boolean;isTransitioning:boolean}>},goToWorkspace:()=>void) {
  useEffect(()=>{
    let triggered=false;
    let trackpadDelta=0;
    let trackpadReset=0;
    const onWheel=(event:WheelEvent)=>{
      if(!event.ctrlKey) return;
      event.preventDefault();
      window.clearTimeout(trackpadReset);
      trackpadReset=window.setTimeout(()=>{trackpadDelta=0;triggered=false;},180);
      if(triggered||event.deltaY>=0) return;
      trackpadDelta+=-event.deltaY;
      if(!isTrackpadPinchOut(trackpadDelta)) return;
      if(!system.cameraState.current.introComplete) return;
      triggered=true;
      goToWorkspace();
    };
    window.addEventListener("wheel",onWheel,{passive:false});
    return()=>{
      window.removeEventListener("wheel",onWheel);
      window.clearTimeout(trackpadReset);
    };
  },[system,goToWorkspace]);
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useCinematicShots(initialTarget:ShotId=INTRO_DESTINATION, directEntry=false) {
  const reducedMotion = usePrefersReducedMotion();
  const [introVersion, setIntroVersion] = useState(0);
  const [skipVersion, setSkipVersion] = useState(0);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const initialRequested=directEntry?initialTarget:INTRO_DESTINATION;
  const [requestedTarget, setRequestedTarget] = useState<CameraTargetId>(initialRequested);
  const initialCurrent=(directEntry?initialTarget:"opening") as ShotId;
  const stateRef = useRef({ currentShot:initialCurrent, requestedShot:initialRequested, transitioning:false, introCompleted:directEntry, introActive:!directEntry, lastVisitedShot:null as ShotId|null, transitionProgress:directEntry?1:0, currentTarget:initialCurrent, requestedTarget:initialRequested, isTransitioning:false, isIntroActive:!directEntry, introComplete:directEntry });
  useEffect(()=>{
    if(requestedTarget!=="opening"&&requestedTarget!=="workspace") {
      window.localStorage.setItem(LAST_SHOT_KEY,requestedTarget);
      stateRef.current.lastVisitedShot=requestedTarget;
    }
  },[requestedTarget]);

  const controls = useControls("Camera System", {
    Navigation: folder({
      selectedTarget: { value:initialRequested, options:Object.keys(SHOT_REGISTRY), onChange:(value:string)=>setRequestedTarget(value as CameraTargetId) },
      replayOpening: button(() => setIntroVersion((v)=>v+1)),
      skipOpening: button(() => setSkipVersion((v)=>v+1)),
      returnToWorkspace: button(() => setWorkspaceVersion((v)=>v+1)),
      pauseTransitions: false,
    }),
    Opening: folder({ openingDuration:{value:13.5,min:8,max:18,step:.1}, openingHold:{value:2.4,min:0,max:5,step:.1}, fadeDuration:{value:3.2,min:.2,max:7,step:.1} }),
    Motion: folder({ transitionSpeed:{value:1,min:.35,max:2,step:.05}, breathingEnabled:true, breathingStrength:{value:1,min:0,max:3,step:.05}, breathingSpeed:{value:1,min:.25,max:2,step:.05}, overshootStrength:{value:.018,min:0,max:.08,step:.002} }),
    Lens: folder({ cameraFov:{value:37,min:24,max:65,step:1}, nearClip:{value:.1,min:.03,max:1,step:.01}, farClip:{value:45,min:15,max:100,step:1} }),
    Debug: folder({ targetHelpers:false }),
  });

  const tuningSchema = useMemo(() => Object.fromEntries(Object.values(CAMERA_TARGETS).map((target) => [target.label, folder({
    [`${target.id}Position`]: { value:{x:target.position[0],y:target.position[1],z:target.position[2]}, step:.01 },
    [`${target.id}LookAt`]: { value:{x:target.lookAt[0],y:target.lookAt[1],z:target.lookAt[2]}, step:.01 },
    [`${target.id}Fov`]: { value:target.fov,min:24,max:65,step:1 },
    [`${target.id}Duration`]: { value:target.duration,min:.3,max:12,step:.1 },
  }, { collapsed:true })])), []);
  const tuning = useControls("Shot Framing", tuningSchema as never) as Record<string, any>;

  const getCurrentShot=()=>stateRef.current.currentTarget;
  const getPreviousShot=()=>getAdjacentShot(stateRef.current.currentTarget,-1);
  const getNextShot=()=>getAdjacentShot(stateRef.current.currentTarget,1);
  const resumeLastVisitedShot=()=>{
    const saved=window.localStorage.getItem(LAST_SHOT_KEY) as ShotId|null;
    if(saved&&SHOT_REGISTRY[saved]) setRequestedTarget(saved);
    return saved&&SHOT_REGISTRY[saved]?saved:null;
  };

  return {
    ...controls,
    selectedTarget: requestedTarget,
    selectedShot:requestedTarget,
    navigateTo: setRequestedTarget,
    requestedShot:requestedTarget,
    goToShot:setRequestedTarget,
    getCurrentShot,getPreviousShot,getNextShot,resumeLastVisitedShot,
    replayIntro: () => setIntroVersion((v)=>v+1),
    skipIntro: () => setSkipVersion((v)=>v+1),
    cameraState: stateRef,
    introVersion, skipVersion, workspaceVersion, reducedMotion,
    directEntry,
    tuning,
  };
}

/** @deprecated Use useCinematicShots. */
export const useCinematicCamera=useCinematicShots;
