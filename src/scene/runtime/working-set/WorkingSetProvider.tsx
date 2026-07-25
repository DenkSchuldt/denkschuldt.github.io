"use client";

import { createContext,useContext,useEffect,useMemo,useSyncExternalStore,type PropsWithChildren } from "react";
import type { CinematicEngine } from "@denk/cinematic-navigation";
import type { QualityProfileId } from "../../rendering/quality";
import type { SceneId } from "../../camera/navigationTypes";
import { WORKING_SET_DEFINITIONS,WORKING_SET_DESTINATIONS } from "./definitions";
import { createResolverState,isResourceResidentState,resolveWorkingSet,type ResolverState } from "./resolver";
import type { ReleaseEvidence,ResidentResourceState,WorkingSetEvent,WorkingSetNavigationIntent,WorkingSetSnapshot } from "./types";

const MAX_EVENTS=160;
class WorkingSetStore {
  private listeners=new Set<()=>void>();
  private resolver:ResolverState=createResolverState();
  private profileId:QualityProfileId="ultra";
  private resources:Record<string,ResidentResourceState>={};
  private events:WorkingSetEvent[]=[];
  private timer:number|null=null;
  private taskCount:number|null=null;
  private raycastCount:number|null=null;
  private diagnostics={force:null as string|null,retentionDisabled:false,showResourceIds:false,logEvents:false,simulatedFailure:null as string|null};
  private diagnosticsConfigured=false;
  private snapshot=this.buildSnapshot();
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>this.listeners.delete(listener);};
  getSnapshot=()=>this.snapshot;
  private buildSnapshot():WorkingSetSnapshot {
    const current=this.resolver.lastIntent?.current??"opening";
    const requested=this.resolver.lastIntent?.requested??current;
    return {
      profileId:this.profileId,activeDestination:current,approachingDestination:requested!==current?requested:null,
      destinations:this.resolver.destinations,resources:this.resources,events:this.events,
      estimatedDecodedTextureBytes:Object.values(this.resources).filter((resource)=>resource.status!=="released").reduce((sum,resource)=>sum+(resource.estimatedDecodedBytes??0),0),
      pendingReleases:Object.values(this.resolver.destinations).filter(({releaseAt})=>releaseAt!==null).length,
      activeRuntimeTasks:this.taskCount,raycastCandidates:this.raycastCount,
      diagnostics:this.diagnostics,
    };
  }
  private commit(){this.snapshot=this.buildSnapshot();this.listeners.forEach((listener)=>listener());}
  private log(event:WorkingSetEvent){this.events=[...this.events,event].slice(-MAX_EVENTS);if(this.diagnostics.logEvents)console.info("[working-set]",event);}
  configureDiagnostics(search:string){
    if(process.env.NODE_ENV==="production"||this.diagnosticsConfigured)return;
    this.diagnosticsConfigured=true;
    const params=new URLSearchParams(search);
    this.diagnostics={
      force:params.get("wsForce"),retentionDisabled:params.get("wsRetention")==="0",
      showResourceIds:params.get("wsShowIds")==="1",logEvents:params.get("wsLog")==="1",
      simulatedFailure:params.get("wsFail"),
    };
  }
  update(intent:WorkingSetNavigationIntent,profileId:QualityProfileId,now=Date.now()){
    const previous=this.resolver.destinations;
    this.profileId=profileId;
    this.resolver=resolveWorkingSet(this.resolver,intent,profileId,now);
    if(this.diagnostics.retentionDisabled){
      for(const destination of WORKING_SET_DESTINATIONS){
        const candidate=this.resolver.destinations[destination];
        if(candidate.state==="sleeping"&&candidate.reason!=="shared-session-retention")this.resolver.destinations[destination]={...candidate,state:"releasing",releaseAt:now,reason:"diagnostic-retention-disabled"};
      }
    }
    if(this.diagnostics.force){
      const [destination,state]=this.diagnostics.force.split(":");
      if(WORKING_SET_DESTINATIONS.includes(destination as SceneId)&&["absent","ambient","preparing","active","sleeping","releasing","error"].includes(state)){
        const current=this.resolver.destinations[destination as SceneId];
        this.resolver.destinations[destination as SceneId]={...current,state:state as typeof current.state,reason:"diagnostic-force"};
      }
    }
    for(const destination of WORKING_SET_DESTINATIONS){
      const before=previous[destination],after=this.resolver.destinations[destination];
      if(before.state!==after.state){
        this.log({at:now,type:"state",resourceId:`destination:${destination}`,detail:`${before.state} -> ${after.state} (${after.reason})`});
        if(after.state==="sleeping"){
          for(const resource of Object.values(this.resources))if(resource.destination===destination&&resource.status==="resident")this.resources={...this.resources,[resource.id]:{...resource,status:"sleeping"}};
        }else if(after.state==="active"){
          for(const resource of Object.values(this.resources))if(resource.destination===destination&&resource.status==="sleeping")this.resources={...this.resources,[resource.id]:{...resource,status:"resident"}};
        }
      }
    }
    this.schedule();
    this.commit();
  }
  private schedule(){
    if(this.timer!==null){window.clearTimeout(this.timer);this.timer=null;}
    const releases=Object.values(this.resolver.destinations).map(({releaseAt})=>releaseAt).filter((value):value is number=>value!==null);
    if(!releases.length||!this.resolver.lastIntent?.visible)return;
    const delay=Math.max(0,Math.min(...releases)-Date.now());
    this.timer=window.setTimeout(()=>{
      if(!this.resolver.lastIntent)return;
      this.update(this.resolver.lastIntent,this.profileId,Date.now());
      this.timer=window.setTimeout(()=>{
        if(!this.resolver.lastIntent)return;
        this.update(this.resolver.lastIntent,this.profileId,Date.now());
      },0);
    },delay);
  }
  resourceEvent(type:WorkingSetEvent["type"],resourceId:string,options:{status?:ResidentResourceState["status"];cache?:ResidentResourceState["cache"];estimatedDecodedBytes?:number|null;detail?:string;evidence?:readonly ReleaseEvidence[]}={}){
    const definition=WORKING_SET_DESTINATIONS.flatMap((destination)=>WORKING_SET_DEFINITIONS[destination].resources).find(({id})=>id===resourceId);
    if(definition&&options.status)this.resources={...this.resources,[resourceId]:{
      id:resourceId,destination:definition.destination,status:options.status,cache:options.cache??"owned",
      estimatedDecodedBytes:options.estimatedDecodedBytes??definition.estimatedDecodedBytes??null,evidence:options.evidence??[],
    }};
    this.log({at:Date.now(),type,resourceId,detail:options.detail,evidence:options.evidence});
    this.commit();
  }
  setRuntimeMetrics(taskCount:number|null,raycastCount:number|null){if(this.taskCount===taskCount&&this.raycastCount===raycastCount)return;this.taskCount=taskCount;this.raycastCount=raycastCount;this.commit();}
  clearOwned(){
    for(const destination of WORKING_SET_DESTINATIONS){
      const state=this.resolver.destinations[destination];
      if(state.state==="active"||state.state==="preparing")continue;
      this.resolver.destinations[destination]={...state,state:"releasing",releaseAt:Date.now(),reason:"diagnostic-owned-clear"};
    }
    this.log({at:Date.now(),type:"release",resourceId:"owned-boundaries",detail:"eligible sleeping boundaries moved to releasing; each owner must report its own dispose evidence"});
    this.commit();
  }
  dispose(){if(this.timer!==null)window.clearTimeout(this.timer);this.listeners.clear();}
}

