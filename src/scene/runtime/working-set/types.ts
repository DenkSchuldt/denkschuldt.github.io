import type { QualityProfileId } from "../../rendering/quality";
import type { SceneId } from "../../camera/navigationTypes";

export type WorkingSetState="absent"|"ambient"|"preparing"|"active"|"sleeping"|"releasing"|"error";
export type WorkingSetResourceClass="persistent-essential"|"ambient"|"preparable"|"active-only"|"overlay-only"|"shared-cache";
export type ReleaseEvidence="unmounted"|"references-released"|"loader-cache-evicted"|"texture-disposed"|"browser-memory-unverified"|"gpu-memory-unverified";

export interface WorkingSetResourceDefinition {
  id:string;
  destination:SceneId;
  class:WorkingSetResourceClass;
  shared:boolean;
  owner:string;
  preparationRequired:boolean;
  failureFallback:string;
  estimatedDecodedBytes?:number;
}

export interface DestinationWorkingSetDefinition {
  id:SceneId;
  resources:readonly WorkingSetResourceDefinition[];
  preparationLeadMs:number;
  retentionMs:Record<QualityProfileId,number>;
  speculative:boolean;
}

export interface WorkingSetNavigationIntent {
  current:SceneId;
  requested:SceneId;
  transitioning:boolean;
  overlayResourceIds:readonly string[];
  focusedResourceIds:readonly string[];
  visible:boolean;
}

export interface WorkingSetEvent {
  at:number;
  type:"state"|"prepare-start"|"prepare-end"|"prepare-cancel"|"cache-hit"|"cache-miss"|"release"|"dispose"|"error";
  resourceId:string;
  detail?:string;
  evidence?:readonly ReleaseEvidence[];
}

export interface DestinationWorkingSetState {
  destination:SceneId;
  state:WorkingSetState;
  releaseAt:number|null;
  generation:number;
  reason:string;
}

export interface ResidentResourceState {
  id:string;
  destination:SceneId;
  status:"preparing"|"resident"|"sleeping"|"released"|"error";
  estimatedDecodedBytes:number|null;
  cache:"owned"|"shared-loader"|"browser";
  evidence:readonly ReleaseEvidence[];
}

export interface WorkingSetSnapshot {
  profileId:QualityProfileId;
  activeDestination:SceneId;
  approachingDestination:SceneId|null;
  destinations:Readonly<Record<SceneId,DestinationWorkingSetState>>;
  resources:Readonly<Record<string,ResidentResourceState>>;
  events:readonly WorkingSetEvent[];
  estimatedDecodedTextureBytes:number;
  pendingReleases:number;
  activeRuntimeTasks:number|null;
  raycastCandidates:number|null;
  diagnostics:{force:string|null;retentionDisabled:boolean;showResourceIds:boolean;logEvents:boolean;simulatedFailure:string|null};
}
