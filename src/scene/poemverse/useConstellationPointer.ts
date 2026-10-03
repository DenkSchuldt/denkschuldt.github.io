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

const MOUSE_PICK_RADIUS_PX = 26;
const TOUCH_PICK_RADIUS_PX = 38;

export function useConstellationPointer({
  store,
  skyStage,
  onSelectPoem,
}: ConstellationPointerOptions) {
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  const renderDemand = useRenderDemand("poemverse-pointer");

  useEffect(() => {
    let lastPointerType = "mouse";

    const clearSelection = () => {
      if (skyStage.hover(-1)) renderDemand.invalidate("pointer-interaction");
      store.setHover(null);
      canvas.style.cursor = "";
    };

    const pickStar = (event: PointerEvent | MouseEvent, radius: number) => {
      const sky = skyStage.current;
      if (store.phase !== "landed" || !sky) return -1;
      return sky.pick(
        camera,
        { x: event.clientX, y: event.clientY },
        canvas.getBoundingClientRect(),
        skyStage.sinceLanding,
        radius,
      );
    };

    const selectStar = (index: number, isPinned: boolean) => {
      const sky = skyStage.current;
      if (!sky || !skyStage.hover(index)) return;
      const star = sky.star(index);
      const position = sky.screenPosition(camera, index, canvas.getBoundingClientRect());
      store.setHover({
        slug: star.slug,
        title: star.title,
        constellation: CONSTELLATION_SUMMARIES[star.constellationIndex]?.name ?? "",
        isPinned,
        x: position.x,
        y: position.y,
      });
      renderDemand.invalidate("pointer-interaction");
    };

    const handlePointerDown = (event: PointerEvent) => {
      lastPointerType = event.pointerType;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const index = pickStar(event, MOUSE_PICK_RADIUS_PX);
      if (index < 0) {
        clearSelection();
        return;
      }
      selectStar(index, false);
      canvas.style.cursor = "pointer";
    };

    const handleClick = (event: MouseEvent) => {
      const isTouch = lastPointerType !== "mouse";
      const picked = pickStar(event, isTouch ? TOUCH_PICK_RADIUS_PX : MOUSE_PICK_RADIUS_PX);
      const index = !isTouch && skyStage.hovered >= 0 ? skyStage.hovered : picked;
      if (index < 0) {
        clearSelection();
        return;
      }
      const sky = skyStage.current;
      if (!sky) return;
      if (isTouch && skyStage.hovered !== index) {
        selectStar(index, true);
        return;
      }
      const slug = sky.star(index).slug;
      clearSelection();
      onSelectPoem(slug);
    };

    const handlePointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") clearSelection();
    };

    const handlePhaseChange = () => {
      if (store.phase !== "landed") clearSelection();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("click", handleClick);
    const unsubscribe = store.subscribe(handlePhaseChange);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("click", handleClick);
      unsubscribe();
      clearSelection();
    };
  }, [camera, canvas, onSelectPoem, renderDemand, skyStage, store]);
}
