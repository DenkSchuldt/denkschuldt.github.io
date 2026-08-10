export const RENDERING_INTENT = {
  renderer: {
    toneMapping: "ACESFilmicToneMapping",
    exposure: 0.82,
    outputColorSpace: "srgb",
    powerPreference: "high-performance",
    antialias: true,
    dpr: [1, 1.6] as const,
  },
  shadows: { enabled: true, type: "PCFShadowMap" },
  environment: { intensity: 0 },
  postProcessing: {
    ambientOcclusionIntensity: 0.21,
    ambientOcclusionLimit: 0.24,
    vignetteDarkness: 0.13,
    vignetteLimit: 0.15,
    bloomIntensity: 0.08,
    paperMultisampling: 2,
  },
  lighting: {
    essentialLights: ["sun-key", "hemisphere-fill"] as const,
    // Soft, direction-aware skylight fill standing in for midday daylight —
    // not a flat ambientLight boost. Mobile gets extra lift on top of this
    // because its tighter framing and stronger vignette read darker at the
    // same raw light levels.
    hemisphereDesktopFactor: 0.5,
    hemisphereMobileFactor: 1.75,
    // PCF blur-kernel radius for sun-key's shadow (still PCFShadowMap, not
    // PCFSoftShadowMap — that type is deprecated in the installed three.js
    // and silently downgrades with a console warning, see Experience.tsx).
    // This is the supported way to soften a PCF shadow's edges.
    sunShadowRadius: 6,
  },
  // Architectural wall palette. Colors are used literally (not pre-tinted
  // for tone mapping) — the light wall's warmth and the accent wall's
  // muted read are meant to come from context: the warm practical lights,
  // dark wood furniture, and daylight color around them, not from
  // distorting the input hex. See Room() in objects/Primitives.tsx.
  architecture: {
    lightWallColor: "#ebeced",
    accentWallColor: "#203a63",
    wallRoughness: 0.88,
    wallGrainStrength: 0.1,
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
