import type { QualityProfileId } from "../../rendering/quality";
import type { SceneId } from "../../camera/navigationTypes";
import type { DestinationWorkingSetDefinition, WorkingSetResourceDefinition } from "./types";

const retain = (
  ultra: number,
  high: number,
  balanced: number,
  mobile: number,
  fallback: number,
): Record<QualityProfileId, number> => ({ ultra, high, balanced, mobile, fallback });
const resource = (
  destination: SceneId,
  id: string,
  classification: WorkingSetResourceDefinition["class"],
  owner: string,
  options: Partial<WorkingSetResourceDefinition> = {},
): WorkingSetResourceDefinition => ({
  id,
  destination,
  class: classification,
  owner,
  shared: false,
  preparationRequired: false,
  failureFallback: "ambient representation",
  ...options,
});

export const WORKING_SET_DEFINITIONS: Readonly<Record<SceneId, DestinationWorkingSetDefinition>> = {
  opening: {
    id: "opening",
    preparationLeadMs: 0,
    retentionMs: retain(Infinity, Infinity, Infinity, Infinity, Infinity),
    speculative: false,
    resources: [
      resource("opening", "room-structure", "persistent-essential", "Scene", { shared: true }),
    ],
  },
  about: {
    id: "about",
    preparationLeadMs: 0,
    retentionMs: retain(Infinity, Infinity, Infinity, Infinity, Infinity),
    speculative: false,
    resources: [
      resource("about", "desk-ambient", "ambient", "Scene", { shared: true }),
      resource("about", "about-overlay", "active-only", "AboutOverlay"),
    ],
  },
  certificates: {
    id: "certificates",
    preparationLeadMs: 900,
    retentionMs: retain(30000, 20000, 12000, 5000, 0),
    speculative: true,
    resources: [
      resource("certificates", "certificate-shelf", "ambient", "Shelf", { shared: true }),
      resource("certificates", "certificate-thumbnails", "preparable", "CertificateGallery", {
        preparationRequired: true,
        estimatedDecodedBytes: Math.round((14 * 480 * 352 * 4 * 4) / 3),
      }),
      resource(
        "certificates",
        "certificate-original",
        "overlay-only",
        "CertificateGalleryOverlay",
        { preparationRequired: true },
      ),
    ],
  },
  projects: {
    id: "projects",
    preparationLeadMs: 300,
    retentionMs: retain(10000, 8000, 5000, 1500, 0),
    speculative: true,
    resources: [
      resource("projects", "laptop-body", "ambient", "Laptop", { shared: true }),
      resource("projects", "projects-overlay", "active-only", "ProjectsOverlay"),
    ],
  },
  wall: {
    id: "wall",
    preparationLeadMs: 1400,
    retentionMs: retain(Infinity, Infinity, Infinity, Infinity, Infinity),
    speculative: true,
    resources: [
      resource("wall", "wall-frames", "ambient", "Posters", { shared: true }),
      resource("wall", "wall-images", "shared-cache", "PosterImages", {
        shared: true,
        preparationRequired: true,
      }),
    ],
  },
  phone: {
    id: "phone",
    preparationLeadMs: 700,
    retentionMs: retain(20000, 12000, 7000, 2500, 0),
    speculative: true,
    resources: [
      resource("phone", "phone-body", "ambient", "Phone", { shared: true }),
      resource("phone", "phone-screen", "preparable", "PhoneScreen", {
        preparationRequired: true,
      }),
      resource("phone", "phone-local-light", "active-only", "PhoneScreen"),
      resource("phone", "phone-overlay", "active-only", "PhoneOverlay"),
    ],
  },
  poems: {
    id: "poems",
    preparationLeadMs: 900,
    retentionMs: retain(30000, 20000, 10000, 4000, 0),
    speculative: true,
    resources: [
      resource("poems", "notebook-body", "ambient", "PoemsPortfolio", { shared: true }),
      resource("poems", "poem-manifest", "shared-cache", "usePoems", {
        shared: true,
        preparationRequired: true,
      }),
      resource("poems", "pinscher-photo", "preparable", "PortfolioPhoto", {
        preparationRequired: true,
        estimatedDecodedBytes: Math.round((567 * 612 * 4 * 4) / 3),
      }),
      resource("poems", "poem-preview-texture", "active-only", "PortfolioPoemPreview", {
        estimatedDecodedBytes: Math.round((1024 * 1160 * 4 * 4) / 3),
      }),
      resource("poems", "poem-markdown", "overlay-only", "usePoems", { preparationRequired: true }),
      resource("poems", "poem-reader-chunk", "overlay-only", "PoemReader", {
        preparationRequired: true,
      }),
    ],
  },
  drawer: {
    id: "drawer",
    preparationLeadMs: 0,
    retentionMs: retain(Infinity, Infinity, Infinity, Infinity, Infinity),
    speculative: false,
    resources: [resource("drawer", "drawer-geometry", "ambient", "Desk", { shared: true })],
  },
};

export const WORKING_SET_DESTINATIONS = Object.keys(WORKING_SET_DEFINITIONS) as SceneId[];
