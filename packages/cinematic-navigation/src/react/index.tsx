"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useSyncExternalStore, type PropsWithChildren, type ReactNode } from "react";
import { createCinematicRuntime, type CinematicEngine, type CinematicRuntime, type EngineState, type FocusCollectionRegistration, type FocusItemRegistration, type RuntimeNodeRegistration, type RuntimeNodeState, type RuntimeSnapshot, type RuntimeTaskRegistration, type SceneRegistration } from "../core/index.js";

const EngineContext=createContext<CinematicEngine|undefined>(undefined);
const RuntimeContext=createContext<CinematicRuntime|undefined>(undefined);
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

/** Creates the lifecycle controller that consumes, but never replaces, navigation state. */
export function useCinematicRuntimeController(engine:CinematicEngine){
  const runtime=useMemo(()=>createCinematicRuntime(engine),[engine]);
  useEffect(()=>()=>runtime.dispose(),[runtime]);
  return runtime;
}
export function CinematicRuntimeProvider({runtime,children}:PropsWithChildren<{runtime:CinematicRuntime}>){return createElement(RuntimeContext.Provider,{value:runtime},children);}
export function useCinematicRuntime(){const runtime=useContext(RuntimeContext);if(!runtime)throw new Error("useCinematicRuntime must be used inside CinematicRuntimeProvider.");return runtime;}
export function useRuntimeSnapshot<T=RuntimeSnapshot>(selector:(snapshot:RuntimeSnapshot)=>T=(snapshot)=>snapshot as T){
  const runtime=useCinematicRuntime();
  return useSyncExternalStore(runtime.subscribe,()=>selector(runtime.getSnapshot()),()=>selector(runtime.getSnapshot()));
}
export function useRuntimeNode(node:RuntimeNodeRegistration):RuntimeNodeState|undefined {
  const runtime=useCinematicRuntime();
  useEffect(()=>runtime.registerNode(node),[runtime,node]);
  return useRuntimeSnapshot((snapshot)=>snapshot.nodes.find((candidate)=>candidate.id===node.id));
}
export function useRuntimeNodes(nodes:readonly RuntimeNodeRegistration[]){
  const runtime=useCinematicRuntime();
  useEffect(()=>{
    const cleanups=nodes.map((node)=>runtime.registerNode(node));
    return()=>cleanups.forEach((cleanup)=>cleanup());
  },[runtime,nodes]);
}
export function useRuntimeTask(task:RuntimeTaskRegistration){
  const runtime=useCinematicRuntime();
  useEffect(()=>runtime.registerTask(task),[runtime,task]);
}

export function RuntimeBoundary({node,children}:{node:RuntimeNodeRegistration;children:ReactNode}){
  const state=useRuntimeNode(node);
  return state?.mounted===false?null:children;
}

export interface RuntimeInspectorMetrics {
  drawCalls?:number;
  raycastParticipants?:number;
  shadowCasters?:number;
  gpuResources?:number;
}

export function RuntimeInspector({visible=false,metrics}:{visible?:boolean;metrics?:RuntimeInspectorMetrics}){
  const runtime=useCinematicRuntime();
  const snapshot=useRuntimeSnapshot();
  if(!visible||process.env.NODE_ENV==="production")return null;
  const groups=(phase:string)=>snapshot.nodes.filter((node)=>node.phase===phase).map((node)=>node.id);
  const line=(label:string,value:unknown)=><div key={label}><strong>{label}</strong>: {String(value??"n/a")}</div>;
  return <aside aria-label="Runtime lifecycle inspector" style={{position:"fixed",zIndex:40,right:16,bottom:16,maxWidth:360,maxHeight:"70vh",overflow:"auto",padding:"12px 14px",border:"1px solid rgba(238,233,223,.18)",borderRadius:10,background:"rgba(12,12,12,.84)",backdropFilter:"blur(14px)",color:"rgba(244,239,229,.82)",font:"11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace",pointerEvents:"none"}}>
    {line("Scene",snapshot.currentSceneId??"—")}
    {line("Destination",snapshot.requestedSceneId!==snapshot.currentSceneId?snapshot.requestedSceneId??"—":"—")}
    {line("Collection",snapshot.activeCollectionId??"—")}
    {line("Focus",snapshot.focusedItemId??"—")}
    {line("Preparing",groups("preparing").join(", ")||"—")}
    {line("Transitioning",snapshot.nodes.filter((node)=>node.phase==="transitioning-in"||node.phase==="transitioning-out"||node.phase==="exiting").map((node)=>node.id).join(", ")||"—")}
    {line("Active",groups("active").concat(groups("focused")).join(", ")||"—")}
    {line("Sleeping",groups("sleeping").join(", ")||"—")}
    {line("Mounted scenes",snapshot.nodes.filter((node)=>node.scope==="scene"&&node.mounted).map((node)=>node.id).join(", ")||"—")}
    {line("Mounted collections",snapshot.nodes.filter((node)=>node.scope==="collection"&&node.mounted).map((node)=>node.id).join(", ")||"—")}
    {line("Mounted",snapshot.nodes.filter((node)=>node.mounted).map((node)=>node.id).join(", ")||"—")}
    {line("Disposed",groups("disposed").join(", ")||"—")}
    {line("Active tasks",runtime.getScheduler().getActiveTaskCount())}
    {line("Draw calls",metrics?.drawCalls)}
    {line("Raycast participants",metrics?.raycastParticipants)}
    {line("Shadow casters",metrics?.shadowCasters)}
    {line("GPU resources",metrics?.gpuResources)}
  </aside>;
}
