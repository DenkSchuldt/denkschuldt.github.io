# Phase 1 reproducible test protocol

## Setup

1. Check out the recorded commit with no unrelated runtime changes.
2. Run the normal development server and open the exact local URL with `?perf=1`.
3. Keep the tab foreground, power mode fixed, other GPU-heavy apps closed and viewport unchanged.
4. In DevTools record browser/OS/GPU, display, CSS viewport, devicePixelRatio, drawing buffer, WebGL version and power state.
5. Use the overlay **Reset** only after the requested Scene reports idle and UI transitions have ended.
6. Sample 10 s; click **Export JSON**. Name files `{device}-{scenario}-{run}.json`.
7. Run every important scenario three times. Record invalidation reasons; never silently delete an outlier.

## URLs and feature switches

Baseline: `?perf=1`. Examples:

- `?perf=1&perfDisable=post`
- `?perf=1&perfDisable=ao`
- `?perf=1&perfDisable=dof`
- `?perf=1&perfDisable=bloom`
- `?perf=1&perfDisable=grading`
- `?perf=1&perfDisable=contactShadows`
- `?perf=1&perfDisable=directionalShadow`
- `?perf=1&perfDisable=deskShadow`
- `?perf=1&perfDisable=shadows`
- `?perf=1&perfDisable=aa`
- `?perf=1&perfDpr=1`, `1.25`, or `1.6`
- `?perf=1&perfDisable=projection`
- `?perf=1&perfDisable=steam`
- `?perf=1&perfDisable=tasks`

Change one variable per comparison. Capture a screenshot or written visual consequence, but do not ship the switch.

## Core run

1. Cold load `/`; export navigation/resource waterfall and timing marks.
2. Repeat warm.
3. Directly open each logical Scene; settle, reset, sample 10 s.
4. Run each guided transition separately and export immediately after arrival.
5. Test certificate, phone and poem focus; open/scroll/close reader.
6. Execute ESC and Resume.
7. Complete one journey, three journeys, five-minute idle and fifteen-minute stress.
8. At each memory checkpoint record `renderer.info`, JS heap and, separately, browser/GPU evidence.

## React

Use the exported `react` section plus React DevTools Profiler. Record initial mount, Scene navigation, Focus navigation, idle, overlay open/close and reader scroll. For each commit note trigger, affected subtree, duration, expected/possibly avoidable and confidence.

## Raycasting

Move the pointer along the same fixed path for five seconds in each Scene, then leave it untouched for ten seconds. Export calls, candidate root arrays, intersections and timing. Compare Certificates/Poems active vs inactive. `active` is a behavior flag; only measured candidate/intersection data proves exclusion.

## GPU capture

With Spector.js or equivalent, capture one stable frame for Opening, About, Certificates, Projects, Phone, Poems and Reader open. Annotate shadow maps, ContactShadows, N8AO, DOF, Bloom, final composition, target sizes/formats and state changes. Do not infer pass cost solely from draw-call count.

## Physical iPad

Record exact model, iPadOS/Safari, orientation, viewport/DPR/drawing buffer, charging, Low Power Mode and starting thermal state. Run cold load, guided journey, Phone, Poems, reader scroll, return, 10–15 min navigation and 5 min idle. Export at minutes 1/5/10/15. Record reload, context loss, input latency and frame-time drift. Safari GPU timing may be unavailable; state this and use frame distributions plus Web Inspector evidence.

## Acceptance

A run is valid only if the tab stayed foreground, viewport/DPR and switches match, no unexpected reload/context loss occurred, requested resources completed, and the scenario reached its expected final state. A context loss during stress is a result, not an invalid run.
