import type { WebGLRenderer } from "three";

type ReflectionRenderer = Pick<
  WebGLRenderer,
  | "getRenderTarget"
  | "getActiveCubeFace"
  | "getActiveMipmapLevel"
  | "setRenderTarget"
  | "xr"
  | "autoClear"
>;

export function withReflectionRendererState<T>(renderer: ReflectionRenderer, prepare: () => T): T {
  const target = renderer.getRenderTarget();
  const cubeFace = renderer.getActiveCubeFace();
  const mipmapLevel = renderer.getActiveMipmapLevel();
  const xrEnabled = renderer.xr.enabled;
  const autoClear = renderer.autoClear;
  try {
    return prepare();
  } finally {
    // Three's PMREM cleanup is not reached if capture or filtering throws.
    // Restore the caller's render destination before temporary resources dispose.
    try {
      renderer.setRenderTarget(target, cubeFace, mipmapLevel);
    } finally {
      renderer.xr.enabled = xrEnabled;
      renderer.autoClear = autoClear;
    }
  }
}
