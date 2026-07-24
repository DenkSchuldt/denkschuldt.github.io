import type { CinematicEngine, EngineState } from "./types.js";

export type RuntimeScope="world"|"scene"|"collection"|"focus-item";
export type RuntimePhase="preparing"|"transitioning-in"|"active"|"exiting"|"sleeping"|"inactive"|"focused"|"transitioning-out"|"disposed";
export type RuntimeMountPolicy="persistent"|"lazy";

export interface RuntimeNodeRegistration {
  id:string;
  scope:RuntimeScope;
  sceneId?:string;
  collectionId?:string;
  focusItemId?:string;
  /** Persistent nodes never leave the mounted set. Lazy nodes may be disposed while sleeping. */
  mountPolicy?:RuntimeMountPolicy;
  /** Keep a lazy node mounted after it has first become active. */
  retainOnSleep?:boolean;
}

export interface RuntimeNodeState extends RuntimeNodeRegistration {
  phase:RuntimePhase;
  mounted:boolean;
  active:boolean;
  interactive:boolean;
  updates:boolean;
  contributesToRender:boolean;
}

export interface RuntimeSnapshot {
  navigation:Readonly<EngineState>;
  nodes:readonly RuntimeNodeState[];
  currentSceneId:string|null;
  requestedSceneId:string|null;
  activeSceneId:string|null;
  activeCollectionId:string|null;
  focusedItemId:string|null;
  transitioning:boolean;
}

export interface RuntimeTaskContext {
  delta:number;
  elapsed:number;
  runtime:RuntimeSnapshot;
}

export interface RuntimeTaskRegistration {
  id:string;
  nodeId:string;
  priority?:number;
  update(context:RuntimeTaskContext):void;
}

export type RuntimeNodeListener=(next:RuntimeNodeState|undefined,previous:RuntimeNodeState|undefined)=>void;

export interface RuntimeScheduler {
  register(task:RuntimeTaskRegistration):()=>void;
  update(delta:number,elapsed:number):void;
  getActiveTaskCount():number;
}

export interface CinematicRuntime {
  registerNode(node:RuntimeNodeRegistration):()=>void;
  unregisterNode(nodeId:string):void;
  registerTask(task:RuntimeTaskRegistration):()=>void;
  update(delta:number,elapsed:number):void;
  getNodeState(nodeId:string):RuntimeNodeState|undefined;
  subscribeNode(nodeId:string,listener:RuntimeNodeListener):()=>void;
  getSnapshot():RuntimeSnapshot;
  getScheduler():RuntimeScheduler;
  dispose():void;
  subscribe(listener:()=>void):()=>void;
}

function deriveScenePhase(node:RuntimeNodeRegistration,state:EngineState):RuntimePhase {
  if(node.mountPolicy==="lazy"&&state.requestedSceneId!==node.sceneId&&state.sceneId!==node.sceneId)return "disposed";
  if(state.requestedSceneId===node.sceneId&&state.sceneId!==node.sceneId)return state.transitionStatus==="transitioning"?"transitioning-in":"active";
  if(state.sceneId===node.sceneId&&state.requestedSceneId!==node.sceneId)return state.transitionStatus==="transitioning"?"exiting":"sleeping";
  if(state.sceneId===node.sceneId&&state.requestedSceneId===node.sceneId)return "active";
  return node.mountPolicy==="lazy"?"disposed":"sleeping";
}

function deriveCollectionPhase(node:RuntimeNodeRegistration,state:EngineState):RuntimePhase {
  const belongsToScene=node.sceneId===state.requestedSceneId||node.sceneId===state.sceneId;
  if(!belongsToScene)return node.mountPolicy==="lazy"?"disposed":"sleeping";
  if(state.requestedFocusCollectionId===node.collectionId){
    return state.transitionStatus==="transitioning"?"transitioning-in":"active";
  }
  if(state.focusCollectionId===node.collectionId&&state.requestedFocusCollectionId!==node.collectionId)return "exiting";
  return state.requestedSceneId===node.sceneId&&state.transitionStatus==="transitioning"?"transitioning-in":"active";
}

