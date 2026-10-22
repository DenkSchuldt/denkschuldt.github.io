"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useActiveReality } from "../reality";
import { useRenderingQuality } from "../rendering/quality";
import { useRenderDemand } from "../runtime/render-scheduler";
import { useWorkingSetStore } from "../runtime/working-set/WorkingSetProvider";

import {
  createRoomReflectionPixels,
  MATERIAL_REFLECTIONS,
  materialReflectionsEnabled,
} from "./materialReflectionPolicy";
import { withReflectionRendererState } from "./withReflectionRendererState";

import type { ReactNode } from "react";

interface MaterialReflectionValue {
  envMap: THREE.Texture | null;
  envMapIntensity: number;
}

const NO_REFLECTIONS: MaterialReflectionValue = { envMap: null, envMapIntensity: 0 };
const MaterialReflectionContext = createContext<MaterialReflectionValue>(NO_REFLECTIONS);

export function MaterialReflectionsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const gl = useThree((state) => state.gl);
  const profile = useRenderingQuality((state) => state.profile.id);
  const blueprint = useActiveReality((reality) => reality.id === "blueprint");
  const workingSet = useWorkingSetStore();
  const demand = useRenderDemand("material-reflections");
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [contextVersion, setContextVersion] = useState(0);
  const active = materialReflectionsEnabled(profile, blueprint, enabled);
  const value = useMemo(
    () =>
      active && texture
        ? { envMap: texture, envMapIntensity: MATERIAL_REFLECTIONS.intensity }
        : NO_REFLECTIONS,
    [active, texture],
  );

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextRestored = () => {
      // Render-target contents cannot be reuploaded after context restoration.
      // Hide the stale atlas immediately and prepare this owner's replacement.
      setTexture(null);
      setContextVersion((version) => version + 1);
      demand.invalidate("quality-change");
    };
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    return () => canvas.removeEventListener("webglcontextrestored", handleContextRestored);
  }, [demand, gl]);

  useEffect(() => {
    if (!active) return;
    const resourceId = MATERIAL_REFLECTIONS.resourceId;
    workingSet.resourceEvent("prepare-start", resourceId, {
      status: "preparing",
      cache: "owned",
      detail: "Building one bounded procedural room-reflection atlas for selected materials",
    });
    let target: THREE.WebGLRenderTarget | null = null;
    let cancelled = false;
    // PMREM renders a temporary atlas. Schedule it once after the initial commit,
    // rather than adding that GPU work to the scene's effect setup.
    const cancelPreparation = scheduleReflectionPreparation(() => {
      if (cancelled) return;
      if (gl.getContext().isContextLost()) return;
      try {
        target = createMaterialReflectionTarget(gl);
        setTexture(target.texture);
        workingSet.resourceEvent("prepare-end", resourceId, {
          status: "resident",
          cache: "owned",
          detail:
            "64px PMREM; 688128 estimated atlas bytes; transient source and generator disposed",
        });
        demand.invalidate("asset-ready");
      } catch (error) {
        workingSet.resourceEvent("error", resourceId, {
          status: "error",
          cache: "owned",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    });
    return () => {
      cancelled = true;
      cancelPreparation();
      setTexture(null);
      target?.dispose();
      workingSet.resourceEvent(target ? "dispose" : "prepare-cancel", resourceId, {
        status: "released",
        cache: "owned",
        detail: target
          ? "Owned reflection target disposed; no global scene environment was changed"
          : "Scheduled reflection preparation cancelled before resource publication",
        evidence: target
          ? [
              "references-released",
              "texture-disposed",
              "browser-memory-unverified",
              "gpu-memory-unverified",
            ]
          : ["references-released"],
      });
      demand.invalidate("quality-change");
    };
  }, [active, contextVersion, demand, gl, workingSet]);

  return (
    <MaterialReflectionContext.Provider value={value}>
      {children}
    </MaterialReflectionContext.Provider>
  );
}

export function useMaterialReflections() {
  return useContext(MaterialReflectionContext);
}

export function useReflectedMaterial(original: THREE.MeshStandardMaterial) {
  const reflections = useMaterialReflections();
  // Each opted-in surface owns its clone; shared originals never acquire an envMap.
  const material = useMemo(() => original.clone(), [original]);

  useLayoutEffect(() => {
    const mapChanged = material.envMap !== reflections.envMap;
    // This is an owned Three.js GPU resource, not shared React state.
    // eslint-disable-next-line react-hooks/immutability
    material.envMap = reflections.envMap;
    material.envMapIntensity = reflections.envMapIntensity;
    if (mapChanged) material.needsUpdate = true;
  }, [material, reflections]);

  useEffect(
    () => () => {
      material.envMap = null;
      material.dispose();
    },
    [material],
  );
  return material;
}

function scheduleReflectionPreparation(prepare: () => void) {
  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(prepare, { timeout: 300 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(prepare, 0);
  return () => clearTimeout(handle);
}

function createMaterialReflectionTarget(gl: THREE.WebGLRenderer) {
  if (!gl.extensions.has("EXT_color_buffer_float")) {
    throw new Error(
      "Room reflections require a renderable half-float target; direct lighting retained.",
    );
  }
  const source = new THREE.DataTexture(
    createRoomReflectionPixels(),
    MATERIAL_REFLECTIONS.width,
    MATERIAL_REFLECTIONS.height,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  source.name = "procedural-room-reflection-source";
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.colorSpace = THREE.LinearSRGBColorSpace;
  source.needsUpdate = true;
  const owned: { generator: THREE.PMREMGenerator | null } = { generator: null };
  try {
    return withReflectionRendererState(gl, () => {
      owned.generator = new THREE.PMREMGenerator(gl);
      const target = owned.generator.fromEquirectangular(source);
      target.texture.name = "selected-material-room-reflections";
      return target;
    });
  } finally {
    source.dispose();
    owned.generator?.dispose();
  }
}
