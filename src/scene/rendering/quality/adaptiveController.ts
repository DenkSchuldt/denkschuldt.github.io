import type {
  AdaptiveState,
  FrameHealthSummary,
  QualityChangeReason,
  RenderingQualityProfile,
  QualityProfileId,
} from "./types.ts";

export interface AdaptiveInput {
  now: number;
  health: FrameHealthSummary;
  profile: RenderingQualityProfile;
  autoMode: boolean;
  maximumDpr?: number;
}
export interface AdaptiveDecision {
  state: AdaptiveState;
  nextDpr: number | null;
  nextProfileId: QualityProfileId | null;
}

export const QUALITY_PROFILE_ORDER: readonly QualityProfileId[] = [
  "ultra",
  "high",
  "balanced",
  "mobile",
  "fallback",
];
const nextLevel = (levels: readonly number[], current: number, direction: -1 | 1) => {
  const sorted = [...levels].sort((a, b) => a - b),
    index = sorted.reduce(
      (best, value, candidate) =>
        Math.abs(value - current) < Math.abs(sorted[best] - current) ? candidate : best,
      0,
    );
  return sorted[Math.max(0, Math.min(sorted.length - 1, index + direction))];
};
export const createAdaptiveState = (dpr: number, now = 0): AdaptiveState => ({
  currentDpr: dpr,
  targetDpr: dpr,
  pending: null,
  cooldownUntil: 0,
  warmupUntil: now + 3000,
  lastReason: null,
  health: null,
  history: [],
});

export function evaluateAdaptiveDpr(state: AdaptiveState, input: AdaptiveInput): AdaptiveDecision {
  const { now, health, profile, autoMode } = input,
    next = { ...state, health };
  if (
    !autoMode ||
    !profile.runtime.allowAdaptiveDpr ||
    !health.visible ||
    health.transitioning ||
    health.overlayChanging ||
    health.warmingUp ||
    now < state.warmupUntil ||
    now < state.cooldownUntil
  )
    return { state: { ...next, pending: null }, nextDpr: null, nextProfileId: null };
  const poor =
    health.sampleDurationMs >= profile.runtime.poorDurationMs &&
    (health.p95FrameMs > profile.runtime.targetFrameMs * 1.18 || health.overBudgetRatio > 0.35);
  const stable =
    health.sampleDurationMs >= profile.runtime.minimumStableDurationMs &&
    health.p95FrameMs <= profile.runtime.targetFrameMs * 1.08 &&
    health.overBudgetRatio < 0.08;
  let target = state.currentDpr,
    reason: QualityChangeReason | null = null;
  if (poor && profile.runtime.allowAutomaticDowngrade) {
    target = nextLevel(profile.renderer.dprLevels, state.currentDpr, -1);
    reason = "sustained-poor-frames";
  } else if (stable && profile.runtime.allowAutomaticUpgrade) {
    target = Math.min(
      input.maximumDpr ?? profile.renderer.dprMax,
      nextLevel(profile.renderer.dprLevels, state.currentDpr, 1),
    );
    reason = "sustained-stable-frames";
  }
  const nextProfileId =
    poor && profile.runtime.allowAutomaticDowngrade && state.currentDpr <= profile.renderer.dprMin
      ? (QUALITY_PROFILE_ORDER[QUALITY_PROFILE_ORDER.indexOf(profile.id) + 1] ?? null)
      : null;
  if ((target === state.currentDpr && !nextProfileId) || !reason)
    return {
      state: { ...next, pending: poor ? "downgrade" : stable ? "upgrade" : null },
      nextDpr: null,
      nextProfileId: null,
    };
  const change = {
    timestamp: now,
    kind: nextProfileId ? ("profile" as const) : ("dpr" as const),
    from: nextProfileId ? profile.id : state.currentDpr,
    to: nextProfileId ?? target,
    reason,
    health,
  };
  return {
    nextDpr: target === state.currentDpr ? null : target,
    nextProfileId,
    state: {
      ...next,
      currentDpr: target,
      targetDpr: target,
      pending: null,
      cooldownUntil: now + profile.runtime.cooldownMs,
      warmupUntil: now + 2000,
      lastReason: reason,
      history: [...state.history, change].slice(-30),
    },
  };
}
