export const POEMS_FOLDER_LAYOUT={
  position:[1.35,.32] as [number,number],
  rotationDegrees:-20,
  worldCenter:[1.35,1.2775,-1.18] as [number,number,number],
} as const;

export const PHONE_LAYOUT={
  localPosition:[-.55,-.047,.77] as [number,number,number],
  rotationDegrees:33,
  worldCenter:[-.55,1.263,-.73] as [number,number,number],
  cameraTarget:[-.55,1.263,-.73] as [number,number,number],
  cameraPosition:[-.329,2.841,-.304] as [number,number,number],
  tabletCameraPosition:[-.315,2.96,-.28] as [number,number,number],
  mobileCameraPosition:[-.285,3.15,-.22] as [number,number,number],
} as const;

export function poemsAlignedCameraPosition(height:number,groundDistance:number):[number,number,number]{
  const angle=POEMS_FOLDER_LAYOUT.rotationDegrees*Math.PI/180;
  return [
    POEMS_FOLDER_LAYOUT.worldCenter[0]+Math.sin(angle)*groundDistance,
    height,
    POEMS_FOLDER_LAYOUT.worldCenter[2]+Math.cos(angle)*groundDistance,
  ];
}
