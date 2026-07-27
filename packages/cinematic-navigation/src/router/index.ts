import type { NavigationLocation } from "../core/index.js";

export interface NavigationRouterAdapter {
  read(): NavigationLocation | null;
  write(location: NavigationLocation, mode: "push" | "replace"): void;
  subscribe(listener: (location: NavigationLocation) => void): () => void;
}

export const normalizeBasename = (basename: string) =>
  basename === "/" ? "" : basename.replace(/\/$/, "");
export const addBasename = (path: string, basename = "") =>
  `${normalizeBasename(basename)}${path === "/" ? "/" : path}`;
export function removeBasename(path: string, basename = "") {
  const base = normalizeBasename(basename);
  if (!base) return path;
  const stripped = path.startsWith(`${base}/`) ? path.slice(base.length) : path;
  return stripped || "/";
}
