import type { ShotBreathing, ShotId, ShotViewport, Vec3Tuple } from "./shotTypes";
export type CameraTargetId=ShotId;
export type CameraViewport=ShotViewport;
export type { Vec3Tuple } from "./shotTypes";
export type CameraBreathing=ShotBreathing;
export interface CameraTargetOverride { position?:Vec3Tuple; lookAt?:Vec3Tuple; fov?:number; roll?:number }
export interface CameraTarget { id:ShotId; label:string; position:Vec3Tuple; lookAt:Vec3Tuple; fov:number; roll?:number; duration:number; arrivalDelay?:number; focusDistance?:number; breathing?:ShotBreathing; waypoint?:Vec3Tuple; responsive?:Partial<Record<ShotViewport,CameraTargetOverride>> }
export interface ResolvedCameraTarget extends Omit<CameraTarget,"responsive"> {}
export interface CinematicCameraState { currentTarget:ShotId; requestedTarget:ShotId; isTransitioning:boolean; isIntroActive:boolean; introComplete:boolean; transitionProgress:number }
