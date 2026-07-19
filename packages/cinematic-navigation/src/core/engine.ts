import { resolveSpatialNeighbor } from "./spatial.js";
import type { CinematicEngine, CinematicEngineConfiguration, EngineState, FocusCollectionRegistration, FocusDirection, FocusItemRegistration, NavigationLocation, NavigationRequest, SceneRegistration, TransitionIntent } from "./types.js";

const clamp=(value:number)=>Math.min(1,Math.max(0,value));

export function createCinematicEngine<TFraming=unknown,TTransition=unknown,TResponsive=unknown>(configuration:CinematicEngineConfiguration<TFraming,TTransition,TResponsive>={}):CinematicEngine<TFraming,TTransition,TResponsive>{
  const scenes=new Map<string,SceneRegistration<TFraming,TTransition,TResponsive>>();
  const collections=new Map<string,FocusCollectionRegistration<TFraming,TTransition>>();
  const items=new Map<string,Map<string,FocusItemRegistration<TFraming,TTransition>>>();
  const listeners=new Set<()=>void>();
  const guided=[...(configuration.guidedSequence??[])];
  const development=configuration.development??true;
  const persistenceKey=configuration.persistenceKey??"cinematic-navigation:last-scene";
  const fail=(message:string)=>{if(development)throw new Error(`[cinematic-navigation] ${message}`);return null;};
  const warn=(message:string)=>{if(development&&typeof console!=="undefined")console.warn(`[cinematic-navigation] ${message}`);};
  const emit=()=>listeners.forEach((listener)=>listener());
  let state:EngineState={sceneId:"",focusCollectionId:null,focusItemId:null,cameraTargetId:"",requestedSceneId:"",requestedFocusCollectionId:null,requestedFocusItemId:null,requestedCameraTargetId:"",previousFocusItemId:null,lastVisitedSceneId:null,visitedSceneIds:[],transitionStatus:"idle",transitionIntent:null,transitionProgress:1,responsiveMode:"desktop",introActive:false,introCompleted:true};

  const registerScene=(scene:SceneRegistration<TFraming,TTransition,TResponsive>)=>{
    if(scenes.has(scene.id))return fail(`Duplicate Scene ID: ${scene.id}`) as never;
    scenes.set(scene.id,scene);return()=>unregisterScene(scene.id);
  };
  const unregisterScene=(sceneId:string)=>{scenes.delete(sceneId);};
  const validateNeighbors=(collectionId:string,item:FocusItemRegistration<TFraming,TTransition>,collectionItems:Map<string,FocusItemRegistration<TFraming,TTransition>>)=>Object.entries(item.neighbors??{}).forEach(([direction,id])=>{if(id&&!collectionItems.has(id))warn(`Invalid ${direction} neighbor '${id}' on Focus Item '${collectionId}/${item.id}'.`);});
  const registerFocusCollection=(collection:FocusCollectionRegistration<TFraming,TTransition>)=>{
    if(collections.has(collection.id))return fail(`Duplicate Focus Collection ID: ${collection.id}`) as never;
    if(!scenes.has(collection.sceneId))return fail(`Missing parent Scene '${collection.sceneId}' for Focus Collection '${collection.id}'.`) as never;
    collections.set(collection.id,collection);const collectionItems=new Map<string,FocusItemRegistration<TFraming,TTransition>>();items.set(collection.id,collectionItems);
    for(const item of collection.items??[]){if(collectionItems.has(item.id))return fail(`Duplicate Focus Item ID: ${collection.id}/${item.id}`) as never;collectionItems.set(item.id,item);}
    collectionItems.forEach((item)=>validateNeighbors(collection.id,item,collectionItems));
    return()=>unregisterFocusCollection(collection.id);
  };
  const unregisterFocusCollection=(collectionId:string)=>{collections.delete(collectionId);items.delete(collectionId);};
  const registerFocusItem=(collectionId:string,item:FocusItemRegistration<TFraming,TTransition>)=>{
    const collection=collections.get(collectionId);if(!collection)return fail(`Cannot register Focus Item without collection '${collectionId}'.`) as never;
    const collectionItems=items.get(collectionId)!;if(collectionItems.has(item.id))return fail(`Duplicate Focus Item ID: ${collectionId}/${item.id}`) as never;
    collectionItems.set(item.id,item);validateNeighbors(collectionId,item,collectionItems);return()=>unregisterFocusItem(collectionId,item.id);
  };
  const unregisterFocusItem=(collectionId:string,itemId:string)=>{items.get(collectionId)?.delete(itemId);};
  const getFocusItem=(collectionId:string,itemId:string)=>{
    const registered=items.get(collectionId)?.get(itemId);if(registered)return registered;
    const collection=collections.get(collectionId);if(!collection?.allowDynamicItems)return undefined;
    return {id:itemId,subjectId:`${collectionId}:${itemId}`,cameraTargetId:collection.cameraTargetId,framing:collection.framing,transition:collection.transition} satisfies FocusItemRegistration<TFraming,TTransition>;
  };
  const resolveFocusLocation=(location:NavigationLocation):NavigationLocation=>{
    const collection=location.focusCollectionId?collections.get(location.focusCollectionId):undefined;
    if(collection?.reframeOnFocus===false){
      const scene=scenes.get(collection.sceneId);
      if(scene)return {...location,cameraTargetId:scene.cameraTargetId};
    }
    return location;
  };
  const request=(location:NavigationLocation,intent:TransitionIntent)=>{
    const resolvedLocation=resolveFocusLocation(location);
    const navigationRequest:NavigationRequest={...resolvedLocation,intent};
    const wasTransitioning=state.transitionStatus==="transitioning";
    const collection=resolvedLocation.focusCollectionId?collections.get(resolvedLocation.focusCollectionId):undefined;
    const cameraIsStable=collection?.reframeOnFocus===false&&state.sceneId===resolvedLocation.sceneId&&state.requestedSceneId===resolvedLocation.sceneId;
    state={...state,requestedSceneId:resolvedLocation.sceneId,requestedFocusCollectionId:resolvedLocation.focusCollectionId,requestedFocusItemId:resolvedLocation.focusItemId,requestedCameraTargetId:resolvedLocation.cameraTargetId,previousFocusItemId:state.requestedFocusItemId,transitionStatus:cameraIsStable?"idle":"transitioning",transitionIntent:cameraIsStable?null:intent,transitionProgress:cameraIsStable?1:0};
    if(resolvedLocation.sceneId!==guided[0]){state={...state,lastVisitedSceneId:resolvedLocation.sceneId};configuration.persistence?.write(persistenceKey,resolvedLocation.sceneId);}
    if(!cameraIsStable){if(wasTransitioning)configuration.cameraDriver?.redirect(navigationRequest);else configuration.cameraDriver?.start(navigationRequest);}
    emit();return resolvedLocation;
  };
  const goToScene=(sceneId:string,cameraTargetId?:string)=>{const scene=scenes.get(sceneId);if(!scene)return fail(`Navigation requested unregistered Scene '${sceneId}'.`);return request({sceneId,focusCollectionId:null,focusItemId:null,cameraTargetId:cameraTargetId??scene.cameraTargetId},"scene");};
  const returnToScene=(sceneId:string,cameraTargetId?:string)=>{const scene=scenes.get(sceneId);if(!scene)return fail(`Return requested unregistered Scene '${sceneId}'.`);return request({sceneId,focusCollectionId:null,focusItemId:null,cameraTargetId:cameraTargetId??scene.cameraTargetId},"return");};
  const adjacentScene=(direction:-1|1)=>{const current=state.requestedSceneId||state.sceneId,index=guided.indexOf(current);if(index<0)return null;const requestedIndex=index+direction;const mayWrap=configuration.guidedWrap==="both"||(configuration.guidedWrap==="forward"&&direction>0);const next=requestedIndex<0||requestedIndex>=guided.length?(mayWrap?guided[(requestedIndex+guided.length)%guided.length]:undefined):guided[requestedIndex];return next?goToScene(next):null;};
  const enterFocus=(collectionId:string,itemId:string)=>{const collection=collections.get(collectionId);if(!collection)return fail(`Focus navigation requested unregistered collection '${collectionId}'.`);const item=getFocusItem(collectionId,itemId);if(!item)return fail(`Focus navigation requested unregistered item '${collectionId}/${itemId}'.`);return request({sceneId:collection.sceneId,focusCollectionId:collectionId,focusItemId:itemId,cameraTargetId:item.cameraTargetId},state.requestedFocusCollectionId===collectionId?"move-focus":"enter-focus");};
  const goToFocus=(itemId:string)=>state.requestedFocusCollectionId?enterFocus(state.requestedFocusCollectionId,itemId):fail("Focus Item navigation requires an active Focus Collection.");
  const moveFocus=(direction:FocusDirection|-1|1)=>{
    const collectionId=state.requestedFocusCollectionId,itemId=state.requestedFocusItemId;if(!collectionId||!itemId)return fail("Focus movement requires an active Focus Item.");
    const collection=collections.get(collectionId)!;const collectionItems=items.get(collectionId)!;
    let next:FocusItemRegistration<TFraming,TTransition>|null|undefined;
    if(typeof direction==="string")next=resolveSpatialNeighbor(collectionItems.values(),itemId,direction);
    else {const order=collection.orderedItemIds??[...collectionItems.keys()],index=order.indexOf(itemId);let nextIndex=index+direction;if(collection.wrap)nextIndex=(nextIndex+order.length)%order.length;next=getFocusItem(collectionId,order[nextIndex]);}
    return next?enterFocus(collectionId,next.id):null;
  };
  const exitFocus=()=>{
    const collection=state.requestedFocusCollectionId?collections.get(state.requestedFocusCollectionId):undefined;
    const startSceneId=collection?.exitBehavior==="start"?guided[0]:undefined;
    const scene=scenes.get(startSceneId??state.requestedSceneId);
    if(!scene)return null;
    const intent=collection?.exitBehavior==="start"?"return":"exit-focus";
    return request({sceneId:scene.id,focusCollectionId:null,focusItemId:null,cameraTargetId:scene.cameraTargetId},intent);
  };
  const syncLocation=(location:NavigationLocation)=>{
    if(!scenes.has(location.sceneId))return fail(`Route resolved unregistered Scene '${location.sceneId}'.`);
    if(location.focusCollectionId&&location.focusItemId&&!getFocusItem(location.focusCollectionId,location.focusItemId))return fail(`Route resolved invalid Focus Item '${location.focusCollectionId}/${location.focusItemId}'.`);
    return request(location,"route-sync");
  };
  const interruptTransition=(intent:TransitionIntent="interrupt")=>{configuration.cameraDriver?.cancel(intent);state={...state,transitionStatus:"idle",transitionIntent:intent,transitionProgress:state.transitionProgress};emit();};
  const updateTransition=(progress:number)=>{state={...state,transitionProgress:clamp(progress)};emit();};
  const completeTransition=()=>{const visitedSceneIds=state.visitedSceneIds.includes(state.requestedSceneId)?state.visitedSceneIds:[...state.visitedSceneIds,state.requestedSceneId];state={...state,sceneId:state.requestedSceneId,focusCollectionId:state.requestedFocusCollectionId,focusItemId:state.requestedFocusItemId,cameraTargetId:state.requestedCameraTargetId,visitedSceneIds,transitionStatus:"idle",transitionIntent:null,transitionProgress:1};emit();};
  const setResponsiveMode=(responsiveMode:string)=>{if(state.responsiveMode!==responsiveMode){state={...state,responsiveMode};emit();}};
  const setIntroState=(introActive:boolean,introCompleted:boolean)=>{if(state.introActive!==introActive||state.introCompleted!==introCompleted){state={...state,introActive,introCompleted};emit();}};
  const restoreLastVisitedScene=()=>{const id=configuration.persistence?.read(persistenceKey);return id&&scenes.has(id)?goToScene(id):null;};

  for(const scene of configuration.scenes??[])registerScene(scene);
  for(const collection of configuration.focusCollections??[])registerFocusCollection(collection);
  const initialCandidate=configuration.initialLocation??(guided[0]&&scenes.get(guided[0])?{sceneId:guided[0],focusCollectionId:null,focusItemId:null,cameraTargetId:scenes.get(guided[0])!.cameraTargetId}:undefined);
  const initial=initialCandidate?resolveFocusLocation(initialCandidate):undefined;
  if(initial)state={...state,...initial,requestedSceneId:initial.sceneId,requestedFocusCollectionId:initial.focusCollectionId,requestedFocusItemId:initial.focusItemId,requestedCameraTargetId:initial.cameraTargetId,visitedSceneIds:[initial.sceneId]};

  const resolveSceneTransition=(sceneId:string)=>{const scene=scenes.get(sceneId);if(!scene)return undefined;const revisit=state.visitedSceneIds.includes(sceneId);const departure=scenes.get(state.sceneId);if(state.transitionIntent==="return"&&departure?.returnTransition!==undefined)return {sceneId,transition:departure.returnTransition,revisit,variant:"return" as const};if(revisit&&scene.revisitTransition!==undefined)return {sceneId,transition:scene.revisitTransition,revisit,variant:"revisit" as const};return {sceneId,transition:scene.transition,revisit,variant:"base" as const};};

  return {registerScene,unregisterScene,registerFocusCollection,unregisterFocusCollection,registerFocusItem,unregisterFocusItem,goToScene,returnToScene,nextScene:()=>adjacentScene(1),previousScene:()=>adjacentScene(-1),enterFocus,goToFocus,moveFocus,exitFocus,syncLocation,interruptTransition,updateTransition,completeTransition,setResponsiveMode,setIntroState,restoreLastVisitedScene,getScene:(id)=>scenes.get(id),resolveSceneTransition,getFocusCollection:(id)=>collections.get(id),getFocusItem,getState:()=>state,subscribe:(listener)=>{listeners.add(listener);return()=>listeners.delete(listener);}};
}
