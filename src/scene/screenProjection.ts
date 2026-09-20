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
export interface ScreenProjectionRef {
  readonly current: ScreenProjection | null;
  publish: (projection: ScreenProjection) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createScreenProjection(): ScreenProjectionRef {
  let current: ScreenProjection | null = null;
  const listeners = new Set<() => void>();
  return {
    get current() {
      return current;
    },
    publish(projection) {
      current = projection;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
