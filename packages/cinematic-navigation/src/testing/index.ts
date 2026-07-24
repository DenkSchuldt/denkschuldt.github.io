import type { CinematicEngine, EngineState } from "../core/index.js";

export const navigationState=(overrides:Partial<EngineState>={}):EngineState=>({sceneId:"opening",focusCollectionId:null,focusItemId:null,cameraTargetId:"opening",requestedSceneId:"opening",requestedFocusCollectionId:null,requestedFocusItemId:null,requestedCameraTargetId:"opening",previousFocusItemId:null,lastVisitedSceneId:null,visitedSceneIds:["opening"],transitionStatus:"idle",transitionIntent:null,transitionProgress:1,responsiveMode:"desktop",introActive:false,introCompleted:true,...overrides});
export const recordStates=(engine:CinematicEngine)=>{const states:EngineState[]=[{...engine.getState()}];const unsubscribe=engine.subscribe(()=>states.push({...engine.getState()}));return {states,unsubscribe};};
