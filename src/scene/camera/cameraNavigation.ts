import { GUIDED_SHOT_IDS } from "./shotRegistry.ts";
import type { ShotId } from "./shotTypes";

export function getAdjacentShot(current:ShotId,direction:-1|1):ShotId|null {
  if(current==="projects"&&direction<0) return "opening";
  const index=GUIDED_SHOT_IDS.indexOf(current);
  return index<0?null:(GUIDED_SHOT_IDS[index+direction]??null);
}

/** @deprecated Use getAdjacentShot. */
export const getAdjacentCameraTarget=getAdjacentShot;
