import type { CameraTarget, CameraTargetId, CameraViewport, ResolvedCameraTarget } from "./cameraTypes";

const quietBreathing = { positionAmplitude: 0.002, rotationAmplitude: 0.00035, speed: 0.3 };

export const CAMERA_TARGETS: Record<CameraTargetId, CameraTarget> = {
  opening: { id:"opening", label:"Opening", position:[-0.72,1.9,4.82], lookAt:[-0.45,1.42,-0.9], fov:42, duration:1, focusDistance:.016, breathing:{...quietBreathing,positionAmplitude:.001}, responsive:{ mobile:{position:[-.25,2.05,5.6],lookAt:[-.35,1.5,-1.1],fov:49} } },
  workspace: { id:"workspace", label:"Workspace", position:[1.25,2.42,4.25], lookAt:[-.15,1.42,-1.35], fov:42, duration:4.8, focusDistance:.02, breathing:quietBreathing, waypoint:[.45,2.3,4.55], responsive:{ mobile:{position:[.4,2.55,5.35],lookAt:[-.1,1.45,-1.35],fov:50} } },
  about: { id:"about", label:"About", position:[-1.8,3,-.772], lookAt:[-2,1.25,-1.022], fov:31, roll:-18, duration:4.3, focusDistance:.013, breathing:{...quietBreathing,positionAmplitude:.001}, waypoint:[-1.6,2.85,.16], responsive:{mobile:{position:[-1.9,3.1,-.592],fov:34}} },
  projects: { id:"projects", label:"Projects", position:[.35,2.06,3.52], lookAt:[-.55,1.76,-1.9], fov:37, duration:4.8, arrivalDelay:.12, focusDistance:.02, breathing:quietBreathing, responsive:{ mobile:{position:[.15,2.25,4.45],lookAt:[-.45,1.72,-1.82],fov:45}, tablet:{position:[.45,2.16,3.9],fov:40} } },
  certificates: { id:"certificates", label:"Certificates", position:[-1.15,2.85,.35], lookAt:[-3.78,2.15,-3.55], fov:39, duration:5, focusDistance:.026, breathing:quietBreathing, waypoint:[-.25,3.05,2.2], responsive:{mobile:{position:[-1.65,3.05,1.35],fov:47}} },
  poems: { id:"poems", label:"Poems", position:[2.1,3.55,.25], lookAt:[1.55,1.26,-.68], fov:34, duration:4.6, focusDistance:.012, breathing:{...quietBreathing,positionAmplitude:.0012}, waypoint:[2.55,3.05,2.15], responsive:{ mobile:{position:[1.78,3.72,.68],lookAt:[1.55,1.26,-.68],fov:42}, tablet:{position:[2,3.62,.48],fov:38} } },
  phone: { id:"phone", label:"Phone", position:[.25,2.78,.72], lookAt:[-.25,1.26,-.73], fov:33, duration:4.2, focusDistance:.011, breathing:{...quietBreathing,positionAmplitude:.0008}, waypoint:[1.05,2.65,2.1], responsive:{mobile:{position:[.1,3.1,1.15],fov:41}} },
  wall: { id:"wall", label:"Wall", position:[4.65,3.05,2.45], lookAt:[2.6,2.85,-3.75], fov:40, duration:5.2, focusDistance:.028, breathing:quietBreathing, waypoint:[3.8,3.1,3.4], responsive:{ mobile:{position:[4.1,3.15,3.3],fov:48} } },
  drawer: { id:"drawer", label:"Drawer", position:[2.85,1.58,1.45], lookAt:[1.55,.72,-1.52], fov:36, duration:4.5, focusDistance:.014, breathing:{positionAmplitude:.0007,rotationAmplitude:.0001,speed:.2}, waypoint:[3.15,1.95,2.4], responsive:{ mobile:{position:[2.55,1.75,2.15],fov:43} } },
};

export function getViewportKind(aspect: number): CameraViewport {
  if (aspect < .82) return "mobile";
  if (aspect < 1.45) return "tablet";
  return "desktop";
}

export function resolveCameraTarget(id: CameraTargetId, aspect: number): ResolvedCameraTarget {
  const target = CAMERA_TARGETS[id];
  if (!target) throw new Error(`Unknown camera target: ${id}`);
  const override = target.responsive?.[getViewportKind(aspect)];
  return { ...target, position:override?.position ?? target.position, lookAt:override?.lookAt ?? target.lookAt, fov:override?.fov ?? target.fov, roll:override?.roll ?? target.roll };
}

export function validateCameraTargets() {
  if (process.env.NODE_ENV === "production") return;
  Object.values(CAMERA_TARGETS).forEach((target) => {
    const validTuple = (value:number[]) => value.length === 3 && value.every(Number.isFinite);
    if (!validTuple(target.position) || !validTuple(target.lookAt)) console.warn(`Malformed camera vectors for ${target.id}`);
    if (!(target.duration > 0)) console.warn(`Invalid camera duration for ${target.id}`);
    const distance = Math.hypot(...target.position.map((v,i)=>v-target.lookAt[i]));
    if (distance < .25) console.warn(`Camera target ${target.id} is too close to its look-at point`);
  });
}
