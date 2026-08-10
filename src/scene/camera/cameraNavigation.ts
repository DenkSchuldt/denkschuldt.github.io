import {
  getAdjacentFocus,
  getAdjacentScene,
  getFocusNeighbor,
  SCENE_REGISTRY,
  sceneForCameraTarget,
} from "./sceneRegistry.ts";

import type { CameraNavigationState, FocusDirection, SceneId } from "./navigationTypes.ts";
import type { ShotId } from "./shotTypes";

export function getAdjacentShot(
  current: ShotId,
  direction: -1 | 1,
  visitedAutoScenes: readonly SceneId[] = [],
): ShotId | null {
  if (current === "certificate-detail") return direction > 0 ? "projects" : "certificates";
  if (
    current === "workspace" ||
    current === "project-detail" ||
    current === "poem-detail" ||
    current === "socials" ||
    current === "movie-detail"
  )
    return null;
  const scene = getAdjacentScene(sceneForCameraTarget(current), direction, visitedAutoScenes);
  return scene ? SCENE_REGISTRY[scene].cameraTarget : null;
}

/** @deprecated Use getAdjacentShot. */
export const getAdjacentCameraTarget = getAdjacentShot;

export const isTrackpadPinchOut = (accumulatedDelta: number) => accumulatedDelta >= 48;
// "about" is excluded alongside focus-collection scenes because its polaroid
// photo is a clickable canvas object too: R3F's onClick doesn't stop the
// underlying native touch event from also reaching the window-level tap
// handler below, so tapping the photo would otherwise also advance the scene.
export const allowsCanvasTapNavigation = (sceneId: SceneId) =>
  !SCENE_REGISTRY[sceneId].focusCollection && sceneId !== "about";
export const isSceneReadyForAutoAdvance = (
  state: Pick<
    CameraNavigationState,
    | "sceneId"
    | "requestedScene"
    | "currentTarget"
    | "requestedTarget"
    | "isTransitioning"
    | "introComplete"
  >,
  sceneId: SceneId,
) => {
  const scene = SCENE_REGISTRY[sceneId];
  return (
    Boolean(scene.autoAdvance) &&
    state.introComplete &&
    !state.isTransitioning &&
    state.sceneId === sceneId &&
    state.requestedScene === sceneId &&
    state.currentTarget === scene.cameraTarget &&
    state.requestedTarget === scene.cameraTarget
  );
};
export const shouldBeginShotTransition = (
  introCompleted: boolean,
  paused: boolean,
  requested: ShotId,
  activeRequest: ShotId,
) => introCompleted && !paused && requested !== activeRequest;
export const shouldSyncRouteShot = (path: string, directEntry: boolean) =>
  path !== "/" || directEntry;
export const isOpeningAboutJourney = (from: ShotId, to: ShotId) =>
  (from === "opening" && to === "about") || (from === "about" && to === "opening");
export const isDrawerOpeningReturn = (from: ShotId, to: ShotId) =>
  from === "drawer" && to === "opening";
export const getShotOvershoot = (shot: ShotId, overshoot: number) =>
  shot === "about" || shot === "opening" || shot === "certificate-detail" ? 0 : overshoot;
export const getCertificateBrowseOffset = (
  pointerX: number,
  pointerY: number,
  anchorX: number,
  anchorY: number,
) => [(pointerX - anchorX) * 1.9, (pointerY - anchorY) * 2.1] as const;
export const getFocusDirectionForKey = (key: string): FocusDirection | null =>
  key === "ArrowLeft"
    ? "left"
    : key === "ArrowRight"
      ? "right"
      : key === "ArrowUp"
        ? "up"
        : key === "ArrowDown"
          ? "down"
          : null;
export const isReturnToStartKey = (key: string) => key === "Escape";
export const shouldResumeFromStart = (
  resumeScene: string | null,
  currentScene: string,
  destination: string,
) =>
  Boolean(resumeScene) &&
  currentScene === "opening" &&
  (destination === "about" || destination === resumeScene);
export { getAdjacentFocus, getFocusNeighbor };
export type { FocusDirection };
