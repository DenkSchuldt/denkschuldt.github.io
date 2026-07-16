"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { applyReducedMotionDuration, cinematicEase, clamp01 } from "./cameraEasing";
import { getViewportKind, resolveCameraTarget, validateCameraTargets } from "./cameraTargets";
import type { CameraTargetId, ResolvedCameraTarget } from "./cameraTypes";

interface Props {
  requestedTarget: CameraTargetId;
  directEntry: boolean;
  introVersion: number;
  skipVersion: number;
  workspaceVersion: number;
  reducedMotion: boolean;
  paused: boolean;
  transitionSpeed: number;
  openingDuration: number;
  openingHold: number;
  breathingEnabled: boolean;
  breathingStrength: number;
  breathingSpeed: number;
  overshootStrength: number;
  nearClip: number;
  farClip: number;
  tuning: Record<string, any>;
  focusRef: React.MutableRefObject<number>;
  stateRef: React.MutableRefObject<{currentShot:CameraTargetId;requestedShot:CameraTargetId;transitioning:boolean;introCompleted:boolean;introActive:boolean;lastVisitedShot:CameraTargetId|null;transitionProgress:number;currentTarget:CameraTargetId;requestedTarget:CameraTargetId;isTransitioning:boolean;isIntroActive:boolean;introComplete:boolean}>;
}

const startPosition = new THREE.Vector3();
const endPosition = new THREE.Vector3();
const waypoint = new THREE.Vector3();
const startLook = new THREE.Vector3();
const endLook = new THREE.Vector3();
const basePosition = new THREE.Vector3();
const baseLook = new THREE.Vector3();
const targetPosition = new THREE.Vector3();
const travelDirection = new THREE.Vector3();

function tuneTarget(target: ResolvedCameraTarget, tuning: Record<string, any>, aspect: number): ResolvedCameraTarget {
  const p=tuning[`${target.id}Position`], l=tuning[`${target.id}LookAt`];
  const useTunedFraming=getViewportKind(aspect)==="desktop";
  return {...target, position:useTunedFraming&&p?[p.x,p.y,p.z]:target.position, lookAt:useTunedFraming&&l?[l.x,l.y,l.z]:target.lookAt, fov:useTunedFraming?(tuning[`${target.id}Fov`]??target.fov):target.fov, duration:tuning[`${target.id}Duration`]??target.duration};
}

