"use client";

import * as THREE from "three";

import { withSceneBasePath } from "../camera/sceneRoutes";
import { useRenderingQuality } from "../rendering/quality";
import { useOwnedTexture } from "../runtime/working-set";

interface SurfaceTextureOptions {
  name: "walnut" | "floor";
  repeat: readonly [number, number];
}

const SURFACES: Record<SurfaceTextureOptions["name"], SurfaceTextureOptions> = {
  // Extruded desk UVs are in world units; the floor plane uses normalized UVs.
  walnut: { name: "walnut", repeat: [1 / 3, 1] },
  floor: { name: "floor", repeat: [6, 15] },
};

function configureSurface(options: SurfaceTextureOptions, color: boolean) {
  return (texture: THREE.Texture) => {
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...options.repeat);
    // Mipmaps and a modest anisotropy keep the fine grain stable at grazing angles.
    texture.anisotropy = 4;
  };
}

const CONFIGURATIONS = {
  walnut: {
    color: configureSurface(SURFACES.walnut, true),
    surface: configureSurface(SURFACES.walnut, false),
  },
  floor: {
    color: configureSurface(SURFACES.floor, true),
    surface: configureSurface(SURFACES.floor, false),
  },
};

export function useSurfaceTextures(name: SurfaceTextureOptions["name"]) {
  const detailed = useRenderingQuality(
    ({ profile }) => profile.id !== "mobile" && profile.id !== "fallback",
  );
  const map = useOwnedTexture(
    withSceneBasePath(`/materials/${name}-color.webp`),
    `surface:${name}:color`,
    true,
    CONFIGURATIONS[name].color,
  );
  // Mobile keeps the same grain and scale, without extra roughness/bump sampling or downloads.
  const surface = useOwnedTexture(
    withSceneBasePath(`/materials/${name}-surface.webp`),
    `surface:${name}:detail`,
    detailed,
    CONFIGURATIONS[name].surface,
  );
  return { map, surface };
}
