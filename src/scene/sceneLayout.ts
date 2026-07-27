export const POEMS_FOLDER_LAYOUT = {
  position: [1.35, 0.32] as [number, number],
  rotationDegrees: -20,
  worldCenter: [1.35, 1.2775, -1.18] as [number, number, number],
} as const;

const POEMS_ROTATION_RADIANS = (POEMS_FOLDER_LAYOUT.rotationDegrees * Math.PI) / 180;
export const POEMS_PAGE_LAYOUT = {
  worldCenter: [
    POEMS_FOLDER_LAYOUT.worldCenter[0] + Math.cos(POEMS_ROTATION_RADIANS) * 0.43,
    POEMS_FOLDER_LAYOUT.worldCenter[1] + 0.03,
    POEMS_FOLDER_LAYOUT.worldCenter[2] - Math.sin(POEMS_ROTATION_RADIANS) * 0.43,
  ] as [number, number, number],
  mobileReadingTarget: [
    POEMS_FOLDER_LAYOUT.worldCenter[0] + Math.cos(POEMS_ROTATION_RADIANS) * 0.4,
    POEMS_FOLDER_LAYOUT.worldCenter[1] + 0.03,
    POEMS_FOLDER_LAYOUT.worldCenter[2] - Math.sin(POEMS_ROTATION_RADIANS) * 0.4,
  ] as [number, number, number],
} as const;

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
    POEMS_FOLDER_LAYOUT.worldCenter[0] + Math.sin(POEMS_ROTATION_RADIANS) * groundDistance,
    height,
    POEMS_FOLDER_LAYOUT.worldCenter[2] + Math.cos(POEMS_ROTATION_RADIANS) * groundDistance,
  ];
}

export function poemsPageCameraPosition(
  height: number,
  groundDistance: number,
): [number, number, number] {
  return [
    POEMS_PAGE_LAYOUT.mobileReadingTarget[0] + Math.sin(POEMS_ROTATION_RADIANS) * groundDistance,
    height,
    POEMS_PAGE_LAYOUT.mobileReadingTarget[2] + Math.cos(POEMS_ROTATION_RADIANS) * groundDistance,
  ];
}
