# Phase 3 — Migration notes

## Files added

- `src/scene/runtime/working-set/types.ts`
- `definitions.ts`
- `resolver.ts`
- `WorkingSetProvider.tsx`
- `OwnedTexture.tsx`
- `ResourceBoundary.tsx`
- `index.ts`
- `tests/working-set.test.mjs`

## Files changed

- `Experience.tsx`: provider, navigation adapter, destination-scoped Poems and
  Projects, reader lazy mount only while open.
- `Primitives.tsx`: owned certificate/Phone/pinscher textures, deterministic
  CanvasTexture reporting, scheduler-gated cards, conditional raycast/handlers,
  destination shelf lights.
- `usePoems.ts`: manifest preparation near Poems, bounded selected/neighbor
  bodies and explicit reference-release reporting.
- `CertificateGalleryOverlay.tsx`: HTML original load/release evidence.
- `PerformanceDiagnostics.tsx`: lifecycle/resource counters, estimates,
  disposal evidence, local JSON export and diagnostic clear.
- `rendered-html.test.mjs`: contract now expects true raycast exclusion and
  owned Phone loading.

## Ownership changes

| Resource               | Old ownership                                       | New ownership                                            |
| ---------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| Certificate thumbnails | global Drei `useTexture` cache                      | `CertificateGallery` owned loader batch                  |
| Phone screen           | RuntimeBoundary unmount + global `useTexture` cache | working-set boundary + `PhoneScreen` owned loader        |
| Pinscher photo         | eager global `useTexture` cache                     | Poems boundary + `PortfolioPhoto` owned loader           |
| Poem preview           | local CanvasTexture cleanup                         | same owner plus lifecycle boundary/evidence              |
| Poem manifest/bodies   | manifest startup, bodies accumulated                | destination preparation; manifest shared, bodies bounded |
| Projects overlay       | static bundle/component                             | destination-scoped lazy component                        |
| PoemReader             | lazy component attempted while closed               | lazy component mounted only while open                   |
| Wall images            | implicit eager cache                                | explicit shared session cache                            |

## Disposal rules

- Local owners dispose only textures they constructed.
- Shared/module resources are never disposed by a destination.
- Late cancelled TextureLoader completions are disposed before publication.
- Dynamic preview replacement disposes the previous CanvasTexture.
- HTML images/fetch bodies only claim DOM/React reference removal.
- No global Drei/Three/browser cache is cleared.
- Diagnostics never label an object physically GPU-freed; they expose evidence.

## Compatibility

There is still one Canvas, one room and one navigation engine. The adapter
subscribes to the engine and does not mutate it. Camera choreography, routes,
Wall timing, focus rules, external links, reading mode, quality profiles and
ambient composition are unchanged. Lower profiles alter retention without
placing asset lists into the base quality model.

## Diagnostic controls

Use `?perf=1` plus optional `wsRetention=0`,
`wsForce=<destination>:<state>`, `wsFail=<resource>`, `wsShowIds=1` or
`wsLog=1`. “Clear owned” releases only eligible non-active boundaries; actual
owner cleanup events are the evidence.

## Unresolved resources

- Wall needs deterministic ambient/active variants before safe eviction.
- Global module materials/geometries, shadow targets and post targets remain
  session/render-profile resources.
- Browser cache eviction for certificate/reader images and poem fetches is not
  controllable through the current architecture.
- Projects has no heavy media files to optimise.
- Three-journey/15-minute, Spector, heap and physical-iPad evidence remains
  pending.

## Phase 4 integration points

Phase 4 should address render-loop scheduling, on-demand invalidation where
compatible with cinematic motion, laptop projection gating, shader/program
warm-up, texture-format/variant generation for Wall/Phone, and physical iPad
thermal/context-loss validation. It must consume the lifecycle signals rather
than reintroducing isolated component flags.

Phase 4 has not started.
