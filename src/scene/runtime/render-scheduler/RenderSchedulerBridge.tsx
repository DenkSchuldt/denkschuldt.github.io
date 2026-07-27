"use client";

import { useEffect } from "react";

import { useFrame, useThree } from "@react-three/fiber";

import { useRenderSchedulerStore } from "./RenderSchedulerProvider";

import type { CinematicEngine } from "@denk/cinematic-navigation";

export function RenderSchedulerBridge() {
  const store = useRenderSchedulerStore(),
    invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    store.setInvalidator(invalidate);
    store.invalidate("canvas", "initial-render");
    const visibility = () => store.setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      store.setInvalidator(null);
    };
  }, [invalidate, store]);
  useFrame(() => store.frame());
  return null;
}
export function RenderSchedulerNavigationAdapter({ engine }: { engine: CinematicEngine }) {
  const store = useRenderSchedulerStore();
  useEffect(() => {
    let release: (() => void) | null = null,
      safety: ReturnType<typeof setTimeout> | null = null;
    const update = () => {
      const transitioning = engine.getState().transitionStatus === "transitioning";
      if (transitioning && !release) {
        release = store.acquireFor(
          {
            ownerId: "navigation",
            reason: "navigation-transition",
            priority: 3,
            metadata: { contract: "engine-transition-status" },
          },
          15000,
        );
        safety = setTimeout(() => {
          if (release) {
            store.warn("navigation transition lease exceeded 15s safety timeout");
            release();
            release = null;
          }
        }, 15050);
      } else if (!transitioning && release) {
        release();
        release = null;
        if (safety) clearTimeout(safety);
        safety = null;
        store.invalidate("navigation", "camera-settle");
      }
    };
    update();
    const unsubscribe = engine.subscribe(update);
    return () => {
      unsubscribe();
      release?.();
      if (safety) clearTimeout(safety);
    };
  }, [engine, store]);
  return null;
}
