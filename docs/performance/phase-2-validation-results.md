# Phase 2 — Validation results

## Environment

- Date: 2026-07-24
- Local development build: vinext/Vite, Chromium in the Codex in-app browser
- Viewport: 1280 × 720 CSS pixels
- Protocol: `?perf=1&perfProfile=<id>`, About settled for approximately five
  seconds per profile
- Automated validation: production build, performance budget, 72 deterministic
  tests

These short local samples are comparison evidence, not a replacement for the
long Phase 1 capture protocol or physical-device traces. Development/browser
noise especially affects arithmetic average and 1%-low values, so median and
p95 are the primary figures below.

## Ultra regression

Ultra resolves DPR 1.6 and a 2048 × 1152 buffer, with all former effects and
shadow systems enabled. Its AO quality was deliberately left at the package's
former default (`medium`, full resolution), and all prior numerical visual
values are unchanged. A direct screenshot review of the settled About framing
showed the same composition, colour grade, DOF, shadow placement and vignette.

Measured settled About: median 23.70 ms, p95 26.40 ms, 571 calls, 210,124
triangles, 66 textures, 197 geometries and 58 programs. The earlier Phase 1
mixed-load About median was 17.92 ms; the two captures have different warm-up
and development noise and should not be treated as a controlled regression
percentage. Production build and all existing navigation/rendering tests pass.

Certificates, Phone, Poems and the guided journey retain their previous
configuration under Ultra and their numeric camera contracts pass. A new
long-duration per-destination GPU capture was not performed in this pass; the
existing Phase 1 results remain the reference for those destinations.

## Profile comparison — settled About

| Profile  | DPR / buffer              | Median / p95     | Calls / triangles | Textures / programs | Active effects                           | Active shadows             |
| -------- | ------------------------- | ---------------- | ----------------- | ------------------- | ---------------------------------------- | -------------------------- |
| Ultra    | 1.6 / 2048×1152 (2.36 MP) | 23.70 / 26.40 ms | 571 / 210,124     | 66 / 58             | AO, DOF, bloom, grade, vignette          | directional, spot, contact |
| High     | 1.4 / 1792×1007 (1.80 MP) | 17.90 / 19.10 ms | 725 / 266,310     | 66 / 58             | AO, DOF, bloom, grade, vignette          | directional, spot, contact |
| Balanced | 1.25 / 1600×900 (1.44 MP) | 11.20 / 12.20 ms | 726 / 266,311     | 68 / 59             | half-res AO, DOF, bloom, grade, vignette | directional, spot, contact |
| Mobile   | 1.25 / 1600×900 (1.44 MP) | 8.30 / 9.40 ms   | 320 / 124,875     | 42 / 37             | bloom, grade, vignette                   | directional only           |
| Fallback | 1 / 1280×720 (.92 MP)     | 8.30 / 9.30 ms   | 203 / 76,260      | 22 / 12             | none                                     | none                       |

Relative to this Ultra sample, median frame time improved approximately 24% in
High, 53% in Balanced, and 65% in Mobile/Fallback. Calls/triangle snapshots can
vary with shadow refresh and effect internals; they are recorded rather than
normalised. Screenshot comparison confirms Mobile keeps the room composition
and readable lighting, with the expected loss of AO/DOF/contact-shadow depth.

## Adaptive DPR

Deterministic tests verify:

- sustained poor distributions are required for a downgrade;
- a single spike does not downgrade;
- upgrades require a longer stable period;
- cooldown blocks immediate reversal;
- hidden, transition, overlay-change and warm-up samples are ignored;
- explicit profiles and diagnostic DPR disable automatic adaptation;
- resize produces a viewport-reset warm-up.

The real 2.36 MP Ultra workload and progressively smaller diagnostic buffers
were exercised successfully. Runtime `setDpr` is used without Canvas recreation.
Synthetic unit input supplies the repeatable downgrade/recovery/no-oscillation
evidence; inducing artificial browser jank was intentionally not used as an
acceptance oracle.

## Navigation and URL regression

All existing navigation tests pass, including Opening, About, Wall
pass-through, Escape, Resume, Phone, Poems fixed camera, poem/certificate deep
links and reduced-motion transition rules. The quality layer imports no scene
IDs and made no change to `@denk/cinematic-navigation`. Profile changes keep the
Canvas, navigation store and camera state mounted.

## Build and budgets

`npm test` passed:

- vinext production export: 56 routes;
- performance budget: 267.8 KiB initial JS and 483.2 KiB certificate
  thumbnails;
- 72 tests passed, including 8 new quality-policy/controller tests.

## Physical iPad

Unavailable. Auto, forced profiles and DPR 1.0/1.25/1.6 remain unverified on
physical iPad hardware. No iPad measurements are inferred from desktop
emulation.

## Limitations

- Reliable display refresh inference is not implemented; profiles use documented
  conservative targets.
- Automatic full-profile switching is modelled but intentionally disabled.
- Antialias and power preference need renderer recreation/reload to apply after
  an in-session explicit profile change.
- The profile comparison is a short local About capture, not a complete physical
  device matrix.
- Asset residency/working-set migration is explicitly deferred to Phase 3.
