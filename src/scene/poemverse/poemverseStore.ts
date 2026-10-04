import { useSyncExternalStore } from "react";

export type PoemversePhase = "idle" | "launching" | "rising" | "landed" | "returning";

export interface PoemverseScreenPoint {
  x: number;
  y: number;
  size: number;
}

export interface PoemverseSnapshot {
  phase: PoemversePhase;
  launchId: number;
  origin: PoemverseScreenPoint | null;
  isRetained: boolean;
}

export interface PoemverseHover {
  slug: string;
  title: string;
  constellation: string;
  isPinned: boolean;
  x: number;
  y: number;
}

export interface PoemverseInkRequest {
  slug: string;
  points: Float32Array;
  count: number;
  spacing: number;
}

export interface PoemverseStore {
  readonly phase: PoemversePhase;
  readonly handoff: PoemverseScreenPoint | null;
  readonly flightId: number;
  readonly sceneReady: boolean;
  getSnapshot: () => PoemverseSnapshot;
  subscribe: (listener: () => void) => () => void;
  launch: (origin: PoemverseScreenPoint) => void;
  beginRise: (handoff: PoemverseScreenPoint) => void;
  land: () => void;
  leave: () => void;
  release: () => void;
  settle: () => void;
  setSceneReady: (ready: boolean) => void;
  getHover: () => PoemverseHover | null;
  subscribeHover: (listener: () => void) => () => void;
  setHover: (hover: PoemverseHover | null) => void;
  requestInk: (request: PoemverseInkRequest) => void;
  takeInkRequest: () => PoemverseInkRequest | null;
}

export function createPoemverseStore(): PoemverseStore {
  let snapshot: PoemverseSnapshot = {
    phase: "idle",
    launchId: 0,
    origin: null,
    isRetained: false,
  };
  let handoff: PoemverseScreenPoint | null = null;
  let flightId = 0;
  let sceneReady = false;
  let hover: PoemverseHover | null = null;
  let inkRequest: PoemverseInkRequest | null = null;
  const listeners = new Set<() => void>();
  const hoverListeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());
  const update = (changes: Partial<PoemverseSnapshot>) => {
    snapshot = { ...snapshot, ...changes };
    notify();
  };

  return {
    get phase() {
      return snapshot.phase;
    },
    get handoff() {
      return handoff;
    },
    get flightId() {
      return flightId;
    },
    get sceneReady() {
      return sceneReady;
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    launch(origin) {
      if (snapshot.phase !== "idle") return;
      handoff = null;
      update({
        phase: "launching",
        launchId: snapshot.launchId + 1,
        origin,
        isRetained: true,
      });
    },
    beginRise(point) {
      if (snapshot.phase !== "launching") return;
      handoff = point;
      flightId += 1;
      update({ phase: "rising" });
    },
    land() {
      if (snapshot.phase === "rising") update({ phase: "landed" });
    },
    leave() {
      if (snapshot.phase !== "idle" && snapshot.phase !== "returning")
        update({ phase: "returning" });
    },
    release() {
      const isActive = snapshot.phase !== "idle" && snapshot.phase !== "returning";
      if (!snapshot.isRetained && !isActive) return;
      update({ isRetained: false, origin: null, phase: isActive ? "returning" : snapshot.phase });
    },
    settle() {
      if (snapshot.phase === "returning") update({ phase: "idle" });
    },
    setSceneReady(ready) {
      if (sceneReady === ready) return;
      sceneReady = ready;
      notify();
    },
    getHover: () => hover,
    subscribeHover(listener) {
      hoverListeners.add(listener);
      return () => {
        hoverListeners.delete(listener);
      };
    },
    setHover(next) {
      if (hover === next || (hover === null && next === null)) return;
      hover = next;
      hoverListeners.forEach((listener) => listener());
    },
    requestInk(request) {
      if (snapshot.phase !== "landed") return;
      inkRequest = request;
      notify();
    },
    takeInkRequest() {
      const request = inkRequest;
      inkRequest = null;
      return request;
    },
  };
}

export function usePoemverseHover(store: PoemverseStore) {
  return useSyncExternalStore(store.subscribeHover, store.getHover, store.getHover);
}

export function usePoemverse(store: PoemverseStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
