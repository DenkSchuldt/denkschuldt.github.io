import { getShotViewport, resolveShot, SHOT_REGISTRY, validateShotRegistry } from "./shotRegistry.ts";
import type { CameraTarget, CameraTargetId, ResolvedCameraTarget } from "./cameraTypes";

const flatten=(id:CameraTargetId,aspect=2):ResolvedCameraTarget=>{
  const shot=resolveShot(id,aspect), frame=shot.framing;
  return {id:shot.id,label:shot.label,position:frame.position,lookAt:frame.lookAt,fov:frame.fov,roll:frame.roll,waypoint:frame.waypoint,duration:shot.transition.duration,arrivalDelay:shot.transition.arrivalDelay,focusDistance:shot.focus.focusDistance,breathing:shot.transition.breathing};
};

/** @deprecated The Shot Registry is the source of truth. */
export const CAMERA_TARGETS=Object.fromEntries(Object.keys(SHOT_REGISTRY).map((id)=>[id,flatten(id as CameraTargetId)])) as Record<CameraTargetId,CameraTarget>;
export const getViewportKind=getShotViewport;
export const resolveCameraTarget=flatten;
export const validateCameraTargets=validateShotRegistry;
