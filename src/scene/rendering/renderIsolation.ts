export interface RenderIsolationState {
  postProcessing: boolean;
  ambientOcclusion: boolean;
  vignette: boolean;
  bloom: boolean;
  shadows: boolean;
  environmentLighting: boolean;
  fillLighting: boolean;
  mobilePerformanceAdaptations: boolean;
}

export const DEFAULT_RENDER_ISOLATION: RenderIsolationState = {
  postProcessing: true,
  ambientOcclusion: true,
  vignette: true,
  bloom: true,
  shadows: true,
  environmentLighting: true,
  fillLighting: true,
  mobilePerformanceAdaptations: true,
};
