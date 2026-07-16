"use client";

import { button, folder, useControls } from "leva";
import { useEffect, useMemo, useRef, useState } from "react";
import { CAMERA_TARGETS } from "./cameraTargets";
import type { CameraTargetId } from "./cameraTypes";

const KEYBOARD_TARGETS: CameraTargetId[] = ["projects", "about", "certificates", "wall", "phone", "poems", "drawer"];

export function useCameraKeyboardNavigation(system: { selectedTarget:CameraTargetId; cameraState:React.MutableRefObject<{introComplete:boolean}> }, navigateTo:(target:CameraTargetId)=>void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!system.cameraState.current.introComplete || event.metaKey || event.ctrlKey || event.altKey) return;
      const element = event.target as HTMLElement | null;
      if (element?.matches("input, textarea, select, [contenteditable='true']")) return;
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      if(system.selectedTarget==="projects"&&direction<0) {
        navigateTo("opening");
        return;
      }
      const current = KEYBOARD_TARGETS.indexOf(system.selectedTarget);
      if(current<0) return;
      const next=current+direction;
      if(next<0||next>=KEYBOARD_TARGETS.length) return;
      navigateTo(KEYBOARD_TARGETS[next]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [system,navigateTo]);
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

export function useCinematicCamera(initialTarget:CameraTargetId="projects", directEntry=false) {
  const reducedMotion = usePrefersReducedMotion();
  const [introVersion, setIntroVersion] = useState(0);
  const [skipVersion, setSkipVersion] = useState(0);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [requestedTarget, setRequestedTarget] = useState<CameraTargetId>(initialTarget);
  const stateRef = useRef({ currentTarget:(directEntry?initialTarget:"opening") as CameraTargetId, requestedTarget:initialTarget, isTransitioning:false, isIntroActive:!directEntry, introComplete:directEntry, transitionProgress:directEntry?1:0 });

  const controls = useControls("Camera System", {
    Navigation: folder({
      selectedTarget: { value:initialTarget, options:["opening","workspace","about","projects","certificates","poems","phone","wall","drawer"], onChange:(value:string)=>setRequestedTarget(value as CameraTargetId) },
      replayOpening: button(() => setIntroVersion((v)=>v+1)),
      skipOpening: button(() => setSkipVersion((v)=>v+1)),
      returnToWorkspace: button(() => setWorkspaceVersion((v)=>v+1)),
      pauseTransitions: false,
    }),
    Opening: folder({ openingDuration:{value:7.1,min:5.5,max:10,step:.1}, openingHold:{value:.9,min:0,max:3,step:.1}, fadeDuration:{value:2.8,min:.2,max:6,step:.1} }),
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
  const tuning = useControls("Camera Targets", tuningSchema as never) as Record<string, any>;

  return {
    ...controls,
    selectedTarget: requestedTarget,
    navigateTo: setRequestedTarget,
    replayIntro: () => setIntroVersion((v)=>v+1),
    skipIntro: () => setSkipVersion((v)=>v+1),
    cameraState: stateRef,
    introVersion, skipVersion, workspaceVersion, reducedMotion,
    directEntry,
    tuning,
  };
}
