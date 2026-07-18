import { GUIDED_SHOT_IDS } from "./shotRegistry.ts";
import type { ShotId } from "./shotTypes";

export function getAdjacentShot(current:ShotId,direction:-1|1):ShotId|null {
  if(current==="opening"&&direction>0) return "about";
  if(current==="about"&&direction<0) return "opening";
  if(current==="certificate-detail") return direction>0?"projects":"certificates";
  if(current==="drawer"&&direction>0) return "opening";
  const index=GUIDED_SHOT_IDS.indexOf(current);
  return index<0?null:(GUIDED_SHOT_IDS[index+direction]??null);
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
