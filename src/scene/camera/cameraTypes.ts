export type CameraTargetId = "opening" | "workspace" | "about" | "projects" | "certificates" | "poems" | "phone" | "wall" | "drawer";
export type CameraViewport = "desktop" | "tablet" | "mobile";
export type Vec3Tuple = [number, number, number];

export interface CameraBreathing {
  positionAmplitude: number;
  rotationAmplitude: number;
  speed: number;
}

export interface CameraTargetOverride {
  position?: Vec3Tuple;
  lookAt?: Vec3Tuple;
  fov?: number;
}

export interface CameraTarget {
  id: CameraTargetId;
  label: string;
  position: Vec3Tuple;
  lookAt: Vec3Tuple;
  fov: number;
  duration: number;
  arrivalDelay?: number;
  focusDistance?: number;
  breathing?: CameraBreathing;
  waypoint?: Vec3Tuple;
  responsive?: Partial<Record<CameraViewport, CameraTargetOverride>>;
}

export interface ResolvedCameraTarget extends Omit<CameraTarget, "responsive"> {}

export interface CinematicCameraState {
  currentTarget: CameraTargetId;
  requestedTarget: CameraTargetId;
  isTransitioning: boolean;
  isIntroActive: boolean;
  introComplete: boolean;
  transitionProgress: number;
}
