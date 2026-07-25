"use client";

export type PerformanceScene="opening"|"about"|"certificates"|"projects"|"wall"|"phone"|"poems"|"drawer";

export interface PerformanceSwitches {
  postProcessing:boolean;
  ambientOcclusion:boolean;
  depthOfField:boolean;
  bloom:boolean;
  grading:boolean;
  vignette:boolean;
  contactShadows:boolean;
  directionalShadow:boolean;
  deskShadow:boolean;
  allShadows:boolean;
  antialias:boolean;
  dpr:1|1.25|1.6|null;
  laptopProjection:boolean;
  coffeeSteam:boolean;
  nonCameraTasks:boolean;
}

export interface TaskAggregate {
  executions:number;
  totalMs:number;
  maxMs:number;
  samples:number[];
  scenes:Record<string,number>;
}

export interface FrameSample {
  timestamp:number;
  deltaMs:number;
  scene:string;
  collection:string|null;
  focusItem:string|null;
  calls:number;
  triangles:number;
  points:number;
  lines:number;
  geometries:number;
  textures:number;
  programs:number|null;
  drawingBufferWidth:number;
  drawingBufferHeight:number;
}

export interface PerformanceSession {
  schemaVersion:1;
  startedAt:string;
  buildCommit:string;
  scenario:string;
  cacheState:string;
  notes:string;
  invalidationReason:string|null;
  environment:Record<string,unknown>;
  switches:PerformanceSwitches;
  frames:FrameSample[];
  tasks:Record<string,TaskAggregate>;
  marks:Record<string,number>;
  pointer:{events:number;raycasterCalls:number;candidates:number;intersections:number;totalMs:number;maxMs:number};
  reactCommits:Array<{id:string;phase:string;actualDuration:number;baseDuration:number;startTime:number;commitTime:number;scene:string}>;
}

const defaults:PerformanceSwitches={
  postProcessing:true,ambientOcclusion:true,depthOfField:true,bloom:true,grading:true,vignette:true,
  contactShadows:true,directionalShadow:true,deskShadow:true,allShadows:true,antialias:true,dpr:null,
  laptopProjection:true,coffeeSteam:true,nonCameraTasks:true,
};

const percentile=(values:number[],fraction:number)=>{
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*fraction)-1))];
};

class PerformanceDiagnosticStore {
  enabled=false;
  scene:PerformanceScene="opening";
  collection:string|null=null;
  focusItem:string|null=null;
  switches={...defaults};
  session:PerformanceSession=this.createSession();
  listeners=new Set<()=>void>();
  version=0;

