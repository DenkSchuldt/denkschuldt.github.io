import type { QualityProfileId } from "../rendering/quality/types.ts";

export const MATERIAL_REFLECTIONS = {
  width: 256,
  height: 128,
  intensity: 0.55,
  // Three's 64px PMREM uses a 336 × 256 RGBA16F atlas, without mip allocation.
  estimatedAtlasBytes: 336 * 256 * 8,
  resourceId: "room-material-reflections",
} as const;

export function materialReflectionsEnabled(
  profile: QualityProfileId,
  blueprint: boolean,
  isolationEnabled: boolean,
) {
  return isolationEnabled && !blueprint && profile !== "mobile" && profile !== "fallback";
}

function smoothEdge(value: number, inner: number, outer: number) {
  const t = Math.max(0, Math.min(1, (value - inner) / (outer - inner)));
  return 1 - t * t * (3 - 2 * t);
}

export function createRoomReflectionPixels() {
  const { width, height } = MATERIAL_REFLECTIONS;
  const pixels = new Float32Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    const elevation = ((row + 0.5) / height - 0.5) * Math.PI;
    const y = Math.sin(elevation);
    const horizontal = Math.cos(elevation);
    for (let column = 0; column < width; column++) {
      const azimuth = ((column + 0.5) / width - 0.5) * Math.PI * 2;
      const x = Math.cos(azimuth) * horizontal;
      const z = Math.sin(azimuth) * horizontal;
      const floor = Math.max(0, -y);
      const blueWall = Math.max(0, x) * (1 - Math.abs(y));
      // Broad, softly edged daylight enters from the existing key-light side.
      // This describes reflected surroundings, not an added visible window.
      const window =
        x < -0.02
          ? smoothEdge(Math.abs(z / -x - 0.65), 0.58, 0.82) *
            smoothEdge(Math.abs(y / -x - 0.7), 0.48, 0.75)
          : 0;
      const frontWall = Math.max(0, z) ** 3 * (1 - Math.abs(y));
      const offset = (row * width + column) * 4;
      pixels[offset] = 0.105 + floor * 0.035 - blueWall * 0.045 + frontWall * 0.18 + window * 2.6;
      pixels[offset + 1] =
        0.112 - floor * 0.025 - blueWall * 0.025 + frontWall * 0.19 + window * 2.7;
      pixels[offset + 2] = 0.12 - floor * 0.065 + blueWall * 0.005 + frontWall * 0.2 + window * 2.8;
      pixels[offset + 3] = 1;
    }
  }
  return pixels;
}
