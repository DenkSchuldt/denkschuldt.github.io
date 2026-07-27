# Phase 3 — Resource inventory

Date: 2026-07-24. Source of truth: current code after the Phase 3 migration.
Phase 1/2 documents describe their historical code state; statements that
certificate thumbnails, `pinscher.png`, Phone and the poem manifest load at
startup are no longer current.

## Release terminology

The following terms are deliberately not interchangeable:

1. **Unmounted:** React/R3F no longer has the component in its tree.
2. **References released:** the owner removed its JavaScript/material reference.
3. **Loader-cache evicted:** the relevant loader cache entry was explicitly
   removed. This is not implied by unmount.
4. **Texture disposed:** `THREE.Texture.dispose()` dispatched a renderer-side
   disposal request.
5. **Browser-decoded memory released:** only provable with browser memory/image
   tooling; HTTP/image cache may retain decoded or encoded data.
6. **GPU allocation released:** only provable with suitable GPU tooling. A
   `dispose()` call or lower `renderer.info.memory.textures` count is supporting
   evidence, not a direct byte measurement.

“Released” in working-set diagnostics means the owner completed every action it
controls and records the exact evidence list. It never means confirmed physical
GPU-memory reclamation.

## Inventory

| Resource                            | Destination        | Type / classification                   | Current load trigger                  | Current lifetime                                             | Ambient / active requirement                      | Disposal owner                             | Shared? |
| ----------------------------------- | ------------------ | --------------------------------------- | ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------ | ------- |
| Procedural room, desk, chair, plant | world              | geometry/material; persistent-essential | module/Scene mount                    | session                                                      | required ambient and active                       | page/renderer teardown                     | Yes     |
| Laptop body/screen plane            | Projects/About     | geometry/material; ambient              | Scene mount                           | session                                                      | physical presence always                          | page teardown                              | Yes     |
| Project overlay chunk/DOM           | Projects           | lazy React; active-only                 | Projects preparing/active             | profile retention boundary                                   | no ambient; active only                           | React boundary                             | No      |
| Wall frames                         | Wall/world         | geometry; ambient                       | Scene mount                           | session                                                      | required from multiple camera views               | page teardown                              | Yes     |
| Four wall images                    | Wall/world         | `useTexture`; shared-cache              | Scene mount                           | loader/session cache                                         | required room composition                         | Drei loader/page                           | Yes     |
| Certificate shelf/decor             | Certificates/world | geometry/material; ambient              | Scene mount                           | session                                                      | silhouette required                               | page teardown                              | Yes     |
| 14 certificate thumbnails           | Certificates       | owned JPEG textures; preparable         | navigation target                     | bounded by profile                                           | absent outside relevance; all visible when active | `CertificateGallery`                       | No      |
| Certificate originals               | Certificates       | HTML image; overlay-only                | selected focus overlay                | selected `<img>` lifetime, browser cache may persist         | no ambient; selected original only                | overlay DOM                                | No      |
| Phone body/dark screen              | Phone/world        | geometry/material; ambient              | Scene mount                           | session                                                      | required ambient                                  | page teardown                              | Yes     |
| `phone.jpeg`                        | Phone              | owned JPEG texture; preparable          | Phone target                          | bounded by profile                                           | dark material is fallback; active screen required | `PhoneScreen`                              | No      |
| Phone point light/task              | Phone              | local light/runtime task; active-only   | Phone resource boundary               | preparing/sleeping subtree; update only active/transitioning | disabled ambient                                  | `PhoneScreen`/scheduler                    | No      |
| Notebook geometry                   | Poems/world        | geometry/material; ambient              | Scene mount                           | session                                                      | required ambient                                  | page teardown                              | Yes     |
| Poem manifest                       | Poems              | JSON/fetch; shared-cache                | Poems target                          | session metadata cache                                       | not visually required outside Poems               | `usePoems` references; browser fetch cache | Yes     |
| Selected/neighbor markdown          | Poems              | text/fetch; overlay-only                | Poems preparing/active                | max selected + neighbors; refs cleared on release            | none ambient                                      | `usePoems`                                 | No      |
| Poem reader chunk/DOM               | Poems              | lazy React + HTML                       | reader opens                          | reader lifetime                                              | none ambient                                      | React boundary                             | No      |
| `pinscher.png`                      | Poems              | owned PNG texture; preparable           | Poems target                          | bounded by profile                                           | dark photo fallback                               | `PortfolioPhoto`                           | No      |
| Poem preview                        | Poems              | dynamic `CanvasTexture`; active-only    | body available while preparing/active | one current texture                                          | dark paper fallback                               | `usePoemPreviewTexture`                    | No      |
| Poem reader artwork                 | Poems              | HTML image; overlay-only                | reader selected poem                  | DOM plus browser cache                                       | none ambient                                      | reader DOM                                 | No      |
| Coffee steam sprites                | world              | runtime materials/task                  | Scene mount                           | session; task global                                         | ambient animation                                 | Coffee cleanup/page                        | Yes     |
| Global shadow maps                  | world              | render targets                          | renderer/lights                       | profile/session                                              | global visual policy                              | R3F/renderer                               | Yes     |
| ContactShadows targets              | world              | render targets                          | quality profile enables               | composer component lifetime                                  | global                                            | Drei/R3F                                   | Yes     |
| Postprocessing targets              | world              | render targets                          | composer enabled                      | profile/component lifetime                                   | global                                            | managed composer cleanup                   | Yes     |
| Font                                | Poems/labels       | browser font                            | text appears/CSS                      | browser font cache                                           | labels                                            | browser                                    | Yes     |
| Mixpanel/network                    | application        | analytics                               | Experience mount/events               | external SDK session                                         | not rendering resource                            | SDK/browser                                | Yes     |

