"use client";

import { useEffect, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";

import { useRenderDemand, useRenderSchedulerStore } from "../../runtime/render-scheduler";

import { evaluateAdaptiveDpr } from "./adaptiveController";
import { captureRenderingCapabilities, detectPreliminaryCapabilities } from "./capabilityDetection";
import { ActiveFrameSamples } from "./frameSamples";
import { useQualityStore } from "./QualityProvider";

import type { FrameHealthSummary } from "./types";

interface QualityRuntimeBridgeProps {
  transitioning: boolean;
  overlayChanging: boolean;
}

export function QualityRuntimeBridge({
  transitioning,
  overlayChanging,
}: QualityRuntimeBridgeProps) {
  const store = useQualityStore();
  const scheduler = useRenderSchedulerStore();
  const { gl, setDpr, size } = useThree();
  const renderDemand = useRenderDemand("quality-runtime");
  const samples = useRef(new ActiveFrameSamples());
  const lastEvaluation = useRef(0);

  useEffect(() => {
    const snapshot = store.getSnapshot();
    store.setCapabilities(
      captureRenderingCapabilities(
        gl.getContext(),
        snapshot.preliminary,
        gl.getPixelRatio(),
        gl.domElement.width,
        gl.domElement.height,
        gl.capabilities.precision,
      ),
    );
    renderDemand.invalidate("quality-change");
  }, [gl, renderDemand, store]);

  useEffect(() => {
    samples.current.clear();
    store.resetViewport(detectPreliminaryCapabilities());
    setDpr(store.getSnapshot().adaptive.currentDpr);
    renderDemand.invalidate("resize");
  }, [size.width, size.height, renderDemand, setDpr, store]);

  useEffect(() => {
    const handleVisibility = () => samples.current.clear();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useFrame((_, delta) => {
    const now = performance.now();
    const snapshot = store.getSnapshot();
    const visible = document.visibilityState === "visible";
    const warmingUp = now < snapshot.adaptive.warmupUntil;
    samples.current.record({
      now,
      deltaMs: delta * 1000,
      continuous: scheduler.getSnapshot().continuousLeases.length > 0,
      visible,
      warmingUp,
    });
    if (!visible || now - lastEvaluation.current < 1000) return;
    lastEvaluation.current = now;
    const health: FrameHealthSummary = {
      ...samples.current.summarize(snapshot.profile.runtime.targetFrameMs),
      transitioning,
      visible,
      overlayChanging,
      warmingUp,
    };
    const result = evaluateAdaptiveDpr(snapshot.adaptive, {
      now,
      health,
      profile: snapshot.profile,
      autoMode: snapshot.preference === "auto" && !snapshot.selection.userForced,
      maximumDpr: Math.max(1, snapshot.preliminary.devicePixelRatio),
    });
    store.applyAdaptiveDecision(result);
    if (result.nextDpr !== null || result.nextProfileId !== null) {
      setDpr(store.getSnapshot().adaptive.currentDpr);
      samples.current.clear();
      renderDemand.invalidate("quality-change");
    }
  });
  return null;
}
