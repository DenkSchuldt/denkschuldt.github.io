# Phase 1 performance baseline plan

Date: 2026-07-24

## Objective and rules

Measure the current persistent-world architecture before Phase 2. Diagnostics are portfolio-owned, development-only, explicitly enabled with `?perf=1`, local-only, and inert in production. No result in this phase authorizes a visual-quality or lifecycle change.

## Audit verification

| Audit claim | Verified | Evidence | Difference |
|---|---:|---|---|
| One persistent Canvas/world | Yes | `Experience.tsx`, `Scene.tsx` | None |
| Default continuous frameloop | Yes | Canvas has no `frameloop` prop | None |
| DPR `[1,1.6]`, AA, ACES, exposure .68 | Yes | `Experience.tsx`, `renderingIntent.ts` | Output color space is a Three default, not assigned explicitly |
| PCF shadows, two 2048² maps | Yes | `Experience.tsx`, `Lighting.tsx` | None |
| ContactShadows global | Yes | `Lighting.tsx` | Internal target size not configured |
| N8AO, DOF, Bloom, Hue/Saturation, Vignette; MSAA 0 | Yes | `CinematicEffects.tsx` | None |
| Four direct frame systems | Yes | runtime bridge, CameraRig, laptop projection, DOF focus | Runtime bridge is now wrapped by portfolio diagnostics only when code is built; behavior is equivalent |
| Runtime tasks listed in audit | Yes | `Primitives.tsx` | Fourteen CertificateCard callbacks additionally execute per frame |
| Ambient textures eager | Yes | wall, certificate thumbnails, pinscher `useTexture` | Poem manifest also loads on mount, not only on Poems |
| Phone behind RuntimeBoundary | Yes | `Primitives.tsx` | Loader cache can outlive boundary |
| Scenes are camera destinations | Yes | registry + single `Scene` JSX tree | None |

## Instrumentation design

Files are isolated under `src/scene/diagnostics/performance/`. `performanceStore.ts` holds raw fixed-window samples in refs/external state, aggregates tasks, React commits and raycasts, and exports JSON only on user action. `PerformanceDiagnostics.tsx` adds:

- frame-time and `renderer.info` sampling;
- drawing-buffer/device/WebGL capability capture;
- low-overhead wrappers around RuntimeFrameBridge, CameraRig, projection, effects and runtime tasks;
- a development overlay updated every 500 ms, never with per-frame React state;
- a temporary Raycaster wrapper while diagnostics are active;
- React Profiler boundaries for Experience, Scene and SceneNavigation.

`renderer.info.autoReset` is recorded, set false during a diagnostic session, sampled at the next frame boundary, reset explicitly, and restored on cleanup. This gives totals across renderer/composer calls with consistent semantics.

### Diagnostic query switches

`perfDisable=` accepts: `post`, `ao`, `dof`, `bloom`, `grading`, `vignette`, `contactShadows`, `directionalShadow`, `deskShadow`, `shadows`, `aa`, `projection`, `steam`, `tasks`. `perfDpr=1|1.25|1.6` forces DPR. Defaults preserve the production visual configuration.

## Metrics

Fixed-window exports include average/median/1%-low/minimum FPS; average/median/p95/p99/maximum frame time; thresholds over 16.67/22.22/33.33 ms; renderer calls, triangles, points, lines, geometries, textures and programs; drawing buffer; named task count/time/p95/max by Scene; React commits; raycaster calls/candidates/intersections/time; environment and active switches.

Browser CPU/GPU process utilization, JS heap and true GPU memory require external browser tooling and are not inferred from frame time.

## Device matrix

| Profile | Definition | Status |
|---|---|---|
| A desktop | Chromium 150, macOS, Apple M4, 1280×720 CSS, DPR 1.6 | Measured |
| B throttled desktop | Same browser with controlled CPU throttle | Procedure prepared; not available through current browser surface |
| C tablet emulation | 1024×768 viewport on same Apple M4 | Measured; pixel/layout comparison only |
| D physical iPad | Exact model/iPadOS/Safari, power and thermal record | Mandatory manual run; no device connected |

## Deterministic scenarios

All stable windows are 10 s after the camera and UI settle; transitions start immediately before the input and end on the engine arrival marker.

| ID | URL/start | Cache | Actions / waits | Expected end | Invalid if |
|---|---|---|---|---|---|
| L1/L2 | `/` | cold/warm | load; wait first stable frame | About | request failure/context loss |
| S1–S8 | direct Scene URL | warm | wait arrival + 2 s; reset; sample 10 s | requested Scene | transition remains active |
| C1 | `/certificates` | warm | select next certificate; sample transition + 10 s | next focus | image incomplete |
| P1 | `/phone` | warm | hover/click-safe pointer movement | Phone | external navigation |
| O1 | `/poems` | warm | next focus | next poem | markdown incomplete |
| O2–O4 | Poems | warm | open, scroll fixed 600 px, close | Poems | reader missing |
| N1 | any non-Opening | warm | ESC; settle | Opening | focus overlay consumes ESC unexpectedly |
| N2 | Opening after N1 | warm | forward once | resume checkpoint | wrong checkpoint |
| J1 | `/` | warm | complete guided sequence with fixed inputs | Opening | Wall auto timing deviates >1 s |
| J3 | J1 | warm | repeat 3 times | Opening | tab backgrounded |
| I5 | each Scene | warm | no pointer/input 5 min | same Scene | visibility change |
| T15 | `/` | warm | repeat navigation 15 min | active | context loss/reload recorded, not discarded |

For cold runs disable cache in DevTools and reload once. Warm runs must first complete one identical journey. Record hidden/background intervals and discard only with a written reason.

## Statistical rules

Use at least three runs for comparisons, report median and full range, and keep viewport/DPR/cache/first-visit status identical. Separate load, transition and idle windows. The exploratory measurements in the results document are marked when they include startup and therefore are not substituted for strict idle data.

## Limitations

The current environment cannot provide a physical iPad, Safari Web Inspector, Spector.js captures, browser CPU throttling, process CPU/GPU utilization, forced GC or GPU memory. Exact procedures are in `phase-1-test-protocol.md`; affected result cells say “not available”, never zero.
