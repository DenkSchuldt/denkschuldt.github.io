# Phase 2 — Migration notes

## Files and responsibilities

- `src/scene/rendering/quality/types.ts`: typed policy and diagnostics contracts.
- `profiles.ts`: the only profile numerical catalogue.
- `capabilityDetection.ts`: preliminary and immutable WebGL capability capture.
- `qualitySelection.ts`: persistence/override parsing, deterministic selection
  and resolved feature flags.
- `adaptiveController.ts`: pure bounded-DPR state machine.
- `QualityProvider.tsx`: external store, versioned preference and compact
  selector.
- `QualityRuntimeBridge.tsx`: frame observer, resize/visibility/transition gates
  and R3F `setDpr`.
- `Experience.tsx`: provider, profile-driven Canvas and small quality control.
- `Scene.tsx`: passes policy to rendering consumers only.
- `effects/CinematicEffects.tsx`: profile-driven composer/effects and cleanup.
- `lighting/Lighting.tsx`: profile-driven shadow allocations and explicit
  remounts for changed map sizes.
- `diagnostics/performance/PerformanceDiagnostics.tsx`: local quality state and
  history display/export.
- `app/globals.css`: unobtrusive quality selector styling.
- `tests/rendering-quality.test.mjs`: deterministic policy/controller coverage.

## Redirected constants

Canvas DPR, antialias, power preference, global shadow flag, both realtime
shadow sizes, ContactShadows parameters, composer enablement, AO, DOF, bloom,
grading and vignette now resolve through the active profile. Ultra contains the
former production values. Camera, navigation, light composition and material
constants remain in their existing owners because they are not generic quality
budgets.

## Compatibility and lifecycle

- The Canvas and persistent world are not recreated by adaptive changes.
- DPR uses R3F's renderer-state API.
- Disabling the composer unmounts and disposes render targets.
- Disabled ContactShadows are not mounted.
- Shadow-map resolution changes key/remount the two casting lights so stale
  allocations are released.
- Non-shadow light contribution remains mounted in every profile.
- DOF focus work returns immediately when DOF is disabled.
- Stored preference key: `portfolio:rendering-quality:v1`.
- Unsupported stored values fall back to Auto.
- Antialias and power preference are renderer-construction settings; a later
  production control should present reload semantics.

## Diagnostics

- `?perf=1` shows the panel and enables local JSON export.
- `perfProfile=ultra|high|balanced|mobile|fallback` forces a profile.
- `perfDpr=<number>` forces a profile-bounded DPR.
- `perfDisable=post,ao,vignette,bloom,shadows,environment,fill,mobile` preserves
  Phase 1 feature isolation and overrides profile features.
- Effective precedence is individual switches, diagnostic profile, diagnostic
  DPR, user preference, then automatic selection/adaptation.
- Invalid/contradictory values appear as local warnings. Nothing is sent to
  analytics.

## Phase 3 integration points

Phase 3 should use active profile/capability information only to govern asset
working sets, texture variants, lazy residency and disposal. It should measure
memory and transition risk before migrating assets, preserve the single
persistent world/navigation model, and avoid adding scene-specific asset
decisions to the base profile type until evidence justifies them.

No working-set asset migration is included in Phase 2.