function deriveFocusPhase(node:RuntimeNodeRegistration,state:EngineState):RuntimePhase {
  if(state.requestedFocusCollectionId===node.collectionId&&state.requestedFocusItemId===node.focusItemId){
    return state.transitionStatus==="transitioning"?"transitioning-in":"focused";
  }
  if(state.focusCollectionId===node.collectionId&&state.focusItemId===node.focusItemId)return "transitioning-out";
  return node.mountPolicy==="lazy"?"disposed":"inactive";
}

export function deriveRuntimeNodeState(node:RuntimeNodeRegistration,state:EngineState):RuntimeNodeState {
  let phase:RuntimePhase;
  if(node.scope==="world")phase="active";
  else if(node.scope==="scene")phase=deriveScenePhase(node,state);
  else if(node.scope==="collection")phase=deriveCollectionPhase(node,state);
  else phase=deriveFocusPhase(node,state);
  const retained=node.mountPolicy!=="lazy"||node.retainOnSleep===true;
  const mounted=phase!=="disposed"&&(retained||phase!=="sleeping"&&phase!=="inactive");
  const active=phase==="active"||phase==="focused";
  const transitioning=phase==="preparing"||phase==="transitioning-in"||phase==="transitioning-out"||phase==="exiting";
  return {...node,phase,mounted,active,interactive:active&&node.scope!=="scene"||phase==="active"&&node.scope==="scene",updates:active||transitioning,contributesToRender:mounted&&phase!=="disposed"};
}

function createSnapshot(state:EngineState,nodes:Iterable<RuntimeNodeRegistration>):RuntimeSnapshot {
  const resolved=[...nodes].map((node)=>deriveRuntimeNodeState(node,state));
  return {
    navigation:state,
    nodes:resolved,
    currentSceneId:state.sceneId||null,
    requestedSceneId:state.requestedSceneId||null,
    activeSceneId:state.requestedSceneId||state.sceneId||null,
    activeCollectionId:state.requestedFocusCollectionId,
    focusedItemId:state.requestedFocusItemId,
    transitioning:state.transitionStatus==="transitioning",
  };
}

