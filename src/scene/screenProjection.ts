import type { MutableRefObject } from "react";

export interface ScreenProjectionPoint {
  x: number;
  y: number;
}
export interface ScreenProjection {
  points: readonly [
    ScreenProjectionPoint,
    ScreenProjectionPoint,
    ScreenProjectionPoint,
    ScreenProjectionPoint,
  ];
  viewport: { width: number; height: number };
}
export type ScreenProjectionRef = MutableRefObject<ScreenProjection | null>;
