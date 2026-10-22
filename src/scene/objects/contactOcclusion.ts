export interface ContactFootprint {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation: number;
  radius: number;
  softness: number;
  strength: number;
}

export const DESK_CONTACT_MAP_SIZE = [256, 128] as const;
export const DESK_CONTACT_EXTENT = [5.5, 2.2] as const;

// Receiver-space AO: only the permanent paper and phone, never fading/moving objects.
// Rounded-rectangle distance gives a narrow contact core rather than a floating dark halo.
export function createContactOcclusionData(footprints: readonly ContactFootprint[]) {
  const [width, height] = DESK_CONTACT_MAP_SIZE;
  const data = new Uint8Array(width * height).fill(255);
  for (const footprint of footprints) {
    const cosine = Math.cos((footprint.rotation * Math.PI) / 180);
    const sine = Math.sin((footprint.rotation * Math.PI) / 180);
    // Process only each small footprint's bounds, not every texel for every object.
    const margin = footprint.softness * 6;
    const halfX =
      (Math.abs(cosine) * footprint.width) / 2 + (Math.abs(sine) * footprint.depth) / 2 + margin;
    const halfZ =
      (Math.abs(sine) * footprint.width) / 2 + (Math.abs(cosine) * footprint.depth) / 2 + margin;
    const columnStart = Math.max(
      0,
      Math.floor(((footprint.x - halfX) / DESK_CONTACT_EXTENT[0] + 0.5) * width),
    );
    const columnEnd = Math.min(
      width,
      Math.ceil(((footprint.x + halfX) / DESK_CONTACT_EXTENT[0] + 0.5) * width),
    );
    const rowStart = Math.max(
      0,
      Math.floor(((footprint.z - halfZ) / DESK_CONTACT_EXTENT[1] + 0.5) * height),
    );
    const rowEnd = Math.min(
      height,
      Math.ceil(((footprint.z + halfZ) / DESK_CONTACT_EXTENT[1] + 0.5) * height),
    );
    for (let row = rowStart; row < rowEnd; row++) {
      for (let column = columnStart; column < columnEnd; column++) {
        const dx = ((column + 0.5) / width - 0.5) * DESK_CONTACT_EXTENT[0] - footprint.x;
        const dz = ((row + 0.5) / height - 0.5) * DESK_CONTACT_EXTENT[1] - footprint.z;
        const localX = dx * cosine - dz * sine;
        const localZ = dx * sine + dz * cosine;
        const qx = Math.abs(localX) - footprint.width / 2 + footprint.radius;
        const qz = Math.abs(localZ) - footprint.depth / 2 + footprint.radius;
        const distance =
          Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) +
          Math.min(Math.max(qx, qz), 0) -
          footprint.radius;
        const falloff = Math.exp(-Math.max(distance, 0) / footprint.softness);
        const index = row * width + column;
        data[index] = Math.round(data[index] * (1 - footprint.strength * falloff));
      }
    }
  }
  return data;
}
