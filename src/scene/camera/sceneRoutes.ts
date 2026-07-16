import type { CameraTargetId } from "./cameraTypes";

export const SCENE_ROUTES = {
  paper: { path:"/about", target:"about" },
  laptop: { path:"/projects", target:"projects" },
  shelf: { path:"/certificates", target:"certificates" },
  folder: { path:"/poems", target:"poems" },
  phone: { path:"/phone", target:"phone" },
  wall: { path:"/wall", target:"wall" },
  drawer: { path:"/drawer", target:"drawer" },
} as const satisfies Record<string,{path:string;target:CameraTargetId}>;

export type SceneSection = keyof typeof SCENE_ROUTES;

const TARGET_PATHS: Partial<Record<CameraTargetId,string>> = Object.fromEntries(
  Object.values(SCENE_ROUTES).map(({ target, path }) => [target, path]),
);

export function pathForCameraTarget(target:CameraTargetId) {
  if (target === "opening" || target === "workspace") return "/";
  return TARGET_PATHS[target] ?? `/${target}`;
}

export interface SceneRouteState { path:string; target:CameraTargetId; section?:string; slug?:string; directEntry:boolean }

export function parseScenePath(pathname:string):SceneRouteState {
  const parts=pathname.split("/").filter(Boolean);
  if(!parts.length) return {path:"/",target:"projects",directEntry:false};
  const base=`/${parts[0]}`;
  const route=Object.values(SCENE_ROUTES).find((candidate)=>candidate.path===base);
  return {path:pathname,target:route?.target??"workspace",section:parts[0],slug:parts[1],directEntry:true};
}
