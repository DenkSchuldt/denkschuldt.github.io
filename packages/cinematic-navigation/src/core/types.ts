export type NavigationId=string;
export type FocusDirection="left"|"right"|"up"|"down";
export type TransitionStatus="idle"|"transitioning";
export type TransitionIntent="scene"|"enter-focus"|"move-focus"|"exit-focus"|"route-sync"|"interrupt";

export interface SpatialPosition {x:number;y:number;row?:number;column?:number}

export interface SceneRegistration<TFraming=unknown,TTransition=unknown,TResponsive=unknown> {
  id:NavigationId;
  subjectId:NavigationId;
  cameraTargetId:NavigationId;
  framing:TFraming;
  transition:TTransition;
  responsive?:TResponsive;
  focusCollectionId?:NavigationId;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface FocusItemRegistration<TFraming=unknown,TTransition=unknown> {
  id:NavigationId;
  subjectId:NavigationId;
  cameraTargetId:NavigationId;
  framing:TFraming;
  transition:TTransition;
  neighbors?:Partial<Record<FocusDirection,NavigationId>>;
  spatial?:SpatialPosition;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface FocusCollectionRegistration<TFraming=unknown,TTransition=unknown> {
  id:NavigationId;
  sceneId:NavigationId;
  cameraTargetId:NavigationId;
  framing:TFraming;
  transition:TTransition;
  items?:readonly FocusItemRegistration<TFraming,TTransition>[];
  orderedItemIds?:readonly NavigationId[];
  wrap?:boolean;
  allowDynamicItems?:boolean;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface NavigationLocation {
  sceneId:NavigationId;
  focusCollectionId:null|NavigationId;
  focusItemId:null|NavigationId;
  cameraTargetId:NavigationId;
}

export interface EngineState extends NavigationLocation {
  requestedSceneId:NavigationId;
  requestedFocusCollectionId:null|NavigationId;
  requestedFocusItemId:null|NavigationId;
  requestedCameraTargetId:NavigationId;
  previousFocusItemId:null|NavigationId;
  lastVisitedSceneId:null|NavigationId;
  transitionStatus:TransitionStatus;
  transitionIntent:null|TransitionIntent;
  transitionProgress:number;
  responsiveMode:string;
  introActive:boolean;
  introCompleted:boolean;
}

export interface NavigationRequest extends NavigationLocation {
  intent:TransitionIntent;
}

export interface PersistenceAdapter {
  read(key:string):string|null;
  write(key:string,value:string):void;
  remove?(key:string):void;
}

export interface CameraDriver {
  start(request:NavigationRequest):void;
  redirect(request:NavigationRequest):void;
  cancel(reason?:string):void;
  setReducedMotion?(enabled:boolean):void;
}

export interface CinematicEngineConfiguration<TFraming=unknown,TTransition=unknown,TResponsive=unknown> {
  scenes?:readonly SceneRegistration<TFraming,TTransition,TResponsive>[];
  focusCollections?:readonly FocusCollectionRegistration<TFraming,TTransition>[];
  guidedSequence?:readonly NavigationId[];
  guidedWrap?:false|"forward"|"both";
  initialLocation?:NavigationLocation;
  cameraDriver?:CameraDriver;
  persistence?:PersistenceAdapter;
  persistenceKey?:string;
  development?:boolean;
}

export type EngineListener=()=>void;

export interface CinematicEngine<TFraming=unknown,TTransition=unknown,TResponsive=unknown> {
  registerScene(scene:SceneRegistration<TFraming,TTransition,TResponsive>):()=>void;
  unregisterScene(sceneId:NavigationId):void;
  registerFocusCollection(collection:FocusCollectionRegistration<TFraming,TTransition>):()=>void;
  unregisterFocusCollection(collectionId:NavigationId):void;
  registerFocusItem(collectionId:NavigationId,item:FocusItemRegistration<TFraming,TTransition>):()=>void;
  unregisterFocusItem(collectionId:NavigationId,itemId:NavigationId):void;
  goToScene(sceneId:NavigationId,cameraTargetId?:NavigationId):NavigationLocation|null;
  nextScene():NavigationLocation|null;
  previousScene():NavigationLocation|null;
  enterFocus(collectionId:NavigationId,itemId:NavigationId):NavigationLocation|null;
  goToFocus(itemId:NavigationId):NavigationLocation|null;
  moveFocus(direction:FocusDirection|-1|1):NavigationLocation|null;
  exitFocus():NavigationLocation|null;
  syncLocation(location:NavigationLocation):NavigationLocation|null;
  interruptTransition(intent?:TransitionIntent):void;
  updateTransition(progress:number):void;
  completeTransition():void;
  setResponsiveMode(mode:string):void;
  setIntroState(active:boolean,completed:boolean):void;
  restoreLastVisitedScene():NavigationLocation|null;
  getScene(sceneId:NavigationId):SceneRegistration<TFraming,TTransition,TResponsive>|undefined;
  getFocusCollection(collectionId:NavigationId):FocusCollectionRegistration<TFraming,TTransition>|undefined;
  getFocusItem(collectionId:NavigationId,itemId:NavigationId):FocusItemRegistration<TFraming,TTransition>|undefined;
  getState():Readonly<EngineState>;
  subscribe(listener:EngineListener):()=>void;
}
