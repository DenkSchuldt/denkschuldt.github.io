import { getAdjacentFocus, getAdjacentScene, getFocusNeighbor, SCENE_REGISTRY, sceneForCameraTarget } from "./sceneRegistry.ts";
import type { FocusDirection } from "./navigationTypes.ts";
import type { ShotId } from "./shotTypes";

export function getAdjacentShot(current:ShotId,direction:-1|1):ShotId|null {
  if(current==="certificate-detail") return direction>0?"projects":"certificates";
  if(current==="workspace"||current==="project-detail"||current==="poem-detail"||current==="phone-qr"||current==="socials"||current==="movie-detail")return null;
  const scene=getAdjacentScene(sceneForCameraTarget(current),direction);
  return scene?SCENE_REGISTRY[scene].cameraTarget:null;
}

/** @deprecated Use getAdjacentShot. */
export const getAdjacentCameraTarget=getAdjacentShot;

export const isTrackpadPinchOut=(accumulatedDelta:number)=>accumulatedDelta>=48;
export const shouldBeginShotTransition=(introCompleted:boolean,paused:boolean,requested:ShotId,activeRequest:ShotId)=>introCompleted&&!paused&&requested!==activeRequest;
export const shouldSyncRouteShot=(path:string,directEntry:boolean)=>path!=="/"||directEntry;
export const isOpeningAboutJourney=(from:ShotId,to:ShotId)=>(from==="opening"&&to==="about")||(from==="about"&&to==="opening");
export const isDrawerOpeningReturn=(from:ShotId,to:ShotId)=>from==="drawer"&&to==="opening";
export const getShotOvershoot=(shot:ShotId,overshoot:number)=>shot==="about"||shot==="opening"||shot==="certificate-detail"?0:overshoot;
export const getCertificateBrowseOffset=(pointerX:number,pointerY:number,anchorX:number,anchorY:number)=>[(pointerX-anchorX)*1.9,(pointerY-anchorY)*2.1] as const;
export const getFocusDirectionForKey=(key:string):FocusDirection|null=>key==="ArrowLeft"?"left":key==="ArrowRight"?"right":key==="ArrowUp"?"up":key==="ArrowDown"?"down":null;
export { getAdjacentFocus, getFocusNeighbor };
export type { FocusDirection };
