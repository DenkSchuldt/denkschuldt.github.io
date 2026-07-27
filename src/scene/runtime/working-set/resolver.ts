import type { QualityProfileId } from "../../rendering/quality";
import type { SceneId } from "../../camera/navigationTypes";
import { WORKING_SET_DEFINITIONS, WORKING_SET_DESTINATIONS } from "./definitions.ts";
import type { DestinationWorkingSetState, WorkingSetNavigationIntent } from "./types";

export interface ResolverState {
  destinations: Record<SceneId, DestinationWorkingSetState>;
  lastIntent: WorkingSetNavigationIntent | null;
}

export const createResolverState = (initial: SceneId = "opening"): ResolverState => ({
  lastIntent: null,
  destinations: Object.fromEntries(
    WORKING_SET_DESTINATIONS.map((destination) => [
      destination,
      {
        destination,
        state: destination === initial ? "active" : "ambient",
        releaseAt: null,
        generation: 0,
        reason: destination === initial ? "initial-active" : "ambient-structure",
      },
    ]),
  ) as Record<SceneId, DestinationWorkingSetState>,
});

export function resolveWorkingSet(
  previous: ResolverState,
  intent: WorkingSetNavigationIntent,
  profileId: QualityProfileId,
  now: number,
): ResolverState {
  const next: ResolverState = { lastIntent: intent, destinations: { ...previous.destinations } };
  for (const destination of WORKING_SET_DESTINATIONS) {
    const before = previous.destinations[destination];
    let state = before.state,
      releaseAt = before.releaseAt,
      reason = before.reason,
      generation = before.generation;
    if (destination === intent.requested) {
      state = destination === intent.current && !intent.transitioning ? "active" : "preparing";
      releaseAt = null;
      reason = state === "active" ? "current-destination" : "navigation-target";
      if (before.state !== state) generation++;
    } else if (destination === intent.current) {
      state = intent.transitioning ? "sleeping" : "active";
      releaseAt = null;
      reason = intent.transitioning ? "departing" : "current-destination";
    } else if (
      before.state === "active" ||
      before.state === "preparing" ||
      before.state === "sleeping"
    ) {
      const retention = WORKING_SET_DEFINITIONS[destination].retentionMs[profileId];
      if (retention === Infinity) {
        state = "sleeping";
        releaseAt = null;
        reason = "shared-session-retention";
      } else if (retention <= 0) {
        state = "releasing";
        releaseAt = now;
        reason = "immediate-release";
      } else if (releaseAt === null) {
        state = "sleeping";
        releaseAt = now + retention;
        reason = "bounded-retention";
      } else if (intent.visible && now >= releaseAt) {
        state = "releasing";
        reason = "retention-expired";
      }
    } else if (before.state === "releasing") {
      state = "ambient";
      releaseAt = null;
      reason = "released-to-ambient";
    } else state = "ambient";
    next.destinations[destination] = { destination, state, releaseAt, generation, reason };
  }
  return next;
}

export const isResourceResidentState = (state: DestinationWorkingSetState["state"]) =>
  state === "preparing" || state === "active" || state === "sleeping";

export function resolvePreparationPriority(
  intent: WorkingSetNavigationIntent,
  profileId: QualityProfileId,
) {
  const ordered = [
    ...intent.overlayResourceIds.map((id) => ({ id, priority: 0, reason: "overlay" })),
    ...intent.focusedResourceIds.map((id) => ({ id, priority: 1, reason: "focus" })),
    { id: `destination:${intent.current}`, priority: 2, reason: "active" },
    ...(intent.requested !== intent.current
      ? [{ id: `destination:${intent.requested}`, priority: 3, reason: "target" }]
      : []),
  ];
  return ordered
    .filter((item, index) => ordered.findIndex(({ id }) => id === item.id) === index)
    .filter((item) => profileId !== "fallback" || item.reason !== "speculative");
}

export const isPreparationGenerationCurrent = (
  state: DestinationWorkingSetState,
  generation: number,
) => state.generation === generation && (state.state === "preparing" || state.state === "active");
