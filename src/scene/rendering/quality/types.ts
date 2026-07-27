export type QualityProfileId = "ultra" | "high" | "balanced" | "mobile" | "fallback";
export type QualityPreference = "auto" | Exclude<QualityProfileId, "fallback">;
export type QualitySelectionReason =
  | "diagnostic-override"
  | "user-preference"
  | "reduced-motion"
  | "high-pixel-workload"
  | "mobile-capability"
  | "desktop-capability"
  | "safe-fallback";
export type QualityChangeReason =
  | "initial-selection"
  | "sustained-poor-frames"
  | "sustained-stable-frames"
  | "diagnostic-dpr"
  | "viewport-reset"
  | "user-preference";

export interface RenderingQualityProfile {
  id: QualityProfileId;
  label: string;
  renderer: {
    dprMin: number;
    dprMax: number;
    dprLevels: readonly number[];
    antialias: boolean;
    powerPreference: WebGLPowerPreference;
  };
  shadows: {
    enabled: boolean;
    type: "pcf";
    directionalEnabled: boolean;
    directionalMapSize: number;
    deskSpotEnabled: boolean;
    deskSpotMapSize: number;
    contactEnabled: boolean;
    contactResolution: number;
    contactBlur: number;
    contactOpacity: number;
  };
  postprocessing: {
    enabled: boolean;
    ao: {
      enabled: boolean;
      radius: number;
      intensity: number;
      distanceFalloff: number;
      quality: "performance" | "medium" | "high";
      halfResolution: boolean;
    };
    dof: { enabled: boolean; height: number; focalLength: number; bokehScale: number };
    bloom: {
      enabled: boolean;
      intensity: number;
      luminanceThreshold: number;
      luminanceSmoothing: number;
      mipmapBlur: boolean;
    };
    grading: { enabled: boolean; hue: number; saturation: number };
    vignette: { enabled: boolean; offset: number; darkness: number };
  };
  runtime: {
    allowAdaptiveDpr: boolean;
    allowAutomaticDowngrade: boolean;
    allowAutomaticUpgrade: boolean;
    minimumStableDurationMs: number;
    poorDurationMs: number;
    cooldownMs: number;
    targetFrameMs: number;
  };
}

export interface PreliminaryCapabilities {
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  estimatedPixelCount: number;
  coarsePointer: boolean;
  touchPoints: number;
  reducedMotion: boolean;
  hardwareConcurrency: number | null;
  deviceMemoryGb: number | null;
  iosHint: boolean;
}

export interface RenderingCapabilitySnapshot extends PreliminaryCapabilities {
  webglVersion: 1 | 2;
  maximumTextureSize: number;
  maximumRenderbufferSize: number;
  maximumTextureUnits: number;
  maximumAnisotropy: number;
  fragmentPrecision: string;
  renderer: string | null;
  vendor: string | null;
  resolvedDpr: number;
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  capturedAt: string;
}

export interface DiagnosticQualityOverrides {
  profile: QualityProfileId | null;
  dpr: number | null;
  disabled: ReadonlySet<string>;
  warnings: readonly string[];
}

export interface QualitySelection {
  profileId: QualityProfileId;
  reason: QualitySelectionReason;
  signals: readonly string[];
  userForced: boolean;
  adaptiveAllowed: boolean;
}

export interface FrameHealthSummary {
  medianFrameMs: number;
  p95FrameMs: number;
  overBudgetRatio: number;
  longestFrameMs: number;
  sampleDurationMs: number;
  sampleCount: number;
  targetFrameMs: number;
  transitioning: boolean;
  visible: boolean;
  overlayChanging: boolean;
  warmingUp: boolean;
}

export interface QualityChange {
  timestamp: number;
  kind: "profile" | "dpr";
  from: string | number;
  to: string | number;
  reason: QualityChangeReason;
  health: FrameHealthSummary | null;
}

export interface AdaptiveState {
  currentDpr: number;
  targetDpr: number;
  pending: "downgrade" | "upgrade" | null;
  cooldownUntil: number;
  warmupUntil: number;
  lastReason: QualityChangeReason | null;
  health: FrameHealthSummary | null;
  history: readonly QualityChange[];
}
