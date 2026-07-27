# Mobile rendering parity audit

## Scope

This audit predates and is independent of the cinematic navigation extraction. It does not alter Scene, Route, Camera Target, Focus, or navigation behavior. The manually tuned About framing is unchanged.

## Runtime comparison

The development diagnostics panel measured desktop `1280 × 720` and mobile comparison `390 × 720` on the same Chromium runtime.

| Runtime value                  | Desktop                                    | Mobile |
| ------------------------------ | ------------------------------------------ | ------ |
| Renderer / API                 | WebGLRenderer / WebGL 2                    | Same   |
| Precision                      | highp                                      | Same   |
| Tone mapping                   | ACESFilmic                                 | Same   |
| Exposure                       | 0.68                                       | Same   |
| Output color space             | sRGB                                       | Same   |
| DPR                            | 1.6                                        | Same   |
| Buffer                         | RGBA8, depth24                             | Same   |
| Shadows                        | PCF, enabled                               | Same   |
| Quality tier                   | fixed                                      | Same   |
| Environment map                | none, intensity 0                          | Same   |
| Post-processing                | N8AO, DOF, Bloom, Hue/Saturation, Vignette | Same   |
| Active lights                  | 8                                          | Same   |
| Mobile performance adaptations | none                                       | none   |

## Mobile-specific branches

- Camera target resolution selects mobile framing below aspect `0.82`. This changes composition only.
- Canvas DPR is clamped to `[1, 1.6]` for every viewport; there is no mobile-only DPR branch.
- Coarse-pointer detection enables tap input only. It does not change rendering.
- The CSS breakpoint at `820px` displays navigation controls and repositions labels only.
- Scene camera definitions include mobile position/FOV overrides. No override changes exposure, lights, materials, shadows, or effects.
- No `PerformanceMonitor`, adaptive DPR, adaptive events, low-power tier, WebGL fallback, environment substitution, or mobile post-processing substitution exists.

## Isolation results

The drawer was used as the most sensitive dark-region probe, while Projects was used to guard the room's overall grading.

- Disabling all post-processing made the scene darker. The composer is not causing the mobile loss.
- Disabling N8AO changed drawer-region mean luminance by less than 3%.
- Disabling Vignette changed drawer-region mean luminance by less than 1%.
- Disabling shadows recovered separation, but removing shadows breaks the nocturnal lighting intention and is not an acceptable correction.
- Disabling fill lighting reduced dark-region luminance by about 10%, identifying insufficient indirect/fill contribution as the relevant stage.

The mobile framing exposes a larger proportion of surfaces facing away from the key lights, with less illuminated background around dark silhouettes. With identical light values, more of those surfaces remain near black.

## Correction

Desktop keeps the original hemisphere intensity (`0.62 × 0.16 = 0.0992`). Mobile increases only that existing physically plausible fill contribution (`0.62 × 1.25 = 0.775`). No light, shadow pass, material, exposure adjustment, or draw call was added.

Measured Projects mean luminance remains stable (`19.06 → 19.01`) while its crushed-pixel ratio falls from `31.8%` to `25.7%`. The representative drawer dark-region mean rises from `3.15` to `3.95`; desktop remains `3.71`. Desktop full-frame metrics changed by less than `0.05%` between captures.

## Development diagnostics

Open **Render diagnostics** in development to inspect and copy the resolved runtime JSON. The panel includes an isolated `390 × 720` comparison viewport and independent toggles for post-processing, AO, vignette, bloom, shadows, environment, fill, and mobile adaptations.

The same comparison can be opened directly with `?renderViewport=mobile`; isolation parameters use `?renderDisable=post,ao,vignette,bloom,shadows,environment,fill,mobile`. The panel and query handling are disabled in production.
