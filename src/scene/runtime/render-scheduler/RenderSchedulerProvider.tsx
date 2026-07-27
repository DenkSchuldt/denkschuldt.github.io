"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { RenderSchedulerStore } from "./renderSchedulerStore";

import type { PropsWithChildren } from "react";
import type { RenderLeaseRequest, RenderReason, RenderSchedulerSnapshot } from "./types";

const Context = createContext<RenderSchedulerStore | null>(null);
export function RenderSchedulerProvider({ children }: PropsWithChildren) {
  const store = useMemo(() => new RenderSchedulerStore(), []);
  useEffect(() => {
    store.configure(window.location.search);
    return () => store.dispose();
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useRenderSchedulerStore() {
  const store = useContext(Context);
  if (!store)
    throw new Error("useRenderSchedulerStore must be used inside RenderSchedulerProvider");
  return store;
}
export function useRenderScheduler<T>(selector: (snapshot: RenderSchedulerSnapshot) => T) {
  const store = useRenderSchedulerStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(store.getSnapshot()),
  );
}
export function useRenderDemand(ownerId: string) {
  const store = useRenderSchedulerStore(),
    releases = useRef(new Set<() => void>());
  useEffect(
    () => () => {
      releases.current.forEach((release) => release());
      releases.current.clear();
      store.releaseOwner(ownerId);
    },
    [ownerId, store],
  );
  return useMemo(
    () => ({
      invalidate: (reason: RenderReason) => store.invalidate(ownerId, reason),
      acquireContinuous: (request: Omit<RenderLeaseRequest, "ownerId">) => {
        const release = store.acquireContinuous({ ...request, ownerId });
        releases.current.add(release);
        return () => {
          release();
          releases.current.delete(release);
        };
      },
      acquireFor: (request: Omit<RenderLeaseRequest, "ownerId">, durationMs: number) => {
        const release = store.acquireFor({ ...request, ownerId }, durationMs);
        releases.current.add(release);
        return () => {
          release();
          releases.current.delete(release);
        };
      },
      acquirePeriodic: (request: Omit<RenderLeaseRequest, "ownerId">) => {
        const release = store.acquirePeriodic({ ...request, ownerId });
        releases.current.add(release);
        return () => {
          release();
          releases.current.delete(release);
        };
      },
    }),
    [ownerId, store],
  );
}
