# Root world realism study

Branch: `improve/root-world-realism`  
Baseline: `1f0f1a81475b9bcffba8f13df18cb7e7ce5ea8fe`

This is a review candidate, not a deployment. It improves material definition and lighting readability, rather than promising photorealism from the existing low-poly geometry.

## Selected direction

- Original seamless walnut and staggered wood-floor textures, with physically scaled UV repetition, mipmaps, and modest anisotropic filtering.
- Color maps use sRGB. Packed height/roughness maps are linear data. Material shader variants are recreated when asynchronous maps arrive or the quality tier changes.
- Balanced/high/ultra add subtle bump and roughness variation. Mobile/fallback load only the two color maps, with no detail-map downloads or extra bump/roughness samples.
- Existing daylight is rebalanced: sun 2.6 → 2.35, slightly warmer, desktop hemisphere 0.31 → 0.775. Portrait hemisphere remains 1.085. No extra lights, relocated lights, exposure increase, or postprocessing passes.
- PCF shadow radius scales with resolution: 1/2/3/4 at 512/1024/1536/2048. The first pass's radius 10 was rejected after matched visual QA showed fixed-tap stippling; the final compact footprint retains the same five shader samples. Sun shadow depth range is bounded to the room (0.5–30 instead of the default far 500). Shadow map sizes stay unchanged.
- Dark panel instance colors no longer multiply another dark wood color. Chair fabric, molded plastic, and satin metal now have distinct reflectance. The lamp diffuser is emissive without adding a new light.
- Shelf carcass/storage and picture-light rounded geometry use fewer bevel subdivisions. Certificate frames, geometry silhouettes, content, and all spatial transforms remain unchanged.

## Alternatives considered

1. Texture-only treatment: useful grain and floor scale, but retained excessively dark room contrast. Kept as a visual comparison, not the selected direction.
2. Texture plus existing-light/material rebalance: retained from the first pass. Provides clearer depth and surface separation without new lights or recurring render passes.
3. Bounded selected-material reflections and receiver-space contact AO: added in the second pass. These give metal/glass a room reference and ground permanent tabletop objects without a global environment or new visible geometry.
4. Large photographic PBR packs, global HDR environments, displacement geometry, stronger always-on AO, or added area/contact shadow passes: not selected. They add transfer, memory, tessellation, startup compilation, or full-screen work before target-device benefit is established.

## Measured static costs

| Measure                                                  |  Baseline |                                       Candidate / delta |
| -------------------------------------------------------- | --------: | ------------------------------------------------------: |
| All shipped JS gzip                                      | 680,141 B |                                    683,341 B (+3,200 B) |
| 3D manifest JS gzip                                      | 515,681 B |                                    518,878 B (+3,197 B) |
| New mobile/fallback texture transfer                     |         0 |                                                19,488 B |
| New balanced/high/ultra texture transfer                 |         0 |                                               115,868 B |
| Estimated new retained texture memory                    |         0 |    2.70 MiB mobile; 6.02 MiB desktop; 2.67 MiB fallback |
| Color-pass geometry                                      |  existing | 17,024 fewer triangles when all simplified parts render |
| Directional-shadow geometry                              |  existing |                   up to 13,440 fewer triangles per pass |
| New visible meshes / steady draw calls / lights / postFX |         — |                                                       0 |

Texture memory is an estimate, not measured device VRAM. Geometry savings do not prove faster total frames: desktop texture sampling is additional work, and texture-load shader compilation has a cost.

A reproducible TypeScript AST audit against both the original and first-pass revisions preserves all 201 placement JSX attributes, 100 spatial operations, 145 world-node declarations, and 37 interaction handlers. Its six additions are forwarded existing paper-placement props, a read-only position-buffer binding, AO footprint rotations, and one material attachment, not relocated geometry. `/360`, navigation input sensitivity, route definitions, content, and deployment configuration were not changed.

## Second-pass ownership and budget