const WorkingSetContext=createContext<WorkingSetStore|null>(null);
export function WorkingSetProvider({children}:PropsWithChildren){
  const store=useMemo(()=>new WorkingSetStore(),[]);
  useEffect(()=>()=>store.dispose(),[store]);
  return <WorkingSetContext.Provider value={store}>{children}</WorkingSetContext.Provider>;
}
export function useWorkingSetStore(){const store=useContext(WorkingSetContext);if(!store)throw new Error("useWorkingSetStore must be used inside WorkingSetProvider.");return store;}
export function useWorkingSet<T>(selector:(snapshot:WorkingSetSnapshot)=>T){const store=useWorkingSetStore();return useSyncExternalStore(store.subscribe,()=>selector(store.getSnapshot()),()=>selector(store.getSnapshot()));}
export const useDestinationWorkingSet=(destination:SceneId)=>useWorkingSet((snapshot)=>snapshot.destinations[destination]);
export const useDestinationResources=(destination:SceneId)=>useWorkingSet((snapshot)=>isResourceResidentState(snapshot.destinations[destination].state));

export function WorkingSetNavigationAdapter({engine,profileId,overlayResourceIds=[]}:{engine:CinematicEngine;profileId:QualityProfileId;overlayResourceIds?:readonly string[]}){
  const store=useWorkingSetStore();
  useEffect(()=>{
    store.configureDiagnostics(window.location.search);
    const update=()=>{
      const state=engine.getState();
      const intent:WorkingSetNavigationIntent={
        current:(state.sceneId||state.requestedSceneId||"opening") as SceneId,
        requested:(state.requestedSceneId||state.sceneId||"opening") as SceneId,
        transitioning:state.transitionStatus==="transitioning",
        overlayResourceIds,focusedResourceIds:state.requestedFocusItemId?[state.requestedFocusItemId]:[],
        visible:document.visibilityState!=="hidden",
      };
      store.update(intent,profileId);
    };
    update();
    const failure=store.getSnapshot().diagnostics.simulatedFailure;
    if(failure)store.resourceEvent("error",failure,{status:"error",cache:"owned",detail:"simulated diagnostic failure"});
    const unsubscribe=engine.subscribe(update);
    const visibility=()=>update();
    document.addEventListener("visibilitychange",visibility);
    return()=>{unsubscribe();document.removeEventListener("visibilitychange",visibility);};
  },[engine,overlayResourceIds,profileId,store]);
  return null;
}
