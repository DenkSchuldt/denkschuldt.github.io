# Phase 1 baseline results

Date: 2026-07-24. Status: **desktop exploratory baseline complete; strict idle/transition, profiling-tool and physical-iPad runs remain pending**.

## Executive summary

On the measured Apple M4 Chromium profile the workload is GPU/pixel-pass dominated, with a secondary Scene-dependent geometry/shadow cost. Disabling the complete post chain changed median About window frame time from 17.92 ms to 8.69 ms (−51.5%). Forcing DPR 1 changed it to 11.18 ms (−37.6%). Disabling all realtime shadows produced a smaller median change to 16.76 ms (−6.5%) but reduced recorded per-frame calls/triangles sharply. Named JavaScript frame tasks were individually below the measurement timer’s useful resolution and together did not explain the frame budget.

These windows intentionally include direct-entry startup/first-use and are not strict idle samples; their ~200 ms longest frame reflects initial work. Conclusions about physical iPad, sustained thermal behavior, GPU memory, loading waterfall and exact pass cost remain unavailable.

## Test environment

Chromium 150 on macOS (`MacIntel` UA platform), ANGLE Metal renderer `Apple M4`; WebGL2/highp; viewport 1280×720; devicePixelRatio 2; resolved R3F DPR 1.6; buffer 2048×1152; max texture/renderbuffer 16384; 16 texture units; anisotropy 16. Tablet emulation used 1024×768 on the same GPU and is not a real tablet.

## Measurement semantics

Three-run controlled comparisons use identical direct `/about` loads and 8 s windows. Values below are medians; ranges are included. Because samples started at page initialization, they combine load/first-use and later stable frames. `renderer.info` was aggregated with auto-reset disabled and explicit frame-boundary reset. Counts include renderer/composer/shadow work and are comparative, not Spector pass labels.

## Scene baseline

Single exploratory runs:

| Scene        |       Avg FPS |        1% low |  Avg frame ms |        p95 ms |         Calls |     Triangles |      Textures | CPU/GPU classification           |
| ------------ | ------------: | ------------: | ------------: | ------------: | ------------: | ------------: | ------------: | -------------------------------- |
| Opening      | not available | not available | not available | not available | not available | not available | not available | Unmeasured                       |
| About        |         70.78 |         42.19 |         17.92 |          21.8 |           550 |       197,828 |            64 | GPU/pixel-pass                   |
| Certificates |         61.27 |         22.94 |         23.17 |          29.7 |           645 |       256,426 |            64 | GPU + higher geometry/shadow     |
| Projects     |         68.68 |         27.93 |         20.04 |          25.5 |           553 |       204,466 |            63 | GPU/pixel-pass                   |
| Wall         | not available | not available | not available | not available | not available | not available | not available | Unmeasured                       |
| Phone        |         70.85 |         31.15 |         18.30 |          22.7 |           548 |       195,640 |            65 | GPU/pixel-pass + first texture   |
| Poems        |         70.32 |         40.49 |         17.92 |          22.2 |           556 |       193,606 |            66 | GPU/pixel-pass + dynamic texture |
| Drawer       | not available | not available | not available | not available | not available | not available | not available | Internal target, unmeasured      |

Average FPS is inflated by short deltas and must not be read as display refresh. Frame-time percentiles are the stronger signal.

## Idle cost

Strict post-settle reset windows were not captured in this environment. Static/runtime instrumentation confirms the continuing systems, but numerical cells remain unavailable.

| Scene        | Frames rendered                 | Active useFrame                                  | Runtime tasks                                 | Shadow passes     | Post passes       | React commits |
| ------------ | ------------------------------- | ------------------------------------------------ | --------------------------------------------- | ----------------- | ----------------- | ------------- |
| All          | Continuous (`frameloop=always`) | Runtime bridge, CameraRig, projection, DOF focus | coffee steam; Scene tasks lifecycle-dependent | Active by default | Active by default | not available |
| Certificates | Continuous                      | same + 14 card callbacks                         | shelf lighting + steam                        | Active            | Active            | not available |
| Phone        | Continuous                      | same                                             | phone screen + steam                          | Active            | Active            | not available |
| Poems        | Continuous                      | same                                             | preview/cue/light/polaroid + steam            | Active            | Active            | not available |

## Transition cost

| Transition              | Duration      | Avg frame ms  | p95 ms        | Longest frame | Dropped frames |
| ----------------------- | ------------- | ------------- | ------------- | ------------- | -------------- |
| Opening → About         | not available | not available | not available | not available | not available  |
| About → Certificates    | not available | not available | not available | not available | not available  |
| Certificates → Projects | not available | not available | not available | not available | not available  |
| Projects → Wall → Phone | not available | not available | not available | not available | not available  |
| Phone → Poems           | not available | not available | not available | not available | not available  |
| Poems → Opening         | not available | not available | not available | not available | not available  |