class Scheduler implements RuntimeScheduler {
  readonly #getSnapshot:()=>RuntimeSnapshot;
  readonly #tasks=new Map<string,RuntimeTaskRegistration>();
  #orderedTasks:RuntimeTaskRegistration[]|null=null;
  constructor(getSnapshot:()=>RuntimeSnapshot){this.#getSnapshot=getSnapshot;}
  register(task:RuntimeTaskRegistration){
    if(this.#tasks.has(task.id))throw new Error(`[cinematic-navigation/runtime] Duplicate task ID: ${task.id}`);
    this.#tasks.set(task.id,task);
    this.#orderedTasks=null;
    return()=>{if(this.#tasks.get(task.id)===task){this.#tasks.delete(task.id);this.#orderedTasks=null;}};
  }
  update(delta:number,elapsed:number){
    const snapshot=this.#getSnapshot();
    const active=new Set(snapshot.nodes.filter((node)=>node.updates).map((node)=>node.id));
    (this.#orderedTasks??=Array.from(this.#tasks.values()).sort((a,b)=>(a.priority??0)-(b.priority??0))).forEach((task)=>{if(active.has(task.nodeId))task.update({delta,elapsed,runtime:snapshot});});
  }
  getActiveTaskCount(){
    const snapshot=this.#getSnapshot(),active=new Set(snapshot.nodes.filter((node)=>node.updates).map((node)=>node.id));
    return [...this.#tasks.values()].filter((task)=>active.has(task.nodeId)).length;
  }
  clear(){this.#tasks.clear();this.#orderedTasks=null;}
}

export function createCinematicRuntime(engine:CinematicEngine):CinematicRuntime {
  const nodes=new Map<string,RuntimeNodeRegistration>(),nodeReferences=new Map<string,number>(),listeners=new Set<()=>void>(),nodeListeners=new Map<string,Set<RuntimeNodeListener>>();
  let snapshot=createSnapshot(engine.getState(),nodes.values());
  const scheduler=new Scheduler(()=>snapshot);
  const equivalentNode=(left:RuntimeNodeRegistration,right:RuntimeNodeRegistration)=>left.id===right.id&&left.scope===right.scope&&left.sceneId===right.sceneId&&left.collectionId===right.collectionId&&left.focusItemId===right.focusItemId&&left.mountPolicy===right.mountPolicy&&left.retainOnSleep===right.retainOnSleep;
  const lifecycleChanged=(left:RuntimeNodeState|undefined,right:RuntimeNodeState|undefined)=>!left||!right||left.phase!==right.phase||left.mounted!==right.mounted||left.active!==right.active||left.interactive!==right.interactive||left.updates!==right.updates||left.contributesToRender!==right.contributesToRender;
  const runtime:CinematicRuntime={
    registerNode(node:RuntimeNodeRegistration){
      const existing=nodes.get(node.id);
      if(existing&&!equivalentNode(existing,node))throw new Error(`[cinematic-navigation/runtime] Conflicting node registration: ${node.id}`);
      if(existing)nodeReferences.set(node.id,(nodeReferences.get(node.id)??1)+1);
      else {nodes.set(node.id,node);nodeReferences.set(node.id,1);refresh();}
      return()=>{
        const references=nodeReferences.get(node.id)??0;
        if(references<=1){nodeReferences.delete(node.id);if(nodes.get(node.id)===existing||nodes.get(node.id)===node){nodes.delete(node.id);refresh();}}
        else nodeReferences.set(node.id,references-1);
      };
    },
    unregisterNode(nodeId:string){if(nodes.delete(nodeId)){nodeReferences.delete(nodeId);refresh();}},
    registerTask:(task:RuntimeTaskRegistration)=>scheduler.register(task),
    update(delta:number,elapsed:number){scheduler.update(delta,elapsed);},
    getNodeState(nodeId:string){return snapshot.nodes.find((node)=>node.id===nodeId);},
    subscribeNode(nodeId:string,listener:RuntimeNodeListener){const subscriptions=nodeListeners.get(nodeId)??new Set<RuntimeNodeListener>();subscriptions.add(listener);nodeListeners.set(nodeId,subscriptions);return()=>{subscriptions.delete(listener);if(!subscriptions.size)nodeListeners.delete(nodeId);};},
    getSnapshot(){return snapshot;},
    getScheduler(){return scheduler;},
    dispose(){unsubscribeEngine();nodes.clear();nodeReferences.clear();scheduler.clear();listeners.clear();nodeListeners.clear();},
    subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
  };
  const refresh=()=>{
    const previous=snapshot,next=createSnapshot(engine.getState(),nodes.values());
    const changed=next.nodes.some((node)=>lifecycleChanged(node,previous.nodes.find((candidate)=>candidate.id===node.id)))||previous.nodes.some((node)=>!next.nodes.some((candidate)=>candidate.id===node.id));
    snapshot=next;
    if(!changed)return;
    next.nodes.forEach((node)=>{
      const before=previous.nodes.find((candidate)=>candidate.id===node.id);
      if(!lifecycleChanged(node,before))return;
      nodeListeners.get(node.id)?.forEach((listener)=>listener(node,before));
    });
    previous.nodes.forEach((node)=>{if(next.nodes.some((candidate)=>candidate.id===node.id))return;nodeListeners.get(node.id)?.forEach((listener)=>listener(undefined,node));});
    listeners.forEach((listener)=>listener());
  };
  const unsubscribeEngine=engine.subscribe(refresh);
  return runtime;
}
