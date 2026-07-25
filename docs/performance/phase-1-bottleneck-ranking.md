# Phase 1 bottleneck ranking

This ranking is evidence-weighted and stops before implementation design.

## Critical

None confirmed across target devices. Physical iPad evidence is missing.

## High

### Aggregate postprocessing / pixel-pass workload

- Evidence: About median frame time 17.92→8.69 ms with all post off; −51.5%, three runs.
- Devices/Scenes: measured desktop About; pipeline is global, so potentially all.
- Reproduce: `/about?perf=1` vs `perfDisable=post`, identical 8 s direct-entry windows.
- Subsystem/owner: renderer/postprocessing; Portfolio.
- Next investigation: isolate AO, DOF, Bloom and grading one at a time; capture Spector frames. Do not attribute aggregate gain to a single pass.

### Drawing-buffer pixel count

- Evidence: DPR 1.6 buffer 2048×1152 vs DPR 1 buffer 1280×720; frame time 17.92→11.18 ms (−37.6%), three runs.
- Devices/Scenes: measured desktop About; likely all full-screen passes; iPad unconfirmed.
- Subsystem/owner: Canvas renderer policy; Portfolio/shared rendering integration.
- Next investigation: physical iPad exact buffer and DPR 1/1.25/1.6 controlled comparison.

## Medium

### Certificates render complexity

- Evidence: exploratory Certificates 23.17 ms/p95 29.7, 645 calls and 256,426 triangles vs About 17.92/21.8, 550 and 197,828.
- Devices/Scenes: Certificates on desktop; single run.
- Owner: Portfolio geometry, cards, lighting/shadows.
- Reproduce: direct routes with identical post-settle 10 s reset window.
- Next: three strict idle runs, separate card/shelf shadow and overlay costs.

### Realtime shadow infrastructure

- Evidence: all shadows off changed median 17.92→16.76 ms (−6.5%); calls 550→71 and triangles 197,828→9,680. One modified run was noisy.
- Devices/Scenes: desktop About; global pipeline.
- Owner: Portfolio renderer/lighting.
- Next: directional, desk and ContactShadows separately; Spector GPU timings.

### First-use stalls

- Evidence: longest frames ~200–220 ms in most direct-entry runs; one 596.9 ms outlier.
- Devices/Scenes: all measured entries.
- Owner: unconfirmed mixture of shared loading, shaders and portfolio resources.
- Next: cold/warm network + performance trace correlated with program/texture changes.

## Low

### Named JavaScript per-frame callbacks on Apple M4

- Evidence: Runtime bridge ~0.038 ms/call, CameraRig ~0.014, projection ~0.011, steam ~0.004 in About; timer resolution limits precision.
- Devices/Scenes: desktop only.
- Owner: shared adapter/Portfolio tasks.
- Next: CPU-throttled and physical-iPad runs; projection/steam switches. Low measured desktop cost does not prove low mobile cost.

## Unconfirmed

- Physical iPad GPU/thermal limitation, sustained degradation and Safari context loss.
- Individual N8AO, DOF, Bloom, grading and ContactShadows cost.
- React commit cost during navigation/focus/reader scroll.
- Raycasting of inactive Certificates/Poems objects.
- JS heap, loader cache and actual GPU-memory growth across cycles.
- Cold/warm transfer/decode and Scene-ready vs first stable frame.
- Exact GPU pass topology/target formats without Spector.

Each remains unranked until the protocol records repeatable measurements.
