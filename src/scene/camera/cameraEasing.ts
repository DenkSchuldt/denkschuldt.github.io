export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function cinematicEase(value: number) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function applyReducedMotionDuration(duration: number, reducedMotion: boolean) {
  return reducedMotion ? Math.min(0.45, duration * 0.12) : duration;
}