export function CameraRig(props: Props) {
  const { camera, size } = useThree();
  const activeId = useRef<CameraTargetId>("opening");
  const requestedId = useRef<CameraTargetId>("projects");
  const transitioning = useRef(false);
  const introActive = useRef(true);
  const introComplete = useRef(false);
  const transitionStart = useRef(0);
  const transitionDuration = useRef(1);
  const startFov = useRef(42);
  const endFov = useRef(42);
  const startRoll = useRef(0);
  const endRoll = useRef(0);
  const baseRoll = useRef(0);
  const startFocus = useRef(.016);
  const endFocus = useRef(.02);
  const activeTarget = useRef<ResolvedCameraTarget>(resolveCameraTarget("opening", size.width/size.height));
  const initialized = useRef(false);
  const lastIntroVersion = useRef(props.introVersion);
  const lastSkipVersion = useRef(props.skipVersion);
  const lastWorkspaceVersion = useRef(props.workspaceVersion);

  useEffect(() => validateCameraTargets(), []);
  useEffect(() => { camera.near=props.nearClip; camera.far=props.farClip; camera.updateProjectionMatrix(); }, [camera,props.nearClip,props.farClip]);

  const beginTransition = (id:CameraTargetId, now:number, durationOverride?:number) => {
    const aspect=size.width/size.height;
    const next=tuneTarget(resolveCameraTarget(id,aspect),props.tuning,aspect);
    startPosition.copy(basePosition); startLook.copy(baseLook);
    endPosition.set(...next.position); endLook.set(...next.lookAt);
    if(next.waypoint) waypoint.set(...next.waypoint); else waypoint.lerpVectors(startPosition,endPosition,.5);
    startFov.current=camera instanceof THREE.PerspectiveCamera?camera.fov:next.fov; endFov.current=next.fov;
    startRoll.current=baseRoll.current;endRoll.current=THREE.MathUtils.degToRad(next.roll??0);
    startFocus.current=props.focusRef.current; endFocus.current=next.focusDistance??props.focusRef.current;
    transitionStart.current=now;
    transitionDuration.current=applyReducedMotionDuration(durationOverride??next.duration/props.transitionSpeed,props.reducedMotion);
    activeTarget.current=next; requestedId.current=id; transitioning.current=true;
  };

  useFrame(({clock}) => {
    const now=clock.elapsedTime;
    if(!initialized.current){
      initialized.current=true;
      const initialId=props.directEntry?props.requestedTarget:"opening";
      const initial=tuneTarget(resolveCameraTarget(initialId,size.width/size.height),props.tuning,size.width/size.height);
      basePosition.set(...initial.position);baseLook.set(...initial.lookAt);activeTarget.current=initial;activeId.current=initialId;requestedId.current=props.requestedTarget;
      introActive.current=!props.directEntry;introComplete.current=props.directEntry;transitioning.current=false;transitionStart.current=now;
      props.focusRef.current=initial.focusDistance??props.focusRef.current;
      baseRoll.current=THREE.MathUtils.degToRad(initial.roll??0);camera.position.copy(basePosition);camera.lookAt(baseLook);camera.rotateZ(baseRoll.current);
      if(camera instanceof THREE.PerspectiveCamera){camera.fov=initial.fov;camera.updateProjectionMatrix();}
    }
    props.stateRef.current.requestedTarget=props.requestedTarget;
    props.stateRef.current.requestedShot=props.requestedTarget;
    props.stateRef.current.isTransitioning=transitioning.current;
    props.stateRef.current.transitioning=transitioning.current;
    props.stateRef.current.isIntroActive=introActive.current;
    props.stateRef.current.introActive=introActive.current;
    props.stateRef.current.introComplete=introComplete.current;
    props.stateRef.current.introCompleted=introComplete.current;
    props.stateRef.current.currentTarget=activeId.current;
    props.stateRef.current.currentShot=activeId.current;
    if(lastIntroVersion.current!==props.introVersion){lastIntroVersion.current=props.introVersion;introActive.current=true;introComplete.current=false;activeId.current="opening";const opening=tuneTarget(resolveCameraTarget("opening",size.width/size.height),props.tuning,size.width/size.height);basePosition.set(...opening.position);baseLook.set(...opening.lookAt);baseRoll.current=THREE.MathUtils.degToRad(opening.roll??0);camera.position.copy(basePosition);camera.lookAt(baseLook);camera.rotateZ(baseRoll.current);transitionStart.current=now;transitioning.current=false;return;}
    if(lastSkipVersion.current!==props.skipVersion){lastSkipVersion.current=props.skipVersion;introActive.current=false;introComplete.current=true;const destination=props.requestedTarget==="opening"?"workspace":props.requestedTarget;beginTransition(destination,now,props.reducedMotion?.18:.4);}
    if(lastWorkspaceVersion.current!==props.workspaceVersion){lastWorkspaceVersion.current=props.workspaceVersion;if(introComplete.current)beginTransition("workspace",now);}

    if(introActive.current){
      const opening=tuneTarget(resolveCameraTarget("opening",size.width/size.height),props.tuning,size.width/size.height);
      if(!basePosition.lengthSq()){basePosition.set(...opening.position);baseLook.set(...opening.lookAt);camera.position.copy(basePosition);camera.lookAt(baseLook);transitionStart.current=now;}
      const elapsed=now-transitionStart.current;
      if(props.reducedMotion){introActive.current=false;introComplete.current=true;beginTransition("projects",now,.18);}
      else if(elapsed>=props.openingHold&&!transitioning.current){beginTransition("projects",now,props.openingDuration-props.openingHold);}
    }

    if(introComplete.current && !transitioning.current && props.requestedTarget!==requestedId.current && !props.paused) beginTransition(props.requestedTarget,now);
    if(props.paused) return;

    if(transitioning.current){
      const raw=clamp01((now-transitionStart.current)/Math.max(.001,transitionDuration.current));
      props.stateRef.current.transitionProgress=raw;
      const t=cinematicEase(raw);
      if(activeTarget.current.waypoint){
        const inv=1-t;
        basePosition.copy(startPosition).multiplyScalar(inv*inv).addScaledVector(waypoint,2*inv*t).addScaledVector(endPosition,t*t);
      }else basePosition.lerpVectors(startPosition,endPosition,t);
      baseLook.lerpVectors(startLook,endLook,t);
      const settle=Math.sin(Math.PI*raw)*Math.pow(raw,5)*props.overshootStrength;
      travelDirection.subVectors(endPosition,startPosition).normalize();
      targetPosition.copy(basePosition).addScaledVector(travelDirection,settle);
      baseRoll.current=THREE.MathUtils.lerp(startRoll.current,endRoll.current,t);camera.position.copy(targetPosition); camera.lookAt(baseLook);camera.rotateZ(baseRoll.current);
      if(camera instanceof THREE.PerspectiveCamera){camera.fov=THREE.MathUtils.lerp(startFov.current,endFov.current,t);camera.updateProjectionMatrix();}
      props.focusRef.current=THREE.MathUtils.lerp(startFocus.current,endFocus.current,t);
      if(raw>=1){transitioning.current=false;activeId.current=activeTarget.current.id;props.stateRef.current.currentShot=activeTarget.current.id;props.stateRef.current.lastVisitedShot=activeTarget.current.id;props.stateRef.current.transitionProgress=1;if(introActive.current){introActive.current=false;introComplete.current=true;requestedId.current="projects";}}
      return;
    }

    const breathing=activeTarget.current.breathing;
    if(!props.breathingEnabled||props.reducedMotion||!breathing){camera.position.copy(basePosition);camera.lookAt(baseLook);camera.rotateZ(baseRoll.current);return;}
    const amplitude=breathing.positionAmplitude*props.breathingStrength;
    const speed=breathing.speed*props.breathingSpeed;
    camera.position.set(basePosition.x+Math.sin(now*speed*.61)*amplitude*.45,basePosition.y+Math.sin(now*speed)*amplitude,basePosition.z+Math.cos(now*speed*.43)*amplitude*.25);
    camera.lookAt(baseLook.x+Math.sin(now*speed*.37)*breathing.rotationAmplitude*props.breathingStrength,baseLook.y+Math.cos(now*speed*.29)*breathing.rotationAmplitude*props.breathingStrength,baseLook.z);camera.rotateZ(baseRoll.current);
  });
  return null;
}
