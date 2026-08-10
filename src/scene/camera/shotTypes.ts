export type ShotId =
  | "opening"
  | "workspace"
  | "about"
  | "projects"
  | "project-detail"
  | "certificates"
  | "certificate-detail"
  | "poems"
  | "poem-detail"
  | "phone"
  | "socials"
  | "wall"
  | "movie-detail"
  | "drawer";
export type ShotViewport = "desktop" | "tablet" | "mobile";
export type Vec3Tuple = [number, number, number];

export interface ShotBreathing {
  positionAmplitude: number;
  rotationAmplitude: number;
  speed: number;
}

export interface ShotFraming {
  position: Vec3Tuple;
  lookAt: Vec3Tuple;
  fov: number;
  roll?: number;
  waypoint?: Vec3Tuple;
  safeMargins?: { top: number; right: number; bottom: number; left: number };
  alignment?: "center" | "left" | "right";
  composition?: string;
}

export interface ShotFramingOverride extends Partial<Omit<ShotFraming, "safeMargins">> {
  safeMargins?: ShotFraming["safeMargins"];
}

export interface ShotFocus {
  enabled: boolean;
  focusDistance: number;
  depthOfFieldStrength?: number;
  focusTarget?: string;
  focusOffset?: Vec3Tuple;
}

export interface ShotTransition {
  duration: number;
  arrivalDelay?: number;
  breathing?: ShotBreathing;
}

export interface Shot {
  id: ShotId;
  label: string;
  route: string | null;
  subject: string;
  framing: ShotFraming;
  focus: ShotFocus;
  transition: ShotTransition;
  responsive?: Partial<Record<ShotViewport, ShotFramingOverride>>;
  guided?: boolean;
}

export interface ResolvedShot extends Omit<Shot, "responsive" | "framing"> {
  viewport: ShotViewport;
  framing: ShotFraming;
}

export interface CinematicShotState {
  currentShot: ShotId;
  requestedShot: ShotId;
  transitioning: boolean;
  introCompleted: boolean;
  introActive: boolean;
  lastVisitedShot: ShotId | null;
  transitionProgress: number;
}
