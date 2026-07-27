# Phase 4 — First-use preparation and attribution

## Evidence ladder

First-use records distinguish navigation requested, working-set preparation,
loader completion, image decode as reported by `TextureLoader`, Texture
construction, `WebGLRenderer.initTexture()` request, first renderer texture
count change, destination visibility, camera arrival and first stable frame.
The current runtime cannot directly prove upload completion or shader GPU time.

Owned Certificate, Phone and Pinscher textures are decoded while their
destination is preparing. The owner then calls `initTexture()` on the existing
renderer before publication and invalidates with `asset-ready`. The event text
explicitly says that first visible sampling remains unverified. Cancelled late
completions are disposed and never published.

The poem preview performs layout and Canvas drawing before publishing its
single `CanvasTexture`; regeneration is keyed by slug/title/body/date, and the
previous texture is disposed. One attributed invalidation follows publication.

## Bounded policy

| Profile             | Preparation                                          |
| ------------------- | ---------------------------------------------------- |
| Ultra/High/Balanced | actual requested destination owned textures          |
| Mobile              | requested destination, tighter Phase 3 retention     |
| Fallback            | requested destination only; no speculative retention |

No full-world `compile()` is performed. In this persistent world that call
would compile materials for unrelated destinations. Candidate shader warm-up
therefore remains evidence-gated; texture initialisation is the only shipped
GPU preparation mechanism.

Hits, misses and waste require a destination-visible marker correlated with
preparation generations. The current short validation observed successful
pre-arrival publication but did not produce three controlled hit/miss/waste
runs. These values remain unavailable rather than being reported as zero.
