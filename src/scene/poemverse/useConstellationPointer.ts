"use client";

import { useEffect } from "react";

import { useThree } from "@react-three/fiber";

import { useRenderDemand } from "../runtime/render-scheduler";
import { CONSTELLATION_SUMMARIES } from "./constellationLayout";

import type { PoemverseStore } from "./poemverseStore";
import type { SkyStage } from "./skyStage";

interface ConstellationPointerOptions {
  store: PoemverseStore;
  skyStage: SkyStage;
  onSelectPoem: (slug: string) => void;
}

export function useConstellationPointer({
  store,
  skyStage,
  onSelectPoem,
}: ConstellationPointerOptions) {
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  const renderDemand = useRenderDemand("poemverse-pointer");

  useEffect(() => {
    const clearHover = () => {
      if (skyStage.hover(-1)) renderDemand.invalidate("pointer-interaction");
      store.setHover(null);
      canvas.style.cursor = "";
    };

    const handlePointerMove = (event: PointerEvent) => {
      const sky = skyStage.current;
      if (store.phase !== "landed" || !sky) {
        clearHover();
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const index = sky.pick(
        camera,
        { x: event.clientX, y: event.clientY },
        bounds,
        skyStage.sinceLanding,
      );
      if (index < 0) {
        clearHover();
        return;
      }
      if (!skyStage.hover(index)) return;
      const star = sky.star(index);
      const position = sky.screenPosition(camera, index, bounds);
      store.setHover({
        slug: star.slug,
        title: star.title,
        constellation: CONSTELLATION_SUMMARIES[star.constellationIndex]?.name ?? "",
        x: position.x,
        y: position.y,
      });
      canvas.style.cursor = "pointer";
      renderDemand.invalidate("pointer-interaction");
    };

    const handleClick = () => {
      const sky = skyStage.current;
      const index = skyStage.hovered;
      if (store.phase !== "landed" || !sky || index < 0) return;
      const slug = sky.star(index).slug;
      clearHover();
      onSelectPoem(slug);
    };

    const handlePhaseChange = () => {
      if (store.phase !== "landed") clearHover();
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerMove);
    canvas.addEventListener("pointerleave", clearHover);
    canvas.addEventListener("click", handleClick);
    const unsubscribe = store.subscribe(handlePhaseChange);
    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerMove);
      canvas.removeEventListener("pointerleave", clearHover);
      canvas.removeEventListener("click", handleClick);
      unsubscribe();
      clearHover();
    };
  }, [camera, canvas, onSelectPoem, renderDemand, skyStage, store]);
}
