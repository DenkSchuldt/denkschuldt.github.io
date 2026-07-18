import type { ShotFocus, ShotFraming, ShotFramingOverride, ShotId, ShotTransition, ShotViewport } from "./shotTypes.ts";

export type SceneId="opening"|"about"|"certificates"|"projects"|"wall"|"phone"|"poems"|"drawer";
export type FocusCollectionId="certificates"|"projects"|"wall"|"phone"|"poems";
export type FocusDirection="left"|"right"|"up"|"down";

export interface SceneDefinition {
  id:SceneId;
  label:string;
  route:string|null;
  subject:string;
  cameraTarget:ShotId;
  framing:ShotFraming;
  cameraFocus:ShotFocus;
  transition:ShotTransition;
  responsive?:Partial<Record<ShotViewport,ShotFramingOverride>>;
  focusCollection?:FocusCollectionId;
  autoAdvance?:{to:SceneId;delay:number};
}

export interface FocusItemDefinition {
  id:string;
  slug:string;
  label:string;
  subject:string;
  route:string;
  cameraTarget:ShotId;
  framing:ShotFraming;
  cameraFocus:ShotFocus;
  transition:ShotTransition;
  neighbors:Partial<Record<FocusDirection,string>>;
  metadata?:Record<string,unknown>;
}

export interface FocusCollectionDefinition {
  id:FocusCollectionId;
  sceneId:SceneId;
  routePattern:string;
  cameraTarget:ShotId;
  defaultFraming:ShotFraming;
  cameraFocus:ShotFocus;
  transition:ShotTransition;
  items:Record<string,FocusItemDefinition>;
  orderedItemIds:string[];
  allowDynamicItems?:boolean;
}

export interface NavigationLocation {
  sceneId:SceneId;
  focusCollectionId:FocusCollectionId|null;
  focusItemId:string|null;
  cameraTarget:ShotId;
}

export interface NavigationSnapshot extends NavigationLocation {
  requestedScene:SceneId;
  requestedFocusCollection:FocusCollectionId|null;
  requestedFocusItem:string|null;
  requestedCameraTarget:ShotId;
  transitionState:"idle"|"transitioning";
  lastVisitedScene:SceneId|null;
  introCompleted:boolean;
  introActive:boolean;
  transitionProgress:number;
  viewport:ShotViewport;
  cameraPosition:[number,number,number];
  cameraLookAt:[number,number,number];
}

export interface CameraNavigationState extends NavigationSnapshot {
  currentShot:ShotId;
  requestedShot:ShotId;
  transitioning:boolean;
  introCompleted:boolean;
  currentTarget:ShotId;
  requestedTarget:ShotId;
  isTransitioning:boolean;
  isIntroActive:boolean;
  introComplete:boolean;
  lastVisitedShot:ShotId|null;
}