  createSession():PerformanceSession {
    return {schemaVersion:1,startedAt:new Date().toISOString(),buildCommit:process.env.NEXT_PUBLIC_GIT_COMMIT??"not available",scenario:"unlabelled",cacheState:"not recorded",notes:"",invalidationReason:null,environment:{},switches:{...(this.switches??defaults)},frames:[],tasks:{},marks:{navigationStart:typeof performance==="undefined"?0:performance.timeOrigin},pointer:{events:0,raycasterCalls:0,candidates:0,intersections:0,totalMs:0,maxMs:0},reactCommits:[]};
  }
  configure(search:string){
    const params=new URLSearchParams(search);
    this.enabled=process.env.NODE_ENV!=="production"&&params.get("perf")==="1";
    const disabled=new Set((params.get("perfDisable")??"").split(",").filter(Boolean));
    const dpr=Number(params.get("perfDpr"));
    this.switches={
      postProcessing:!disabled.has("post"),ambientOcclusion:!disabled.has("ao"),depthOfField:!disabled.has("dof"),
      bloom:!disabled.has("bloom"),grading:!disabled.has("grading"),vignette:!disabled.has("vignette"),
      contactShadows:!disabled.has("contactShadows"),directionalShadow:!disabled.has("directionalShadow"),
      deskShadow:!disabled.has("deskShadow"),allShadows:!disabled.has("shadows"),
      antialias:!disabled.has("aa"),dpr:dpr===1||dpr===1.25||dpr===1.6?dpr:null,
      laptopProjection:!disabled.has("projection"),coffeeSteam:!disabled.has("steam"),nonCameraTasks:!disabled.has("tasks"),
    };
    this.session.switches={...this.switches};
  }
  setLocation(scene:PerformanceScene,collection:string|null,focusItem:string|null){
    this.scene=scene;this.collection=collection;this.focusItem=focusItem;
  }
  setEnvironment(environment:Record<string,unknown>){this.session.environment={...this.session.environment,...environment};}
  mark(name:string,value=performance.now()){if(this.enabled)this.session.marks[name]=value;}
  addFrame(frame:Omit<FrameSample,"scene"|"collection"|"focusItem">){
    if(!this.enabled)return;
    this.session.frames.push({...frame,scene:this.scene,collection:this.collection,focusItem:this.focusItem});
    if(this.session.frames.length>108000)this.session.frames.shift();
  }
  measure<T>(name:string,callback:()=>T):T {
    if(!this.enabled)return callback();
    const start=performance.now();
    try{return callback();}
    finally{
      const duration=performance.now()-start;
      const aggregate=this.session.tasks[name]??={executions:0,totalMs:0,maxMs:0,samples:[],scenes:{}};
      aggregate.executions++;aggregate.totalMs+=duration;aggregate.maxMs=Math.max(aggregate.maxMs,duration);
      aggregate.samples.push(duration);if(aggregate.samples.length>10000)aggregate.samples.shift();
      aggregate.scenes[this.scene]=(aggregate.scenes[this.scene]??0)+1;
      this.session.tasks[name]=aggregate;
    }
  }
  pointer(duration:number,candidates:number,intersections:number){
    if(!this.enabled)return;
    const metric=this.session.pointer;metric.events++;metric.raycasterCalls++;metric.candidates+=candidates;metric.intersections+=intersections;metric.totalMs+=duration;metric.maxMs=Math.max(metric.maxMs,duration);
  }
  reactCommit(id:string,phase:string,actualDuration:number,baseDuration:number,startTime:number,commitTime:number){
    if(!this.enabled)return;
    this.session.reactCommits.push({id,phase,actualDuration,baseDuration,startTime,commitTime,scene:this.scene});
  }
  reset(){this.session=this.createSession();this.session.switches={...this.switches};this.emit();}
  label(scenario:string,cacheState="not recorded",notes=""){this.session.scenario=scenario;this.session.cacheState=cacheState;this.session.notes=notes;this.emit();}
  invalidate(reason:string){this.session.invalidationReason=reason;this.emit();}
  summary(){
    const deltas=this.session.frames.map(({deltaMs})=>deltaMs);
    const fps=deltas.filter(Boolean).map((delta)=>1000/delta);
    const over=(threshold:number)=>deltas.filter((value)=>value>threshold).length;
    const taskSummary=Object.fromEntries(Object.entries(this.session.tasks).map(([name,value])=>[name,{executions:value.executions,totalMs:value.totalMs,averageMs:value.executions?value.totalMs/value.executions:0,p95Ms:percentile(value.samples,.95),maxMs:value.maxMs,scenes:value.scenes}]));
    return {
      scenario:this.session.scenario,cacheState:this.session.cacheState,startedAt:this.session.startedAt,durationMs:deltas.reduce((sum,value)=>sum+value,0),
      frames:deltas.length,averageFps:fps.length?fps.reduce((a,b)=>a+b,0)/fps.length:0,medianFps:percentile(fps,.5),
      onePercentLowFps:fps.length?percentile(fps,.01):0,minimumFps:fps.length?Math.min(...fps):0,
      averageFrameMs:deltas.length?deltas.reduce((a,b)=>a+b,0)/deltas.length:0,medianFrameMs:percentile(deltas,.5),
      p95FrameMs:percentile(deltas,.95),p99FrameMs:percentile(deltas,.99),longestFrameMs:deltas.length?Math.max(...deltas):0,
      framesOver16_67:over(16.67),framesOver22_22:over(22.22),framesOver33_33:over(33.33),
      latestRenderer:this.session.frames.at(-1)??null,tasks:taskSummary,pointer:this.session.pointer,
      react:{commits:this.session.reactCommits.length,totalActualDurationMs:this.session.reactCommits.reduce((sum,commit)=>sum+commit.actualDuration,0),byComponent:Object.fromEntries([...new Set(this.session.reactCommits.map(({id})=>id))].map((id)=>[id,this.session.reactCommits.filter((commit)=>commit.id===id).length]))},
      environment:this.session.environment,switches:this.switches,marks:this.session.marks,invalidationReason:this.session.invalidationReason,
    };
  }
  export(){
    return {session:{...this.session,tasks:Object.fromEntries(Object.entries(this.session.tasks).map(([key,value])=>[key,{...value,samples:undefined}]))},summary:this.summary()};
  }
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>this.listeners.delete(listener);};
  emit(){this.version++;this.listeners.forEach((listener)=>listener());}
}

export const performanceDiagnostics=new PerformanceDiagnosticStore();
export const measurePerformanceTask=<T>(name:string,callback:()=>T)=>performanceDiagnostics.measure(name,callback);

declare global {
  interface Window {
    __PORTFOLIO_PERF__?:{
      reset:()=>void;
      label:(scenario:string,cacheState?:string,notes?:string)=>void;
      mark:(name:string)=>void;
      invalidate:(reason:string)=>void;
      summary:()=>ReturnType<PerformanceDiagnosticStore["summary"]>;
      export:()=>ReturnType<PerformanceDiagnosticStore["export"]>;
    };
  }
}
