export const RENDERING_INTENT = {
  renderer: {
    toneMapping: "ACESFilmicToneMapping",
    exposure: 0.68,
    outputColorSpace: "srgb",
    powerPreference: "high-performance",
    antialias: true,
    dpr: [1, 1.6] as const,
  },
  shadows: { enabled: true, type: "PCFShadowMap" },
  environment: { intensity: 0 },
  postProcessing: {
    ambientOcclusionIntensity: 0.32,
    ambientOcclusionLimit: 0.35,
    vignetteDarkness: 0.22,
    vignetteLimit: 0.24,
    bloomIntensity: 0.08,
    paperMultisampling: 2,
  },
  lighting: {
    essentialLights: ["moon-key", "desk-key", "hemisphere-fill", "drawer-rim"] as const,
    hemisphereDesktopFactor: 0.16,
    hemisphereMobileFactor: 1.25,
    drawerRimFactor: 0.7,
  },
} as const;

export const isMobileRenderingViewport = (aspect: number) => aspect < 0.82;
export const resolveHemisphereIntensity = (bounce: number, aspect: number) =>
  bounce *
  (isMobileRenderingViewport(aspect)
    ? RENDERING_INTENT.lighting.hemisphereMobileFactor
    : RENDERING_INTENT.lighting.hemisphereDesktopFactor);

export interface DarkRegionLuminanceMetrics {
  mean: number;
  crushedRatio: number;
}
export const DARK_REGION_LUMINANCE_FLOOR = { mean: 3.6, maxCrushedRatio: 0.97 } as const;
export const preservesDarkRegionSeparation = (metrics: DarkRegionLuminanceMetrics) =>
  metrics.mean >= DARK_REGION_LUMINANCE_FLOOR.mean &&
  metrics.crushedRatio <= DARK_REGION_LUMINANCE_FLOOR.maxCrushedRatio;
