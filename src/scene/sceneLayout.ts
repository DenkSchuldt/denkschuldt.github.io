export const POEMS_TABLET_LAYOUT = {
  position: [1.35, 0.32] as [number, number],
  rotationDegrees: -20,
  worldCenter: [1.35, 1.282, -1.18] as [number, number, number],
} as const;

const POEMS_ROTATION_RADIANS = (POEMS_TABLET_LAYOUT.rotationDegrees * Math.PI) / 180;

export const PHONE_LAYOUT = {
  localPosition: [-0.55, -0.047, 0.77] as [number, number, number],
  rotationDegrees: 33,
  worldCenter: [-0.55, 1.263, -0.73] as [number, number, number],
  cameraTarget: [-0.55, 1.263, -0.73] as [number, number, number],
  cameraPosition: [-0.329, 2.841, -0.304] as [number, number, number],
  tabletCameraPosition: [-0.315, 2.96, -0.28] as [number, number, number],
  mobileCameraPosition: [-0.285, 3.15, -0.22] as [number, number, number],
} as const;

export function poemsAlignedCameraPosition(
  height: number,
  groundDistance: number,
): [number, number, number] {
  return [
    POEMS_TABLET_LAYOUT.worldCenter[0] + Math.sin(POEMS_ROTATION_RADIANS) * groundDistance,
    height,
    POEMS_TABLET_LAYOUT.worldCenter[2] + Math.cos(POEMS_ROTATION_RADIANS) * groundDistance,
  ];
}
