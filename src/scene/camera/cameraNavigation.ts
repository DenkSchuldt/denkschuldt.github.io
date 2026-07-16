import type { CameraTargetId } from "./cameraTypes";

const NAVIGATION_TARGETS: CameraTargetId[] = ["projects", "about", "certificates", "wall", "phone", "poems", "drawer"];

export function getAdjacentCameraTarget(currentTarget:CameraTargetId, direction:-1|1):CameraTargetId|null {
  if(currentTarget==="projects"&&direction<0) return "opening";
  const current=NAVIGATION_TARGETS.indexOf(currentTarget);
  if(current<0) return null;
  return NAVIGATION_TARGETS[current+direction]??null;
}
