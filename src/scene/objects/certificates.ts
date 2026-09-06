import { CERTIFICATES } from "../../content/certificates.ts";

import type { CertificateRecord } from "../../content/certificates.ts";

export { CERTIFICATES };
export type { CertificateRecord };

export const CERTIFICATE_LAYOUT = [
  {
    index: 0,
    row: 0,
    column: 0,
    x: -0.825,
    y: 1.275,
    rotation: -0.026,
    tiltY: 0.018,
    scale: 1.04,
    depth: 0.372,
  },
  {
    index: 1,
    row: 0,
    column: 1,
    x: -0.275,
    y: 1.275,
    rotation: 0.014,
    tiltY: -0.012,
    scale: 0.93,
    depth: 0.36,
  },
  {
    index: 2,
    row: 0,
    column: 2,
    x: 0.275,
    y: 1.275,
    rotation: -0.008,
    tiltY: 0.015,
    scale: 0.97,
    depth: 0.368,
  },
  {
    index: 3,
    row: 0,
    column: 3,
    x: 0.825,
    y: 1.275,
    rotation: 0.032,
    tiltY: -0.02,
    scale: 0.88,
    depth: 0.354,
  },
  {
    index: 4,
    row: 1,
    column: 0,
    x: -0.825,
    y: 0.425,
    rotation: 0.018,
    tiltY: -0.014,
    scale: 0.91,
    depth: 0.362,
  },
  {
    index: 5,
    row: 1,
    column: 1,
    x: -0.275,
    y: 0.425,
    rotation: -0.022,
    tiltY: 0.012,
    scale: 0.99,
    depth: 0.374,
  },
  {
    index: 6,
    row: 1,
    column: 2,
    x: 0.275,
    y: 0.425,
    rotation: 0.026,
    tiltY: -0.016,
    scale: 0.92,
    depth: 0.358,
  },
  {
    index: 7,
    row: 1,
    column: 3,
    x: 0.825,
    y: 0.425,
    rotation: -0.012,
    tiltY: 0.02,
    scale: 0.86,
    depth: 0.37,
  },
  {
    index: 8,
    row: 2,
    column: 0,
    x: -0.62,
    y: -0.425,
    rotation: -0.024,
    tiltY: 0.016,
    scale: 0.96,
    depth: 0.368,
  },
  {
    index: 9,
    row: 2,
    column: 1,
    x: 0,
    y: -0.425,
    rotation: 0.012,
    tiltY: -0.012,
    scale: 1.06,
    depth: 0.38,
  },
  {
    index: 10,
    row: 2,
    column: 2,
    x: 0.62,
    y: -0.425,
    rotation: 0.028,
    tiltY: 0.018,
    scale: 0.93,
    depth: 0.36,
  },
  {
    index: 11,
    row: 3,
    column: 0,
    x: -0.825,
    y: -1.275,
    rotation: 0.026,
    tiltY: -0.016,
    scale: 0.89,
    depth: 0.36,
  },
  {
    index: 12,
    row: 3,
    column: 1,
    x: -0.275,
    y: -1.275,
    rotation: -0.016,
    tiltY: 0.012,
    scale: 0.97,
    depth: 0.374,
  },
  {
    index: 13,
    row: 3,
    column: 2,
    x: 0.275,
    y: -1.275,
    rotation: 0.018,
    tiltY: -0.018,
    scale: 0.91,
    depth: 0.362,
  },
  {
    index: 14,
    row: 3,
    column: 3,
    x: 0.825,
    y: -1.275,
    rotation: -0.022,
    tiltY: 0.02,
    scale: 0.94,
    depth: 0.366,
  },
] as const;

export interface CertificateFocus {
  x: number;
  y: number;
  slug: string;
}

export function getCertificateFocusBySlug(slug?: string | null): CertificateFocus | null {
  if (!slug) return null;
  const index = CERTIFICATES.findIndex((certificate) => certificate.slug === slug);
  const position = CERTIFICATE_LAYOUT.find((item) => item.index === index);
  return index < 0 || !position ? null : { x: position.x, y: position.y, slug };
}