The instrumentation is ready to separate these windows using Reset/export at transition boundaries.

## Controlled feature cost

| Feature disabled/changed | Scenario               | Baseline ms | Modified ms |        Difference | Visual impact                            |
| ------------------------ | ---------------------- | ----------: | ----------: | ----------------: | ---------------------------------------- |
| All postprocessing off   | About direct-entry 8 s |       17.92 |        8.69 | −9.23 ms (−51.5%) | Major grading/AO/DOF/bloom/vignette loss |
| Forced DPR 1.0           | Same                   |       17.92 |       11.18 | −6.74 ms (−37.6%) | Lower pixel density                      |
| All realtime shadows off | Same                   |       17.92 |       16.76 |  −1.16 ms (−6.5%) | Major grounding/lighting change          |

Ranges: baseline 17.87–18.22 ms; post off 8.68–8.69; DPR1 11.16–11.20; shadows off 16.67–19.29 (one run had a 596.9 ms startup outlier). All comparisons repeated three times. Individual AO/DOF/Bloom/light-shadow tests are not yet measured and the aggregate post result must not be assigned to one pass.

## Device comparison

| Scenario           | Desktop         | Throttled desktop | Emulated tablet | Physical iPad |
| ------------------ | --------------- | ----------------- | --------------- | ------------- |
| About direct-entry | 17.92 ms median | not available     | 10.24 ms median | not available |

Tablet range was 9.95–10.29 ms with 1024×768 drawing buffer. The improvement reflects fewer pixels on the same Apple M4, not mobile GPU or thermals.

## Loading and first use

The mixed windows consistently show ~200–220 ms longest frames; one shadows-off run reached 596.9 ms. Because no network/trace correlation was captured, these spikes cannot yet be assigned to shader compilation, texture upload, lazy chunks or hydration. Phone increased texture count 64→65; Poems reached 66. Certificates raised calls/triangles without increasing texture count relative to About because thumbnails were already eager.

Cold/warm transferred bytes, decode timing, ready-vs-stable markers and certificate/poem request waterfalls: not available.

## Memory/resource lifetime

| Checkpoint      |      Textures |                   Geometries |      Programs | JS heap       | GPU memory status |
| --------------- | ------------: | ---------------------------: | ------------: | ------------- | ----------------- |
| About           |            64 |                          197 |            45 | not available | not measurable    |
| Certificates    |            64 | not recorded in table export |  not recorded | not available | not measurable    |
| Phone           |            65 |                 not recorded |  not recorded | not available | not measurable    |
| Poems           |            66 |                 not recorded |  not recorded | not available | not measurable    |
| After cycles/GC | not available |                not available | not available | not available | not measurable    |

Counts show allocation, not bytes or proof of release. Physical GPU memory was not inferred.

## Named task observations

In About, 543 measured CameraRig/projection executions and 542 steam executions occurred during the exploratory window; all ran while the camera later appeared idle. Runtime bridge averaged ~0.038 ms/call; CameraRig ~0.014 ms; projection ~0.011 ms; steam ~0.004 ms. Fourteen CertificateCard callbacks produced 7,602 executions but ~2.3 ms total. `performance.now()` resolution/noise limits confidence for these sub-0.1 ms callbacks. The post/GPU cost is not represented by these JS callback timings.

## React, raycasting and GPU passes

React Profiler and Raycaster data export are implemented, but this run predates the final Profiler integration and used no controlled pointer path; results are not available. Spector/WebGL pass captures are not available. No claim is made about exact N8AO/DOF/Bloom or raycast cost.

## iPad observations

No physical iPad was connected. There are no iPad performance results. The code preserves the same post chain, shadows and max DPR policy; whether that causes the observed user issue requires the physical protocol.

## Conclusions

1. Current evidence says primarily GPU/pixel-pass, with mixed Scene geometry/first-use costs.
2. Largest measured levers: aggregate postprocessing, pixel count/DPR, then realtime shadows/Scene complexity.
3. Continuous idle work: always frameloop, global post/shadows, CameraRig, projection, runtime bridge and steam.
4. Initial ~200 ms spikes and Phone/Poems allocation changes are first-use candidates, not yet attributed.
5. What specifically makes iPad worse is unknown; no physical measurement exists.
6. Confirmed audit assumptions: persistent world, continuous loop, global pipeline, eager ambient textures and lifecycle-gated phone/tasks.
7. No major audit claim was disproved; poem manifest loading is earlier than the audit wording implied.
8. Unknown: strict idle/transition distributions, individual pass cost, network, React/raycast, memory bytes, sustained/iPad behavior.
9. Phase 2 priorities must be determined by physical iPad results plus individual post-pass, strict idle, transition and sustained-memory measurements—not by the aggregate diagnostic switches alone.
