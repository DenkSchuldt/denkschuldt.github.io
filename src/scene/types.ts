export type CameraTargetName = "Opening" | "Projects" | "Desk" | "Folder" | "Wall" | "Drawer";
export interface CameraTarget { position: [number, number, number]; lookAt: [number, number, number]; fov: number; duration: number; }
export type CameraTargetMap = Record<CameraTargetName, CameraTarget>;
