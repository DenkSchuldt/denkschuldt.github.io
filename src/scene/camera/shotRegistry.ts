import {
  FOCUS_COLLECTIONS,
  GUIDED_SCENE_IDS,
  SCENE_REGISTRY,
  WORKSPACE_PRESENTATION,
} from "./sceneRegistry.ts";
import type { ResolvedShot, Shot, ShotId, ShotViewport } from "./shotTypes.ts";

const sceneShot = (sceneId: keyof typeof SCENE_REGISTRY): Shot => {
  const scene = SCENE_REGISTRY[sceneId];
  return {
    id: scene.cameraTarget,
    label: scene.label,
    route: scene.route,
    subject: scene.subject,
    framing: scene.framing,
    focus: scene.cameraFocus,
    transition: scene.transition,
    responsive: scene.responsive,
    guided: true,
  };
};

const focusShot = (
  id: ShotId,
  label: string,
  collectionId: keyof typeof FOCUS_COLLECTIONS,
  subject: string,
  route?: string,
): Shot => {
  const collection = FOCUS_COLLECTIONS[collectionId];
  return {
    id,
    label,
    route: route ?? collection.routePattern,
    subject,
    framing: collection.defaultFraming,
    focus: collection.cameraFocus,
    transition: collection.transition,
    responsive: SCENE_REGISTRY[collection.sceneId].responsive,
  };
};

export const SHOT_REGISTRY: Record<ShotId, Shot> = {
  opening: sceneShot("opening"),
  workspace: WORKSPACE_PRESENTATION,
  about: sceneShot("about"),
  projects: sceneShot("projects"),
  "project-detail": focusShot("project-detail", "Project detail", "projects", "project-detail"),
  certificates: sceneShot("certificates"),
  "certificate-detail": focusShot(
    "certificate-detail",
    "Certificate detail",
    "certificates",
    "certificate-detail",
  ),
  poems: sceneShot("poems"),
  "poem-detail": focusShot("poem-detail", "Poem detail", "poems", "poem-detail"),
  phone: sceneShot("phone"),
  "phone-qr": focusShot("phone-qr", "Phone QR", "phone", "phone-qr", "/phone/qr"),
  socials: focusShot("socials", "Socials", "phone", "socials", "/socials"),
  wall: sceneShot("wall"),
  "movie-detail": focusShot("movie-detail", "Movie detail", "wall", "movie-detail"),
  drawer: sceneShot("drawer"),
};

export const INTRO_DESTINATION: ShotId = "about";
export const INTRO_PAN_SHOT: ShotId = "workspace";
export const GUIDED_SHOT_IDS: ShotId[] = GUIDED_SCENE_IDS.filter((id) => id !== "opening");

export function getShotViewport(aspect: number): ShotViewport {
  return aspect < 0.82 ? "mobile" : aspect < 1.45 ? "tablet" : "desktop";
}

export function resolveShot(id: ShotId, aspect: number): ResolvedShot {
  const shot = SHOT_REGISTRY[id];
  if (!shot) throw new Error(`Unknown shot: ${id}`);
  const viewport = getShotViewport(aspect);
  const override = shot.responsive?.[viewport];
  return {
    ...shot,
    viewport,
    framing: {
      ...shot.framing,
      ...override,
      safeMargins: override?.safeMargins ?? shot.framing.safeMargins,
    },
  };
}

export function validateShotRegistry() {
  if (process.env.NODE_ENV === "production") return;
  Object.values(SHOT_REGISTRY).forEach((shot) => {
    const valid = (value: number[]) => value.length === 3 && value.every(Number.isFinite);
    if (!valid(shot.framing.position) || !valid(shot.framing.lookAt))
      console.warn(`Malformed framing for ${shot.id}`);
    if (!(shot.transition.duration > 0)) console.warn(`Invalid transition for ${shot.id}`);
    if (shot.id === "drawer" && shot.route !== null)
      console.warn("Drawer shot must not own a route");
  });
}
