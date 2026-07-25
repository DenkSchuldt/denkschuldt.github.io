import type { RenderLease,RenderLeaseRequest,RenderReason,RenderSchedulerSnapshot } from "./types";

const cadenceMs=(cadence:RenderLease["cadence"])=>cadence==="15fps"?1000/15:cadence==="30fps"?1000/30:0;
const leaseKey=({ownerId,reason}:Pick<RenderLeaseRequest,"ownerId"|"reason">)=>`${ownerId}\u0000${reason}`;

export class RenderSchedulerStore {
  private listeners=new Set<()=>void>();
  private invalidator:(()=>void)|null=null;
  private leases=new Map<string,RenderLease>();
  private periodicTimer:ReturnType<typeof setTimeout>|null=null;
  private generation=0;
  private snapshot:RenderSchedulerSnapshot={
    mode:"idle",frameloop:"demand",visible:true,continuousLeases:[],periodicLeases:[],
    pendingInvalidations:0,lastInvalidationReason:null,lastInvalidationOwner:null,
    lastRenderedAt:null,idleSince:0,renderedFrames:0,framesWhileIdle:0,
    projectionUpdates:0,dofUpdates:0,invalidationsByOwner:{},warnings:[],forcedMode:null,
  };
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>this.listeners.delete(listener);};
  getSnapshot=()=>this.snapshot;
  setInvalidator(invalidator:(()=>void)|null){this.invalidator=invalidator;}
  configure(search:string){
    if(process.env.NODE_ENV==="production")return;
    const mode=new URLSearchParams(search).get("renderMode");
    this.snapshot={...this.snapshot,forcedMode:mode==="continuous"?"continuous":mode==="demand"?"demand":null};
    if(mode==="continuous")this.acquireContinuous({ownerId:"diagnostics",reason:"diagnostics-capture",priority:3});
  }
  invalidate(ownerId:string,reason:RenderReason){
    if(!this.snapshot.visible)return;
    const counts={...this.snapshot.invalidationsByOwner,[ownerId]:(this.snapshot.invalidationsByOwner[ownerId]??0)+1};
    this.snapshot={...this.snapshot,mode:this.leases.size?"continuous":"one-shot",pendingInvalidations:this.snapshot.pendingInvalidations+1,lastInvalidationReason:reason,lastInvalidationOwner:ownerId,invalidationsByOwner:counts,idleSince:null};
    this.emit();this.invalidator?.();
  }
  acquireContinuous(request:RenderLeaseRequest,now=performance.now()){
    const key=leaseKey(request),existing=this.leases.get(key);
    if(existing){
      const renewed={...existing,expiresAt:request.expiresAt??existing.expiresAt,generation:++this.generation};
      this.leases.set(key,renewed);this.commit();return()=>this.release(key,renewed.generation);
    }
    const lease:RenderLease={id:key,ownerId:request.ownerId,reason:request.reason,priority:request.priority??1,cadence:request.cadence??"display",startedAt:now,expiresAt:request.expiresAt??null,lifecycleId:request.lifecycleId??null,metadata:request.metadata??{},generation:++this.generation};
    this.leases.set(key,lease);this.commit();this.invalidate(request.ownerId,request.reason);
    return()=>this.release(key,lease.generation);
  }
  acquireFor(request:RenderLeaseRequest,durationMs:number,now=performance.now()){
    return this.acquireContinuous({...request,expiresAt:now+durationMs},now);
  }
  acquirePeriodic(request:RenderLeaseRequest,now=performance.now()){
    const release=this.acquireContinuous({...request,cadence:request.cadence??"15fps"},now);
    this.schedulePeriodic();return release;
  }
  releaseOwner(ownerId:string){for(const [key,lease] of this.leases)if(lease.ownerId===ownerId)this.leases.delete(key);this.commit();}
  releaseLifecycle(lifecycleId:string){for(const [key,lease] of this.leases)if(lease.lifecycleId===lifecycleId)this.leases.delete(key);this.commit();}
  expire(now=performance.now()){
    for(const [key,lease] of this.leases)if(lease.expiresAt!==null&&lease.expiresAt<=now)this.leases.delete(key);
    this.commit();
  }
  setVisible(visible:boolean){
    if(this.snapshot.visible===visible)return;
    this.snapshot={...this.snapshot,visible};
    if(!visible){if(this.periodicTimer)clearTimeout(this.periodicTimer);this.periodicTimer=null;}
    else{this.invalidate("document","visibility-restored");this.schedulePeriodic();}
    this.emit();
  }
  frame(now=performance.now()){
    this.expire(now);
    const active=[...this.leases.values()].filter((lease)=>lease.cadence==="display");
    const logicallyIdle=!active.length&&this.snapshot.pendingInvalidations===0;
    this.snapshot={...this.snapshot,renderedFrames:this.snapshot.renderedFrames+1,framesWhileIdle:this.snapshot.framesWhileIdle+(logicallyIdle?1:0),pendingInvalidations:0,lastRenderedAt:now,idleSince:active.length?null:(this.snapshot.idleSince??now),mode:active.length?"continuous":this.periodicLeases().length?"periodic":"idle"};
    this.emit();
    if(this.snapshot.visible&&(active.length||this.snapshot.forcedMode==="continuous"))this.invalidator?.();
  }
  recordProjection(){this.snapshot={...this.snapshot,projectionUpdates:this.snapshot.projectionUpdates+1};}
  recordDof(){this.snapshot={...this.snapshot,dofUpdates:this.snapshot.dofUpdates+1};}
  warn(message:string){if(process.env.NODE_ENV==="production")return;this.snapshot={...this.snapshot,warnings:[...this.snapshot.warnings,message].slice(-30)};this.emit();}
  clearExpired(now=performance.now()){this.expire(now);}
  dispose(){if(this.periodicTimer)clearTimeout(this.periodicTimer);this.periodicTimer=null;this.listeners.clear();this.invalidator=null;}
  private release(key:string,generation:number){const lease=this.leases.get(key);if(!lease||lease.generation!==generation)return;this.leases.delete(key);this.commit();}
  private periodicLeases(){return [...this.leases.values()].filter((lease)=>lease.cadence!=="display");}
  private commit(){
    const continuous=[...this.leases.values()].filter((lease)=>lease.cadence==="display"),periodic=this.periodicLeases();
    this.snapshot={...this.snapshot,continuousLeases:continuous,periodicLeases:periodic,mode:continuous.length?"continuous":periodic.length?"periodic":this.snapshot.pendingInvalidations?"one-shot":"idle",idleSince:continuous.length||this.snapshot.pendingInvalidations?null:(this.snapshot.idleSince??performance.now())};
    this.schedulePeriodic();this.emit();
  }
  private schedulePeriodic(){
    if(this.periodicTimer){clearTimeout(this.periodicTimer);this.periodicTimer=null;}
    const leases=this.periodicLeases();if(!this.snapshot.visible||!leases.length)return;
    const delay=Math.min(...leases.map(({cadence})=>cadenceMs(cadence)));
    this.periodicTimer=setTimeout(()=>{this.periodicTimer=null;this.invalidate("periodic",leases[0].reason);this.schedulePeriodic();},delay);
  }
  private emit(){this.listeners.forEach((listener)=>listener());}
}
