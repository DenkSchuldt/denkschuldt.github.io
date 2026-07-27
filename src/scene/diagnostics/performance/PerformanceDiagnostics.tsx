"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useQualityStore, useRenderingQuality } from "../../rendering/quality";
import { useWorkingSet, useWorkingSetStore } from "../../runtime/working-set";
import { useRenderScheduler, useRenderSchedulerStore } from "../../runtime/render-scheduler";

import { performanceDiagnostics } from "./performanceStore";

import type { CinematicRuntime } from "@denk/cinematic-navigation";

export function MeasuredRuntimeFrameBridge({
  runtime,
  paused = false,
}: {
  runtime: CinematicRuntime;
  paused?: boolean;
}) {
  const workingSet = useWorkingSetStore();
  const lastMetrics = useRef(0);
  useFrame(({ clock }, delta) => {
    if (paused) return;
    performanceDiagnostics.measure("RuntimeFrameBridge", () =>
      runtime.update(delta, clock.elapsedTime),
    );
    if (clock.elapsedTime - lastMetrics.current >= 1) {
      lastMetrics.current = clock.elapsedTime;
      workingSet.setRuntimeMetrics(
        runtime.getScheduler().getActiveTaskCount(),
        workingSet.getSnapshot().raycastCandidates,
      );
    }
  });
  return null;
}

export function PerformanceProbe() {
  const { gl, scene } = useThree();
  const workingSet = useWorkingSetStore();
  const lastWorkingSetMetrics = useRef(0);
  useEffect(() => {
    if (!performanceDiagnostics.enabled) return;
    const previousAutoReset = gl.info.autoReset;
    gl.info.autoReset = false;
    const context = gl.getContext();
    const debug = context.getExtension("WEBGL_debug_renderer_info") as {
      UNMASKED_VENDOR_WEBGL: number;
      UNMASKED_RENDERER_WEBGL: number;
    } | null;
    const buffer = new THREE.Vector2();
    gl.getDrawingBufferSize(buffer);
    let shadowCasters = 0,
      receivers = 0,
      interactive = 0;
    scene.traverse((object) => {
      if ((object as THREE.Mesh).castShadow) shadowCasters++;
      if ((object as THREE.Mesh).receiveShadow) receivers++;
      const handlers = (
        object as THREE.Object3D & { __r3f?: { handlers?: Record<string, unknown> } }
      ).__r3f?.handlers;
      if (handlers && Object.keys(handlers).length) interactive++;
    });
    performanceDiagnostics.setEnvironment({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      viewport: { width: innerWidth, height: innerHeight },
      devicePixelRatio: window.devicePixelRatio,
      resolvedDpr: gl.getPixelRatio(),
      drawingBuffer: { width: buffer.x, height: buffer.y },
      webglVersion: context instanceof WebGL2RenderingContext ? 2 : 1,
      renderer: debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "not available",
      vendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : "not available",
      maxTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
      maxRenderbufferSize: context.getParameter(context.MAX_RENDERBUFFER_SIZE),
      maxTextureUnits: context.getParameter(context.MAX_TEXTURE_IMAGE_UNITS),
      precision: gl.capabilities.precision,
      maxAnisotropy: gl.capabilities.getMaxAnisotropy(),
      shadowMapType: gl.shadowMap.type,
      rendererInfoAutoResetBeforeDiagnostics: previousAutoReset,
      rendererInfoAutoResetDuringDiagnostics: gl.info.autoReset,
      shadowCasters,
      shadowReceivers: receivers,
      interactiveObjects: interactive,
    });
    const raycaster = THREE.Raycaster.prototype as THREE.Raycaster & {
      __portfolioOriginalIntersectObjects?: THREE.Raycaster["intersectObjects"];
    };
    if (!raycaster.__portfolioOriginalIntersectObjects) {
      const original = raycaster.intersectObjects;
      raycaster.__portfolioOriginalIntersectObjects = original;
      const measuredIntersect = function (
        this: THREE.Raycaster,
        objects: THREE.Object3D[],
        recursive = true,
        target: THREE.Intersection[] = [],
      ) {
        const start = performance.now(),
          before = target.length;
        const result = original.call(this, objects, recursive, target);
        performanceDiagnostics.pointer(
          performance.now() - start,
          objects.length,
          result.length - before,
        );
        return result;
      };
      raycaster.intersectObjects = measuredIntersect as THREE.Raycaster["intersectObjects"];
    }
    return () => {
      if (raycaster.__portfolioOriginalIntersectObjects) {
        raycaster.intersectObjects = raycaster.__portfolioOriginalIntersectObjects;
        delete raycaster.__portfolioOriginalIntersectObjects;
      }
      gl.info.autoReset = previousAutoReset;
    };
  }, [gl, scene]);
  useFrame(({ clock }, delta) => {
    if (!performanceDiagnostics.enabled) return;
    performanceDiagnostics.measure("PerformanceProbe", () => {
      const buffer = new THREE.Vector2();
      gl.getDrawingBufferSize(buffer);
      performanceDiagnostics.addFrame({
        timestamp: performance.now(),
        deltaMs: delta * 1000,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        points: gl.info.render.points,
        lines: gl.info.render.lines,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? null,
        drawingBufferWidth: buffer.x,
        drawingBufferHeight: buffer.y,
      });
      gl.info.reset();
      if (clock.elapsedTime - lastWorkingSetMetrics.current >= 1) {
        lastWorkingSetMetrics.current = clock.elapsedTime;
        let interactive = 0;
        scene.traverse((object) => {
          const handlers = (
            object as THREE.Object3D & { __r3f?: { handlers?: Record<string, unknown> } }
          ).__r3f?.handlers;
          if (handlers && Object.keys(handlers).length) interactive++;
        });
        workingSet.setRuntimeMetrics(workingSet.getSnapshot().activeRuntimeTasks, interactive);
      }
    });
  });
  return null;
}

