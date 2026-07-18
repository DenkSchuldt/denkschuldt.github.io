export const POEMS_FOLDER_LAYOUT={
  position:[1.35,.32] as [number,number],
  rotationDegrees:-20,
  worldCenter:[1.35,1.2775,-1.18] as [number,number,number],
} as const;

export function poemsAlignedCameraPosition(height:number,groundDistance:number):[number,number,number]{
  const angle=POEMS_FOLDER_LAYOUT.rotationDegrees*Math.PI/180;
  return [
    POEMS_FOLDER_LAYOUT.worldCenter[0]+Math.sin(angle)*groundDistance,
    height,
    POEMS_FOLDER_LAYOUT.worldCenter[2]+Math.cos(angle)*groundDistance,
  ];
}
