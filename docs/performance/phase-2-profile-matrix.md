# Phase 2 — Rendering profile matrix

All values are defined in `src/scene/rendering/quality/profiles.ts`. Ultra is the
former production configuration; lower profiles follow the Phase 1 evidence
that full-screen postprocessing and DPR dominate desktop cost.

| Feature | Ultra | High | Balanced | Mobile | Fallback |
| --- | --- | --- | --- | --- | --- |
| DPR levels | 1 / 1.25 / 1.4 / 1.6 | 1 / 1.25 / 1.4 | 1 / 1.25 | 1 / 1.25 | 1 |
| DPR min/max | 1–1.6 | 1–1.4 | 1–1.25 | 1–1.25 | 1 |
| Antialias | on | on | on | on | off |
| Power preference | high-performance | high-performance | high-performance | high-performance | default |
| Global shadows | on | on | on | on | off |
| Directional shadow | on, 2048 | on, 1536 | on, 1024 | on, 1024 | off, 512 budget |
| Desk spot shadow | on, 2048 | on, 1536 | on, 1024 | off | off |
| Contact shadows | on, 512 / 3.4 / .48 | on, 384 / 3.2 / .46 | on, 256 / 3 / .44 | off | off |
| Composer | on | on | on | on | off |
| AO | on, medium, full, 1.7 / .32 | on, medium, full, 1.7 / .28 | on, performance, half, 1.5 / .24 | off | off |
| DOF | on, 480 / .035 / .45 | on, 420 / .035 / .45 | on, 360 / .035 / .38 | off | off |
| Bloom | on, .08 | on, .08 | on, .065 | on, .05 | off |
| Bloom threshold/smoothing | .84 / .18, mipmap | same | same | same | disabled |
| Hue/saturation | -.012 / -.12 | same | same | same | off |
| Vignette | .32 / .22 | same | same | .32 / .18 | off |
| Target frame budget | 16.67 ms | 16.67 ms | 20 ms | 22.22 ms | 33.33 ms |
| Poor evidence duration | 3.5 s | 3.5 s | 3 s | 2.5 s | n/a |
| Stable upgrade duration | 12 s | 14 s | 18 s | disabled | n/a |
| Cooldown | 8 s | 9 s | 10 s | 12 s | 15 s |
| Adaptive DPR | yes in Auto | yes in Auto | yes in Auto | downgrade only in Auto | no |

Contact-shadow cells list resolution / blur / opacity. AO cells list quality,
resolution mode, radius / intensity. DOF cells list height / focal length /
bokeh scale.

## Rationale

- **Ultra** preserves prior DPR, shadows, AO, DOF, bloom, grading and vignette.
- **High** reduces maximum pixel workload and shadow/DOF allocations while
  retaining every visual system.
- **Balanced** targets tablets and constrained desktops: DPR 1.25, 1024 maps,
  half-resolution performance AO and lower DOF height keep the authored mood.
- **Mobile** keeps colour treatment and light composition, but removes AO, DOF,
  desk shadow and contact shadows—the costliest optional passes for a
  thermally-constrained GPU.
- **Fallback** preserves room, content, navigation and interaction with one DPR,
  no realtime shadows and no composer.

No profile changes scene IDs, asset membership, camera destinations, light
placement, content, or the persistent-world architecture.