const empty = () => 0;
export function PerformanceOverlay() {
  const qualityStore = useQualityStore();
  const quality = useRenderingQuality((state) => state);
  const workingSetStore = useWorkingSetStore();
  const workingSet = useWorkingSet((state) => state);
  const schedulerStore = useRenderSchedulerStore();
  const scheduler = useRenderScheduler((state) => state);
  const [mounted, setMounted] = useState(false);
  useSyncExternalStore(
    performanceDiagnostics.subscribe,
    () => performanceDiagnostics.version,
    empty,
  );
  useEffect(() => {
    setMounted(true);
    if (!performanceDiagnostics.enabled) return;
    window.__PORTFOLIO_PERF__ = {
      reset: () => performanceDiagnostics.reset(),
      label: (...args) => performanceDiagnostics.label(...args),
      mark: (name) => performanceDiagnostics.mark(name),
      invalidate: (reason) => performanceDiagnostics.invalidate(reason),
      summary: () => performanceDiagnostics.summary(),
      export: () => performanceDiagnostics.export(),
    };
    const timer = window.setInterval(() => performanceDiagnostics.emit(), 500);
    return () => {
      window.clearInterval(timer);
      delete window.__PORTFOLIO_PERF__;
    };
  }, []);
  if (!mounted || !performanceDiagnostics.enabled) return null;
  const summary = performanceDiagnostics.summary();
  const download = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            performance: performanceDiagnostics.export(),
            quality: qualityStore.export(),
            workingSet,
            renderScheduler: scheduler,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `portfolio-performance-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const qualitySummary = {
    profile: quality.profile.id,
    preference: quality.preference,
    reason: quality.selection.reason,
    currentDpr: quality.adaptive.currentDpr,
    targetDpr: quality.adaptive.targetDpr,
    pending: quality.adaptive.pending,
    cooldownUntil: quality.adaptive.cooldownUntil,
    health: quality.adaptive.health,
    features: quality.features,
    capabilities: quality.capabilities,
    history: quality.adaptive.history,
    warnings: quality.diagnostics.warnings,
  };
  return (
    <aside
      aria-label="Performance diagnostics"
      data-performance-summary={JSON.stringify(summary)}
      data-quality-summary={JSON.stringify(qualitySummary)}
      data-working-set-summary={JSON.stringify(workingSet)}
      data-render-scheduler-summary={JSON.stringify(scheduler)}
      style={{
        position: "fixed",
        zIndex: 100,
        right: 12,
        top: 12,
        width: 340,
        maxHeight: "calc(100vh - 24px)",
        overflow: "auto",
        padding: 12,
        border: "1px solid #ffffff2a",
        borderRadius: 10,
        background: "#080808e8",
        color: "#eee",
        font: "11px/1.45 ui-monospace,monospace",
      }}
    >
      <strong>Performance baseline</strong>
      <div>
        Profile: {quality.profile.label} ({quality.selection.reason})
      </div>
      <div>
        Preference: {quality.preference}; adaptive:{" "}
        {quality.selection.adaptiveAllowed && quality.preference === "auto" ? "on" : "off"}
      </div>
      <div>
        DPR current / target: {quality.adaptive.currentDpr} / {quality.adaptive.targetDpr}
      </div>
      <div>
        Buffer: {quality.capabilities?.drawingBufferWidth ?? "n/a"} ×{" "}
        {quality.capabilities?.drawingBufferHeight ?? "n/a"} (
        {quality.capabilities
          ? Math.round(
              (quality.capabilities.drawingBufferWidth * quality.capabilities.drawingBufferHeight) /
                10000,
            ) / 100
          : "n/a"}{" "}
        MP)
      </div>
      <div>
        Health median / p95: {quality.adaptive.health?.medianFrameMs.toFixed(2) ?? "n/a"} /{" "}
        {quality.adaptive.health?.p95FrameMs.toFixed(2) ?? "n/a"} ms
      </div>
      <div>Recent changes: {quality.adaptive.history.length}</div>
      <div>
        Working set: {workingSet.activeDestination}
        {workingSet.approachingDestination ? ` → ${workingSet.approachingDestination}` : ""}
      </div>
      <div>
        Resident / preparing / sleeping:{" "}
        {Object.values(workingSet.resources).filter(({ status }) => status === "resident").length} /{" "}
        {Object.values(workingSet.resources).filter(({ status }) => status === "preparing").length}{" "}
        / {Object.values(workingSet.resources).filter(({ status }) => status === "sleeping").length}
      </div>
      <div>
        Estimated decoded textures: {(workingSet.estimatedDecodedTextureBytes / 1048576).toFixed(1)}{" "}
        MiB (estimate)
      </div>
      <div>
        Pending releases / lifecycle events: {workingSet.pendingReleases} /{" "}
        {workingSet.events.length}
      </div>
      <div>
        Runtime tasks / raycast objects: {workingSet.activeRuntimeTasks ?? "n/a"} /{" "}
        {workingSet.raycastCandidates ?? "n/a"}
      </div>
      <div>
        Scheduler: {scheduler.mode}; frameloop: {scheduler.frameloop}
      </div>
      <div>
        Leases continuous / periodic: {scheduler.continuousLeases.length} /{" "}
        {scheduler.periodicLeases.length}
      </div>
      <div>
        Pending / last: {scheduler.pendingInvalidations} /{" "}
        {scheduler.lastInvalidationOwner ?? "n/a"}:{scheduler.lastInvalidationReason ?? "n/a"}
      </div>
      <div>
        Frames / unexplained idle: {scheduler.renderedFrames} / {scheduler.framesWhileIdle}
      </div>
      <div>
        Projection / DOF updates: {scheduler.projectionUpdates} / {scheduler.dofUpdates}
      </div>
      {quality.diagnostics.warnings.map((warning) => (
        <div key={warning} style={{ color: "#f0b36a" }}>
          {warning}
        </div>
      ))}
      <div>Scene: {performanceDiagnostics.scene}</div>
      <div>Frames: {summary.frames}</div>
      <div>
        FPS avg / 1%: {summary.averageFps.toFixed(1)} / {summary.onePercentLowFps.toFixed(1)}
      </div>
      <div>
        Frame avg / p95: {summary.averageFrameMs.toFixed(2)} / {summary.p95FrameMs.toFixed(2)} ms
      </div>
      <div>
        Calls / triangles: {summary.latestRenderer?.calls ?? "n/a"} /{" "}
        {summary.latestRenderer?.triangles ?? "n/a"}
      </div>
      <div>
        Textures / geometries / programs: {summary.latestRenderer?.textures ?? "n/a"} /{" "}
        {summary.latestRenderer?.geometries ?? "n/a"} / {summary.latestRenderer?.programs ?? "n/a"}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button type="button" onClick={() => performanceDiagnostics.reset()}>
          Reset
        </button>
        <button type="button" onClick={download}>
          Export JSON
        </button>
        <button type="button" onClick={() => workingSetStore.clearOwned()}>
          Clear owned
        </button>
        <button type="button" onClick={() => schedulerStore.clearExpired()}>
          Clear leases
        </button>
      </div>
    </aside>
  );
}
