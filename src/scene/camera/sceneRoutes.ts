import { FOCUS_COLLECTIONS, locationForFocus, locationForScene, SCENE_REGISTRY } from "./sceneRegistry.ts";
import { SHOT_REGISTRY } from "./shotRegistry.ts";
import type { FocusCollectionId, NavigationLocation, SceneId } from "./navigationTypes.ts";
import type { ShotId } from "./shotTypes.ts";
import { addBasename, removeBasename } from "@denk/cinematic-navigation/router";

export const SCENE_BASE_PATH=(process.env.NEXT_PUBLIC_BASE_PATH??"").replace(/\/$/,"");
export const withSceneBasePath=(path:string)=>addBasename(path,SCENE_BASE_PATH);
export const withoutSceneBasePath=(path:string)=>removeBasename(path,SCENE_BASE_PATH);

export interface SceneRouteState extends NavigationLocation {path:string;shot:ShotId;target:ShotId;section?:string;slug?:string;directEntry:boolean}

export function pathForScene(sceneId:SceneId){return SCENE_REGISTRY[sceneId].route;}
export function pathForFocus(collectionId:FocusCollectionId,itemId:string){
  const item=FOCUS_COLLECTIONS[collectionId].items[itemId];
  return item?.route??FOCUS_COLLECTIONS[collectionId].routePattern.replace(":slug",itemId);
}

export function pathForShot(id:ShotId,slug?:string){
  const route=SHOT_REGISTRY[id].route;
  if(route===null)return null;
  return route.includes(":slug")?route.replace(":slug",slug??""):route;
}

/** @deprecated Use pathForShot. */
export const pathForCameraTarget=pathForShot;

export function resolveNavigationPath(pathname:string):NavigationLocation {
  const parts=withoutSceneBasePath(pathname).split("/").filter(Boolean);
  if(!parts.length)return locationForScene("opening");
  if(parts[0]==="about")return locationForScene("about");
  if(parts[0]==="projects")return parts[1]?locationForFocus("projects",parts[1])??locationForScene("projects"):locationForScene("projects");
  if(parts[0]==="certificates")return parts[1]?locationForFocus("certificates",parts[1])??{sceneId:"certificates",focusCollectionId:"certificates",focusItemId:parts[1],cameraTarget:"certificate-detail"}:locationForScene("certificates");
  if(parts[0]==="poems")return parts[1]?locationForFocus("poems",parts[1])??{sceneId:"poems",focusCollectionId:"poems",focusItemId:parts[1],cameraTarget:SCENE_REGISTRY.poems.cameraTarget}:locationForScene("poems");
  if(parts[0]==="phone")return parts[1]==="qr"?locationForFocus("phone","qr")??locationForScene("phone"):locationForScene("phone");
  if(parts[0]==="socials")return locationForFocus("phone","socials")??locationForScene("phone");
  if(parts[0]==="wall")return parts[1]?locationForFocus("wall",parts[1])??locationForScene("wall"):locationForScene("wall");
  return locationForScene("opening","workspace");
}

export function shotForRoute(pathname:string):ShotId{return resolveNavigationPath(pathname).cameraTarget;}

export function parseScenePath(pathname:string):SceneRouteState {
  pathname=withoutSceneBasePath(pathname);
  const parts=pathname.split("/").filter(Boolean);
  const location=resolveNavigationPath(pathname);
  return {...location,path:pathname,shot:location.cameraTarget,target:location.cameraTarget,section:parts[0],slug:parts[1],directEntry:pathname!=="/"};
}

export const SCENE_ROUTES=Object.fromEntries(Object.values(SCENE_REGISTRY).filter((scene)=>scene.route!==null).map((scene)=>[scene.subject,{path:scene.route!,target:scene.cameraTarget,shot:scene.cameraTarget,sceneId:scene.id}]));
export const STATIC_FOCUS_ROUTES=Object.values(FOCUS_COLLECTIONS).flatMap((collection)=>Object.values(collection.items).map((item)=>item.route));
