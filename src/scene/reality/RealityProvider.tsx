"use client";

import { createContext, useContext, useRef, useState, useSyncExternalStore } from "react";

// The Reality registry. Cycling and persistence are driven entirely off this
// list, so adding a future style (e.g. neon) only requires registering it
// here — see REALITY_ORDER usage in RealityStore.next().
export interface Reality {
  id: string;
  label: string;
}

export const REALITIES: readonly Reality[] = [
  { id: "cinematic", label: "Cinematic" },
  { id: "blueprint", label: "Blueprint" },
];

const REALITY_STORAGE_KEY = "denkos-reality";

function readStoredReality(stored: unknown): Reality {
  return REALITIES.find((reality) => reality.id === stored) ?? REALITIES[0];
}

export class RealityStore {
  private listeners = new Set<() => void>();
  private snapshot: Reality;
  constructor(stored: unknown = null) {
    this.snapshot = readStoredReality(stored);
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private commit(reality: Reality) {
    this.snapshot = reality;
    this.listeners.forEach((listener) => listener());
    try {
      sessionStorage.setItem(REALITY_STORAGE_KEY, reality.id);
    } catch {}
  }
  next() {
    const index = REALITIES.findIndex((reality) => reality.id === this.snapshot.id);
    this.commit(REALITIES[(index + 1) % REALITIES.length]);
  }
}

const RealityContext = createContext<RealityStore | null>(null);

export function RealityProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(
    () =>
      new RealityStore(
        typeof window === "undefined" ? null : sessionStorage.getItem(REALITY_STORAGE_KEY),
      ),
  );
  return <RealityContext.Provider value={store}>{children}</RealityContext.Provider>;
}

export function useRealityStore() {
  const store = useContext(RealityContext);
  if (!store) throw new Error("useRealityStore must be used within RealityProvider.");
  return store;
}

export function useActiveReality<T>(selector: (reality: Reality) => T): T {
  const store = useRealityStore(),
    selectorRef = useRef(selector);
  selectorRef.current = selector;
  return useSyncExternalStore(
    store.subscribe,
    () => selectorRef.current(store.getSnapshot()),
    () => selectorRef.current(store.getSnapshot()),
  );
}
