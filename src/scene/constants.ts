import type { CameraTargetMap } from "./types";

export const PALETTE = {
  floor: "#29231d",
  wood: "#38261b",
  woodEdge: "#211712",
  metal: "#111111",
  paper: "#c8bda7",
  leather: "#4b2d20",
  ceramic: "#9c9588",
  green: "#344334",
  screen: "#161714",
  poster: "#716b60",
} as const;

export const CAMERA_TARGETS: CameraTargetMap = {
  Opening: { position: [-0.72, 1.9, 4.82], lookAt: [0, 1.5, -1.48], fov: 42, duration: 5.8 },
  Projects: { position: [0.35, 2.06, 3.52], lookAt: [0, 1.78, -1.9], fov: 37, duration: 4.8 },
  Desk: { position: [2.55, 2.2, 2.75], lookAt: [-0.7, 1.3, -1.45], fov: 40, duration: 3.8 },
  Folder: { position: [1.9, 2.6, 1.1], lookAt: [-0.75, 1.13, -1.15], fov: 32, duration: 3.5 },
  Wall: { position: [4.9, 3.2, 2.2], lookAt: [2.6, 2.8, -3.75], fov: 38, duration: 4 },
  Drawer: { position: [3.0, 1.75, 1.3], lookAt: [1.5, 0.75, -1.65], fov: 35, duration: 3.5 },
};
