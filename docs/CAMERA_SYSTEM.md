# Cinematic camera system

Camera targets live in `src/scene/camera/cameraTargets.ts`. Each strongly typed target defines position, interpolated look-at, FOV, duration, optional focus distance, idle breathing, waypoint, and responsive overrides.

## Adding a target

1. Add the ID to `CameraTargetId` in `cameraTypes.ts`.
2. Add a complete entry to `CAMERA_TARGETS`.
3. Add the ID to the Leva selector in `useCinematicCamera.ts`.

Development validation warns about malformed vectors, invalid durations, and cameras too close to their look-at points.

## Transitions

`CameraRig` animates position, look-at, FOV, and depth-of-field focus together using a quintic cinematic ease. Optional waypoints use a quadratic Bézier path to avoid major scene geometry. Idle breathing begins only after arrival and is derived from an immutable base pose, preventing drift.

## Responsive framing

`resolveCameraTarget` selects desktop, tablet, or mobile overrides from the viewport aspect ratio. Overrides deliberately recompose the frame rather than uniformly scaling camera coordinates.

## Reduced motion

`prefers-reduced-motion` skips the long intro, shortens later transitions, uses a short fade, and disables idle breathing.

## Future object navigation

Future object clicks should request a target through the same camera state used by the temporary Leva selector. Scene objects should never manipulate the Three.js camera directly.
