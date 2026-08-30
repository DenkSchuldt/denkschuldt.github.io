"use client";

import { useEffect } from "react";

import { useRuntimeTask } from "@denk/cinematic-navigation/react";

import {
  measurePerformanceTask,
  performanceDiagnostics,
} from "../diagnostics/performance/performanceStore";
import { useRenderDemand } from "../runtime/render-scheduler";

import type { RuntimeTaskRegistration } from "@denk/cinematic-navigation";
import type { RenderReason } from "../runtime/render-scheduler";

export function useMeasuredRuntimeTask(task: RuntimeTaskRegistration) {
  useRuntimeTask({
    ...task,
    update: (context) => {
      if (!performanceDiagnostics.switches.nonCameraTasks) return;
      if (task.id === "task:coffee-steam" && !performanceDiagnostics.switches.coffeeSteam) return;
      return measurePerformanceTask(task.id, () => task.update(context));
    },
  });
}

export function useFeatureSettleLease(
  ownerId: string,
  active: boolean,
  reason: RenderReason,
  durationMs = 1400,
) {
  const demand = useRenderDemand(ownerId);
  useEffect(() => {
    demand.invalidate(reason);
    if (active) return demand.acquireFor({ reason, priority: 2 }, durationMs);
  }, [active, demand, durationMs, reason]);
}
