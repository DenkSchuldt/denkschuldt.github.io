import { SHOT_REGISTRY } from "./shotRegistry.ts";
import type { ShotId } from "./shotTypes";

export const SCENE_BASE_PATH=(process.env.NEXT_PUBLIC_BASE_PATH??"").replace(/\/$/,"");
export const withSceneBasePath=(path:string)=>`${SCENE_BASE_PATH}${path==="/"?"/":path}`;
export function withoutSceneBasePath(path:string){if(!SCENE_BASE_PATH)return path;const stripped=path.startsWith(`${SCENE_BASE_PATH}/`)?path.slice(SCENE_BASE_PATH.length):path;return stripped||"/";}

export interface SceneRouteState { path:string; shot:ShotId; target:ShotId; section?:string; slug?:string; directEntry:boolean }

export function pathForShot(id:ShotId,slug?:string) {
  const route=SHOT_REGISTRY[id].route;
  if(route===null) return null;
  return route.includes(":slug")?route.replace(":slug",slug??""):route;
}

/** @deprecated Use pathForShot. */
export const pathForCameraTarget=pathForShot;

export function shotForRoute(pathname:string):ShotId {
  const parts=withoutSceneBasePath(pathname).split("/").filter(Boolean);
  if(!parts.length) return "opening";
  if(parts[0]==="projects") return parts[1]?"project-detail":"projects";
  if(parts[0]==="certificates") return parts[1]?"certificate-detail":"certificates";
  if(parts[0]==="poems") return parts[1]?"poem-detail":"poems";
  if(parts[0]==="phone") return parts[1]==="qr"?"phone-qr":"phone";
  if(parts[0]==="socials") return "socials";
  if(parts[0]==="wall") return parts[1]?"movie-detail":"wall";
  if(parts[0]==="about") return "about";
  return "workspace";
}

export function parseScenePath(pathname:string):SceneRouteState {
  pathname=withoutSceneBasePath(pathname);
  const parts=pathname.split("/").filter(Boolean);
  const shot=shotForRoute(pathname);
  return {path:pathname,shot,target:shot,section:parts[0],slug:parts[1],directEntry:pathname!=="/"};
}

export const SCENE_ROUTES=Object.fromEntries(Object.values(SHOT_REGISTRY).filter((shot)=>shot.route&&!shot.route.includes(":" )).map((shot)=>[shot.subject,{path:shot.route,target:shot.id,shot:shot.id}]));
