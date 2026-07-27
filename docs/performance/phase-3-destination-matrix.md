# Phase 3 — Destination working-set matrix

| Destination  | Persistent                    | Ambient                        | Preparing                                                   | Active                                                                                       | Sleeping                                                                                  | Released                                                                                                       |
| ------------ | ----------------------------- | ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Opening      | room, global camera/lights    | complete room                  | none                                                        | intro/workspace camera                                                                       | shared world remains                                                                      | no destination-owned resource                                                                                  |
| About        | desk/laptop/objects           | authored desk view             | none                                                        | reading composition                                                                          | shared world remains                                                                      | no destination-owned resource                                                                                  |
| Certificates | shelf/frame geometry/decor    | empty framed shelf silhouettes | 14 owned thumbnails                                         | thumbnails, card interactions, 14 scheduler tasks, shelf lights; selected original HTML only | thumbnails retained by profile; tasks skipped, handlers/raycast removed, lights unmounted | card subtree unmounted; thumbnail refs removed; 14 `dispose()` calls; browser/GPU bytes unverified             |
| Projects     | laptop body/screen plane      | dark laptop screen             | lazy overlay chunk                                          | projected DOM overlay and links                                                              | component may remain for profile retention without active projection                      | overlay unmounted; JS module cache remains                                                                     |
| Wall         | frames and four shared images | full wall composition          | already session-cached                                      | unchanged during auto-pass                                                                   | session retained to prevent churn                                                         | not released in Phase 3                                                                                        |
| Phone        | phone body/dark glass         | dark stable screen             | owned `phone.jpeg`                                          | screen, WhatsApp interaction, task, local light                                              | texture retained by profile; task skipped; handlers/raycast/light inactive                | screen subtree unmounted; refs removed; `dispose()` called; browser/GPU bytes unverified                       |
| Poems        | notebook geometry             | dark page/photo                | manifest, selected/neighbor markdown, pinscher, one preview | preview, cue, interactions, reading light/tasks                                              | bounded metadata/body/texture retention by profile; tasks skipped                         | body refs cleared; pinscher/CanvasTexture refs removed and `dispose()` called; fetch/browser caches unverified |
| Drawer       | drawer geometry in Desk       | complete authored drawer       | none                                                        | camera destination only                                                                      | shared world remains                                                                      | no destination-owned resource                                                                                  |

## Overlay paths

- Certificate originals exist only for the selected overlay item. Closing or
  changing selection unmounts/releases the HTML image reference; browser cache
  residency is unknown.
- Poem reader code and DOM mount only while open. Closing keeps the selected
  bounded poem state while still in Poems; departure releases body references.
- Project overlay is lazy and destination-scoped; it has no heavy local media
  in the current repository.

## Ambient continuity

No destination creates a new Canvas or world. Every release returns to an
authored cheap representation: empty certificate frames, dark phone screen,
notebook/page, laptop screen, or the unchanged shared room. Wall stays fully
ambient because a lower variant does not exist and removing it would visibly
change About/room composition.
