"use client";

import { createContext, createElement, useContext, useEffect, useSyncExternalStore, type PropsWithChildren } from "react";
import type { CinematicEngine, EngineState, FocusCollectionRegistration, FocusItemRegistration, SceneRegistration } from "../core/index.js";

const EngineContext=createContext<CinematicEngine|undefined>(undefined);
const serverSnapshot:EngineState={sceneId:"",focusCollectionId:null,focusItemId:null,cameraTargetId:"",requestedSceneId:"",requestedFocusCollectionId:null,requestedFocusItemId:null,requestedCameraTargetId:"",previousFocusItemId:null,lastVisitedSceneId:null,visitedSceneIds:[],transitionStatus:"idle",transitionIntent:null,transitionProgress:1,responsiveMode:"desktop",introActive:false,introCompleted:true};

export function CinematicEngineProvider({engine,children}:PropsWithChildren<{engine:CinematicEngine}>){return createElement(EngineContext.Provider,{value:engine},children);}
export function useCinematicEngine(){const engine=useContext(EngineContext);if(!engine)throw new Error("useCinematicEngine must be used inside CinematicEngineProvider.");return engine;}
export function useCinematicState<T=EngineState>(selector:(state:Readonly<EngineState>)=>T=(state)=>state as T){
  const engine=useCinematicEngine();
  return useSyncExternalStore(engine.subscribe,()=>selector(engine.getState()),()=>selector(serverSnapshot));
}
export const useCurrentScene=()=>useCinematicState((state)=>state.requestedSceneId);
export const useCurrentFocus=()=>useCinematicState((state)=>({collectionId:state.requestedFocusCollectionId,itemId:state.requestedFocusItemId}));

export function useSceneRegistration(scene:SceneRegistration){const engine=useCinematicEngine();useEffect(()=>engine.registerScene(scene),[engine,scene]);}
export function useFocusCollectionRegistration(collection:FocusCollectionRegistration){const engine=useCinematicEngine();useEffect(()=>engine.registerFocusCollection(collection),[engine,collection]);}
export function useFocusItemRegistration(collectionId:string,item:FocusItemRegistration){const engine=useCinematicEngine();useEffect(()=>engine.registerFocusItem(collectionId,item),[engine,collectionId,item]);}
