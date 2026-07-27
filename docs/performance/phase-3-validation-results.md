# Phase 3 — Validation results

## Environment and protocol

- Date: 2026-07-24
- Chromium in the in-app browser, macOS/Apple M4
- Viewport 1280×720; Ultra DPR 1.6; buffer 2048×1152
- Local development build; short foreground windows
- Lifecycle stress used `?perf=1&perfProfile=ultra&wsRetention=0`
- Build/test: production export and deterministic suite

Short development windows include navigation and first-use noise. They are
useful for resource-count comparisons but are not strict 10-second,
three-run Phase 1 performance results.

## Initial-load comparison

Before Phase 3, Scene mount requested four Wall images, fourteen certificate
thumbnails and `pinscher.png`: 19 portfolio scene images. After Phase 3 only the
four shared Wall images are requested initially; 15 image requests moved behind
destination intent. Phone was already lazy, but now has owned disposal instead
of a persistent `useTexture` cache.

The prior Phase 2 About sample reported 66 renderer textures. The Phase 3
settled Ultra About run reported 50 (a reduction of 16 renderer entries in this
environment). This is a renderer inventory count, not a GPU-memory-byte value.

## Lifecycle checkpoints

| Checkpoint                                    | Renderer textures | Geometries | Programs |                   Working-set estimate | Tasks / raycast objects |
| --------------------------------------------- | ----------------: | ---------: | -------: | -------------------------------------: | ----------------------: |
| Ultra About                                   |                50 |        136 |       55 |                            0 owned MiB |                   1 / 3 |
| Certificates active                           |                63 |        196 |    49–69 |                      12.0 MiB estimate |                 16 / 17 |
| Projects after immediate Certificates release |                49 |        136 |    60–68 |                            0 owned MiB |                   1 / 3 |
| Phone active                                  |                50 |        139 |       46 |                       4.1 MiB estimate |                   2 / 5 |
| Poems active                                  |                52 |    139–141 |    52–61 |                       7.8 MiB estimate |                   5 / 3 |
| Opening after Poems release                   |                51 |        139 |       55 | 0 owned texture MiB; manifest retained |                   1 / 3 |

Certificates therefore added fourteen texture entries and departure removed
fourteen entries (63→49). The diagnostic history also records fourteen owned
texture `dispose()` calls. This proves component removal, owner-reference
removal, dispose dispatch and lower `renderer.info` count. It does **not** prove
immediate physical GPU or browser-image-memory reclamation. Program counts can
remain higher after a visit because shader/program caches are separate.

Phone recorded `prepare-start`, `prepare-end`, and after departure:
`owned texture dispose() called; browser/GPU reclamation not observable`.
Poems recorded body-reference release plus `dispose()` for pinscher and the
current CanvasTexture. The poem manifest remains a shared session metadata
resource by design.

JS heap, browser-decoded image bytes, forced-GC results and actual GPU bytes:
unavailable.

## First and repeat arrival

| Scenario                                   | Median / p95 frame time       | Texture result |
| ------------------------------------------ | ----------------------------- | -------------- |
| Cold direct Certificates                   | 25.5 / 27.7 ms                | 63 active      |
| Return to Certificates after owned release | 21.0 / 27.1 ms                | 63 active      |
| Projects after release                     | 23.5 / 27.5 ms mixed window   | 49             |
| Cold direct Phone                          | 18.3 / 21.0 ms                | 50             |
| Poems after Phone                          | 18.6 / 21.1 ms rolling window | 52             |

The repeat Certificate median was lower in this one warm-cache run, while p95
was similar. It is insufficient for a causal latency percentage: the browser
HTTP cache was warm, windows were short, and rolling health included transition
samples. No claim is made that disposal itself improved frame time.

## Raycasting and runtime tasks

Outside feature destinations the observed interactive-object count was 3 and
active runtime tasks 1. Certificates active reported 17 and 16 respectively.
After departure both returned to 3 and 1. This is consistent with the fourteen
cards being unmounted/excluded and their animation callbacks becoming
scheduler-gated. Phone reported 5/2 and returned to the lower set after
departure. Poems reported 3/5; its visible cue/task systems are lifecycle
controlled.

The metric counts R3F objects with handlers, not every descendant intersection
test or raycaster CPU time. Phase 1 fixed-path pointer timing was not repeated,
so no millisecond saving is claimed.

## Profiles at About

| Profile  | DPR / buffer    | Median / p95                         | Textures / geometries / programs | Tasks / raycast |
| -------- | --------------- | ------------------------------------ | -------------------------------- | --------------- |
| Ultra    | 1.6 / 2048×1152 | ~19.4 / 24.1 ms settled observed run | 50 / 136 / 55                    | 1 / 3           |
| Balanced | 1.25 / 1600×900 | 9.1 / 11.0 ms                        | 51 / 136 / 46                    | 1 / 3           |
| Mobile   | 1.25 / 1600×900 | 8.3 / 9.1 ms                         | 25 / 98 / 24                     | 1 / 3           |
| Fallback | 1 / 1280×720    | 8.3 / 9.8 ms                         | 6 / 29 / 6                       | 1 / 3           |

Residency differs primarily through retention: Ultra 20–30 seconds,
Balanced 5–12 seconds, Mobile 1.5–5 seconds, Fallback immediate. Shared Wall
context remains in every profile where the active rendering profile mounts it;
lower renderer counts also reflect Phase 2 effects/shadow policy.

## Navigation and failure regression

The guided About → Certificates → Projects → Wall → Phone → Poems path was
exercised. Wall still auto-passed to Phone. Direct certificate, Phone and poem
deep links worked. Reader opened only on demand, displayed content and closed
without replacing Canvas. Existing tests cover Opening auto-continue, focus
URLs, Escape, Resume, fixed Poems camera, reduced motion and Drawer framing.

Failure fallback is deterministic in unit/policy code and can be inspected with
`wsFail=<resource>`. A browser-visible failed-network run was not induced.

## Automated results

- Production export: 56 routes.
- Performance budget: 267.8 KiB initial JS and 483.2 KiB certificate
  thumbnails.
- 83 deterministic tests pass: 11 working-set tests plus all existing
  navigation, content, quality and rendered-contract tests.

## Long-run and physical-device status

One full guided lifecycle and one Certificates return were observed. A
five-minute idle, fifteen-minute stress, controlled three-journey export,
forced GC, Spector capture and physical iPad run were not completed in this
environment. Therefore:

- no monotonic growth was observed in the completed return cycle;
- absence of long-session growth is not proven;
- context-loss/thermal behaviour is unknown;
- physical iPad Auto/profile/DPR/residency results are unavailable.

## Limitations

- `renderer.info` is a resource count, not memory.
- estimated decoded bytes are policy proxies and include assumed RGBA/mipmaps.
- browser cache eviction and actual GPU release are unverified.
- Wall remains session-resident pending real variants.
- first/repeat arrival results need three strict runs and explicit marks.
- project subsystem currently has no heavy local screenshot assets to migrate.