No GLTF, video, environment map, HDRI, audio, KTX2, DRACO, Meshopt or custom
shader assets exist. No preload helper or global `THREE.Cache.clear()` is used.

## Known dimensions and sizes

| Asset group                | Dimensions          |                  Encoded size |                      Defensible decoded estimate | Mipmaps / colour         |
| -------------------------- | ------------------- | ----------------------------: | -----------------------------------------------: | ------------------------ |
| Certificate thumbnails ×14 | mostly 480×352      | 22–43 KiB each; 493 KiB total | about 12.0 MiB RGBA including a 4/3 mip estimate | generated by Three; sRGB |
| Certificate originals      | 776–1921 × 600–1408 |              144–299 KiB each |  browser-dependent; not counted as WebGL texture | HTML image, sRGB         |
| `phone.jpeg`               | 675×1200            |                      41,724 B |        about 4.1 MiB RGBA including mip estimate | generated; sRGB          |
| `pinscher.png`             | 567×612             |                     141,437 B |             about 1.8 MiB including mip estimate | generated; sRGB          |
| poem preview               | 1024×1160 canvas    |  regenerated, no encoded file |             about 6.0 MiB including mip estimate | generated; sRGB          |
| Wall Arrival               | 1920×1200           |                     121,137 B |            about 11.7 MiB including mip estimate | loader/session; sRGB     |
| Other wall images          | 598×362 or 728×410  |                  9.9–43.6 KiB |    about 1.1–1.6 MiB each including mip estimate | loader/session; sRGB     |

Decoded estimates are width × height × four RGBA bytes × 4/3 when mipmaps are
expected. They are policy proxies, not GPU measurements. Encoded sizes came
from files and are never inferred from dimensions.

## Cache and ownership conclusions

- `useTexture` remains only for the four Wall images. Because they are visible
  ambient context and no lower variants exist, they are explicitly a shared
  session cache. Local components must not dispose them.
- Phone, certificate thumbnails and `pinscher.png` use an owned
  `TextureLoader` path. Cancellation disposes late completions; cleanup removes
  owner references and calls `dispose()` idempotently.
- Dynamic poem previews are single-owner `CanvasTexture` instances and are
  disposed on replacement/release.
- Certificate/reader `<img>` and `fetch` can release DOM/React references, but
  individual browser HTTP/decode cache eviction is neither requested nor
  claimed.
- React lazy chunks cannot be unloaded from the JavaScript module cache during
  the session; only their component/DOM instances unmount.
- Module-level geometries/materials deliberately remain session resources.
  Existing `dispose={null}` prevents local auto-disposal of shared objects.

## Missing variants and limitations

There are thumbnail/full variants for certificates. Phone, pinscher and Wall
have no semantic mobile/fallback variants. No replacements were invented.
Wall is the largest remaining eagerly decoded texture group and should be a
future variant candidate. Actual browser heap and GPU bytes remain unavailable.
