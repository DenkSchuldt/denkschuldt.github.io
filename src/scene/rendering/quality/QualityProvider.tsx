"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { detectPreliminaryCapabilities } from "./capabilityDetection";
import { createAdaptiveState } from "./adaptiveController";
import { getRenderingQualityProfile } from "./profiles";
import {
  parseDiagnosticQualityOverrides,
  parseQualityPreference,
  QUALITY_PREFERENCE_STORAGE_KEY,
  resolveFeatureFlags,
  selectInitialQuality,
  preserveAdaptiveSelection,
} from "./qualitySelection";

import type { AdaptiveDecision } from "./adaptiveController";
import type {
  AdaptiveState,
  DiagnosticQualityOverrides,
  PreliminaryCapabilities,
  QualityPreference,
  QualitySelection,
  RenderingCapabilitySnapshot,
} from "./types";

export interface QualitySnapshot {
  preference: QualityPreference;
  selection: QualitySelection;
  profile: ReturnType<typeof getRenderingQualityProfile>;
  preliminary: PreliminaryCapabilities;
  capabilities: RenderingCapabilitySnapshot | null;
  diagnostics: DiagnosticQualityOverrides;
  features: ReturnType<typeof resolveFeatureFlags>;
  adaptive: AdaptiveState;
  revision: number;
}

export class RenderingQualityStore {
  private listeners = new Set<() => void>();
  private snapshot: QualitySnapshot;
  constructor(search = "", storedPreference: unknown = "auto") {
    const preliminary = detectPreliminaryCapabilities(),
      diagnostics = parseDiagnosticQualityOverrides(search),
      preference = parseQualityPreference(storedPreference);
    const selection = selectInitialQuality({ diagnostics, preference, capabilities: preliminary }),
      profile = getRenderingQualityProfile(selection.profileId);
    const requested =
      diagnostics.dpr ?? Math.min(preliminary.devicePixelRatio, profile.renderer.dprMax);
    const dpr = Math.max(profile.renderer.dprMin, Math.min(profile.renderer.dprMax, requested));
    this.snapshot = {
      preference,
      selection,
      profile,
      preliminary,
      capabilities: null,
      diagnostics,
      features: resolveFeatureFlags(profile.id, diagnostics),
      adaptive: createAdaptiveState(
        dpr,
        typeof performance === "undefined" ? 0 : performance.now(),
      ),
      revision: 0,
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private commit(patch: Partial<QualitySnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch, revision: this.snapshot.revision + 1 };
    this.listeners.forEach((listener) => listener());
  }
  setPreference(preference: QualityPreference) {
    const selection = selectInitialQuality({
        diagnostics: this.snapshot.diagnostics,
        preference,
        capabilities: this.snapshot.preliminary,
      }),
      profile = getRenderingQualityProfile(selection.profileId);
    const requested =
      this.snapshot.diagnostics.dpr ??
      Math.min(this.snapshot.preliminary.devicePixelRatio, profile.renderer.dprMax);
    const dpr = Math.max(profile.renderer.dprMin, Math.min(profile.renderer.dprMax, requested));
    this.commit({
      preference,
      selection,
      profile,
      features: resolveFeatureFlags(profile.id, this.snapshot.diagnostics),
      adaptive: createAdaptiveState(dpr, performance.now()),
    });
    try {
      localStorage.setItem(QUALITY_PREFERENCE_STORAGE_KEY, preference);
    } catch {}
  }
  setCapabilities(capabilities: RenderingCapabilitySnapshot) {
    if (!this.snapshot.capabilities) this.commit({ capabilities });
  }
  applyAdaptiveDecision({ state: adaptive, nextProfileId }: AdaptiveDecision) {
    if (!nextProfileId) {
      this.commit({ adaptive });
      return;
    }
    const profile = getRenderingQualityProfile(nextProfileId);
    this.commit({
      adaptive,
      profile,
      features: resolveFeatureFlags(profile.id, this.snapshot.diagnostics),
      selection: {
        ...this.snapshot.selection,
        profileId: profile.id,
        reason: "adaptive-performance",
      },
    });
  }
  resetViewport(preliminary: PreliminaryCapabilities) {
    const selection = preserveAdaptiveSelection(
        this.snapshot.selection,
        selectInitialQuality({
          diagnostics: this.snapshot.diagnostics,
          preference: this.snapshot.preference,
          capabilities: preliminary,
        }),
      ),
      profile = getRenderingQualityProfile(selection.profileId);
    const dpr = Math.max(
      profile.renderer.dprMin,
      Math.min(
        profile.renderer.dprMax,
        preliminary.devicePixelRatio,
        this.snapshot.adaptive.currentDpr,
      ),
    );
    this.commit({
      preliminary,
      selection,
      profile,
      features: resolveFeatureFlags(profile.id, this.snapshot.diagnostics),
      adaptive: { ...createAdaptiveState(dpr, performance.now()), lastReason: "viewport-reset" },
    });
  }
  export() {
    return {
      ...this.snapshot,
      diagnostics: {
        ...this.snapshot.diagnostics,
        disabled: [...this.snapshot.diagnostics.disabled],
      },
    };
  }
}

const QualityContext = createContext<RenderingQualityStore | null>(null);
export function QualityProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(
    () =>
      new RenderingQualityStore(
        typeof window === "undefined" ? "" : window.location.search,
        typeof window === "undefined"
          ? "auto"
          : localStorage.getItem(QUALITY_PREFERENCE_STORAGE_KEY),
      ),
  );
  return <QualityContext.Provider value={store}>{children}</QualityContext.Provider>;
}
export function useQualityStore() {
  const value = useContext(QualityContext);
  if (!value) throw new Error("useQualityStore must be used within QualityProvider.");
  return value;
}
export function useRenderingQuality<T>(selector: (snapshot: QualitySnapshot) => T): T {
  const store = useQualityStore(),
    selectorRef = useRef(selector);
  selectorRef.current = selector;
  return useSyncExternalStore(
    store.subscribe,
    () => selectorRef.current(store.getSnapshot()),
    () => selectorRef.current(store.getSnapshot()),
  );
}

export function QualityPreferenceControl() {
  if (process.env.NODE_ENV === "production") return null;
  return <QualityPreferenceControlDevelopment />;
}

function QualityPreferenceControlDevelopment() {
  const store = useQualityStore(),
    preference = useRenderingQuality((state) => state.preference);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <label className="quality-preference-control">
      <span>Quality</span>
      <select
        aria-label="Rendering quality"
        value={preference}
        onChange={(event) => store.setPreference(parseQualityPreference(event.target.value))}
      >
        <option value="auto">Auto</option>
        <option value="ultra">Ultra</option>
        <option value="high">High</option>
        <option value="balanced">Balanced</option>
        <option value="mobile">Mobile</option>
      </select>
    </label>
  );
}