- One original procedural room-reflection atlas is shared only by selected laptop/tablet/phone/lamp glass and metal. It never replaces `scene.environment`. Existing screen colors/content are preserved.
- Reflections are disabled for mobile, fallback, portrait layout, blueprint, and environment isolation. One cancelable idle preparation (300 ms timeout; timer fallback) creates the atlas. No recurring capture or frame callback is added.
- The retained 64px PMREM atlas is estimated at 688,128 bytes. Its 256×128 RGBA32F source temporarily uses 524,288 bytes, plus transient generator work buffers. Source and generator dispose immediately; the retained target disposes on teardown. Missing float-render-target support preserves direct-light fallback materials. A standard canvas context-restored listener recreates this owner's lost atlas once, without changing renderer restoration behavior. A tested try/finally restores the caller's render target, cube face, mip level, XR state, and autoClear even if PMREM preparation throws, before temporary resources dispose.
- Desk contact AO is one 256×128 R8 map (32,768 bytes), using only permanent paper and phone footprints. It adds one desk AO sample, including mobile; fallback, blueprint, and AO isolation disable it. No decals or extra draw calls are needed.
- The unchanged desk geometry gains a 31,008-byte uv1 attribute (3,876 vertices × two Float32 values), allocated even when AO is disabled. This cost is separate from the texture estimates above.
- Second-pass shipped JavaScript adds 2,513 gzip bytes over pass 1. Figures use Node `zlib.gzipSync` defaults on the same build artifacts, excluding the local QA probe.
- Owned material clones are disposed explicitly. Narrow ESLint comments document intentional Three.js resource mutation and one bounded effect publication; they do not suppress unrelated warnings.

## Validation and limitations

- Build succeeds, generating 75 routes.
- Quality checks pass (format, ESLint, TypeScript). ESLint still reports 33 existing warnings, no errors.
- All 131 Node tests pass, including new surface budgets, inventory, mobile gating, and shader-variant regression checks.
- The repository performance budget passes: 300.0 KiB initial JS; 1,683.6 KiB 3D JS (506.7 KiB gzip); 496.4 KiB certificate thumbnails.
- Visual inspection uses an isolated Chromium profile with software ANGLE/SwiftShader. It is useful for material correctness and layout, not a physical-phone or hardware-GPU performance result.
- Portrait inspection uses a 390×700 CSS viewport. It does not validate touch behavior, thermal throttling, real-device memory reclamation, or GPU frame time. Input code is untouched.
- A synthetic context-loss/restore cycle recovered visibly on both loaded revisions in the software browser. An earlier startup-interrupted candidate run went black; startup recovery remains unverified, and the loaded-scene check is not complete context-loss coverage.
- Real-device before/after profiling remains a release gate. Do not infer a no-regression FPS guarantee from geometry savings or software rendering.

## Reproduce

Use Node 22.13+ and the existing lockfile:

```sh
npm ci
npm run quality
npm test
npm run dev
```

For a matched comparison, use the same browser, device, viewport, and query overrides on both revisions: `?perfProfile=balanced&perfDpr=1` for desktop and `?perfProfile=mobile&perfDpr=1` for portrait. Avoid mixing automatic profile changes with fixed-profile results. The development `?perf=1` diagnostics can export the existing frame/resource counters.

Texture regeneration is optional and offline, requiring Python 3, numpy, and Pillow:

```sh
python scripts/generate-surface-textures.py
```

The generated assets are original procedural work, not purchased or copied from an external image pack. No Python package is needed to build or run the website.

## Visual review coverage

The matched opening and About views show the selected material/light changes. The certificate shelf, project screen, wall gallery, phone scene, poems landing view, and Poemverse are checked for unchanged framing/content and usable controls. Poemverse remains its existing stylized constellation experience; it is not re-themed into the room's material style. The narrow-viewport opening and About checks exercise the same responsive scene, not a separate mobile implementation. Matched About drawing buffers were verified at 1180×757 (desktop) and opening at 390×700 (portrait), DPR 1 with antialias enabled. The second-pass opening comparison preserves median submissions at 284 draw calls / 77,237 triangles on desktop and 243 / 64,471 in portrait, versus pass 1. Samples are unequal and include demand scheduling, so their software callback gaps are not a frame-time or FPS benchmark.
