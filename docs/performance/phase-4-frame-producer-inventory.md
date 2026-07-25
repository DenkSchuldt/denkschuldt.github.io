# Phase 4 — Frame producer inventory

Source of truth: current code after the Phase 4 migration. Phase 1 statements
about eager certificate, Phone, Pinscher and poem loading are historical; Phase
3 replaced those paths.

| Producer | Owner | Previous frequency | Visual output | Class | Continuous required? | Explicit invalidation / lease | Safe idle |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Canvas | `Experience` | `always` | complete frame | always-continuous | No | `frameloop="demand"` | no lease |
| Navigation/camera interpolation | engine + CameraRig | every frame | camera/FOV/focus | transition-continuous | Yes while moving | `navigation-transition`, 15 s safety bound; settled one-shot | engine settled |
| Camera breathing | CameraRig | every frame | subpixel camera motion | periodic | No display-rate requirement | `camera-breathing`, 30 fps only for targets that declare visible amplitude | lease released/target without breathing |
| Runtime bridge | portfolio bridge | every frame | runtime tasks | event-driven | No | executes only on scheduler-produced frames | no frames |
| Laptop projection | Scene | every frame | DOM/canvas alignment | event/transition | Only while matrix changes | matrix signature gate; projection count | unchanged camera/screen/viewport |
| DOF focus | effects | every frame | focus uniform | event/transition | No | write only when focus changes; settle lease after effect changes | unchanged focus or DOF disabled |
| Coffee steam | Coffee | every frame | three sprites | periodic | No | 15 fps lease only from Opening/About/Projects | hidden destination or disabled |
| Certificate cards/lights | Shelf | active runtime tasks | damped materials/lights | active-feature | Bounded | 1.8 s `certificate-animation` settle lease | animation settled/sleeping |
| Phone screen/light | Phone | active runtime task | glow/light | active-feature | Bounded | 1.4 s `phone-screen` settle lease | settled/sleeping |
| Poems preview/cue/light | Poems | active runtime tasks | page/cue/light | active-feature | Bounded | 1.4 s `poems-preview` settle lease | settled/sleeping |
| Pointer hover | R3F events | React event | material/scale feedback | event-driven | No | R3F update plus feature settle invalidation | no hover transition |
| Owned textures | working-set owner | async | visible texture | one-shot | No | `asset-ready` after active, non-stale publication | published/cancelled |
| Poem CanvasTexture | preview owner | async CPU publication | poem page | one-shot | No | `asset-ready`; previous texture disposed | published |
| DPR/profile/resize | quality bridge | event | buffer/effects/shadows | one-shot + bounded settle | Briefly | `quality-change`, `resize`, `effects-settle` | applied |
| Working-set transition | working-set adapter | event | mount/unmount/fallback | one-shot | No | `working-set-change` only when state signature changes | stable lifecycle |
| Visibility | scheduler | event | safe refresh | one-shot | No | hidden invalidations suppressed; one `visibility-restored` | visible refresh consumed |
| Performance diagnostics | diagnostic components | every rendered frame | local metrics | diagnostics | No production requirement | observes existing frames; forced mode is explicit | diagnostics closed |
| ContactShadows/composer/shadow maps | Drei/postprocessing/R3F | rendered frame | lighting/post | event-driven under demand | settle only after remount/change | effect settle lease and R3F invalidation | inputs stable |

Unknowns: browser-internal font completion invalidation and exact composer
multi-frame convergence are not exposed by installed libraries. No claim is
made that a resource download warms a shader. `renderer.compileAsync` was not
used because compiling the persistent scene would compile unrelated
destinations and violate the bounded destination budget.
