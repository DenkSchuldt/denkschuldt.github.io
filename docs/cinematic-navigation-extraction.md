# Cinematic navigation extraction

## Current architecture audit

Before extraction, `useCinematicCamera.ts` combined logical navigation, React state, browser persistence, input listeners, Leva controls, portfolio registries, and the mutable camera snapshot. `CameraRig.tsx` already contained the proven interpolation behavior, while `sceneRegistry.ts` held both the domain graph and all manually tuned portfolio framing. `sceneRoutes.ts` and `useSceneRouter.ts` owned URL parsing and browser history. This made the behavior reliable but prevented reuse because the logical engine imported React, browser APIs, portfolio IDs, routes, and certificate content.

The dependency path is now:

```text
Portfolio configuration and UI
  -> React/browser/R3F integration
    -> @denk/cinematic-navigation core
```

The package never imports from `app/` or `src/scene/`.

## Package boundary map

| Boundary | Owns | Must not own |
| --- | --- | --- |
| `packages/cinematic-navigation/src/core` | registration, authoritative logical state, guided navigation, Focus navigation, spatial resolution, transition lifecycle | React, Three.js, DOM, storage, routes, portfolio IDs |
| `react` | provider, external-store selectors, registration hooks | camera interpolation, portfolio components |
| `r3f` | live `Object3D` subject registry | portfolio objects or framing values |
| `input` | normalized generic intents | DOM listeners and portfolio priority overrides |
| `router` | optional router contract and basename utilities | concrete URLs or History API policy |
| `persistence` | injected web/memory storage adapters | persistence policy or deep-link precedence |
| `testing` | state fixtures and subscription recorder | application fixtures |
| `src/scene/camera` | portfolio registry, routes, controls, visual camera driver and compatibility API | reusable engine behavior |

## Concrete migration

1. `navigationTypes.ts` and `sceneRegistry.ts` remain the portfolio domain/configuration source, including exact camera values.
2. `portfolioEngine.ts` adapts those registrations to the public headless API.
3. `useCinematicCamera.ts` retains its compatibility surface but delegates Scene/Focus commands, persistence, transition state, and spatial movement to the package.
4. `CameraRig.tsx` remains the proven R3F interpolation driver and reports progress/completion/viewport/intro state to the engine.
5. `sceneRoutes.ts` remains portfolio-specific and consumes generic basename helpers.
6. Scene components continue emitting stable Focus IDs rather than camera coordinates.

## Preserved application behavior

- Guided order and forward Drawer-to-Opening loop.
- Exact About framing, responsive overrides, transition timing, typography and lighting.
- Direct certificate-to-certificate camera movement and explicit row neighbors.
- Route parsing, optional basename handling, deep links, Back/Forward and push/replace policy.
- Keyboard, pointer, mobile tap/navigation controls and trackpad pinch interruption.
- Reduced-motion and last-Scene persistence behavior.

## Compatibility and deprecation

No module has been deleted during the incremental migration. `shotRegistry.ts`, `ShotId`, `useCinematicShots`, `useCinematicCamera`, and the camera-target aliases remain compatibility adapters for the visual camera layer. New domain navigation should use Scene/Focus commands. They can be removed only after the camera driver no longer needs target-name compatibility and a later migration has its own regression pass.

## Validation order

The application remains validated in its existing order: Opening, About, Certificates, Projects, Wall, Phone, Poems, Drawer. Certificates additionally validate direct Focus transitions and row movement. Numeric regression assertions protect manually tuned About and certificate framing; package tests protect registration, looping, Focus, spatial fallback, interruption, consistency, errors, and persistence.

## Behavior exceptions

None are intentionally introduced. Subject registration is available through the R3F entry point, but the current portfolio camera continues using its manually tuned framing registry rather than auto-fitting live objects; this is deliberate so the extraction cannot alter composition.
