"use client";

import { useEffect, useMemo } from "react";

import { useThree } from "@react-three/fiber";

import { useRenderDemand } from "../runtime/render-scheduler";
import { useWorkingSetStore } from "../runtime/working-set";
import { PoemStarRig } from "./poemStarRig";
import { PoemverseCeiling } from "./poemverseCeiling";
import { SkyStage } from "./skyStage";
import { StardustEmitter } from "./stardust";
import { useConstellationPointer } from "./useConstellationPointer";
import { usePoemverseDirector } from "./usePoemverseDirector";

import type { CameraGaze } from "../camera/cameraGaze";
import type { PoemverseStore } from "./poemverseStore";

interface PoemverseProps {
  store: PoemverseStore;
  gaze: CameraGaze;
  featuredSlug: string | null;
  reducedMotion: boolean;
  onSelectPoem: (slug: string) => void;
}

export function Poemverse({
  store,
  gaze,
  featuredSlug,
  reducedMotion,
  onSelectPoem,
}: PoemverseProps) {
  const workingSet = useWorkingSetStore();
  const renderDemand = useRenderDemand("poemverse-assets");
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const star = useMemo(() => new PoemStarRig(), []);
  const stardust = useMemo(() => new StardustEmitter(), []);
  const skyStage = useMemo(() => new SkyStage(), []);
  const ceiling = useMemo(
    () => new PoemverseCeiling(() => renderDemand.invalidate("asset-ready")),
    [renderDemand],
  );

  usePoemverseDirector({
    store,
    gaze,
    star,
    ceiling,
    stardust,
    skyStage,
    featuredSlug,
    reducedMotion,
  });
  useConstellationPointer({ store, skyStage, onSelectPoem });

  useEffect(() => () => star.dispose(), [star]);
  useEffect(() => () => stardust.dispose(), [stardust]);
  useEffect(() => () => ceiling.dispose(), [ceiling]);
  useEffect(() => () => skyStage.dispose(), [skyStage]);

  useEffect(() => {
    workingSet.resourceEvent("prepare-end", "poemverse-scene", {
      status: "resident",
      cache: "owned",
      detail: "ceiling, constellations, star and stardust created on demand",
    });
    return () =>
      workingSet.resourceEvent("release", "poemverse-scene", {
        status: "released",
        cache: "owned",
        detail: "Poemverse unmounted; owned geometries, materials and textures disposed",
        evidence: ["unmounted", "references-released"],
      });
  }, [workingSet]);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (cancelled) return;
      store.setSceneReady(true);
      renderDemand.invalidate("asset-ready");
    };
    gl.compileAsync(scene, camera).then(markReady, (error: unknown) => {
      console.warn("Poemverse shader warm-up failed; continuing with lazy compilation", error);
      markReady();
    });
    return () => {
      cancelled = true;
      store.setSceneReady(false);
    };
  }, [camera, gl, renderDemand, scene, store]);

  return (
    <group name="Poemverse">
      <primitive object={ceiling.group} />
      <primitive object={skyStage.root} />
      <primitive object={star.group} />
      <primitive object={stardust.points} />
    </group>
  );
}
