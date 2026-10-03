import * as THREE from "three";

import constellationData from "./constellations.json";

type SkyPoint = [number, number];
type LayoutKind = "landscape" | "portrait";

interface ConstellationStarData {
  slug: string;
  title: string;
  offset: number[];
}

interface ConstellationPlacement {
  centre: number[];
  rotation: number;
}

interface ConstellationData {
  id: string;
  name: string;
  theme: string;
  tint: string;
  layout: Record<LayoutKind, ConstellationPlacement>;
  stars: ConstellationStarData[];
  lines: string[][];
}

interface ConstellationFile {
  layouts: Record<LayoutKind, { scale: number }>;
  constellations: ConstellationData[];
  bridges: { from: string; to: string; reason: string }[];
}

export interface SkyStar {
  index: number;
  slug: string;
  title: string;
  constellationIndex: number;
  sky: SkyPoint;
  tint: THREE.Color;
}

export interface SkyLine {
  from: number;
  to: number;
  constellationIndex: number;
  isBridge: boolean;
  order: number;
}

export interface SkyLabel {
  constellationIndex: number;
  name: string;
  theme: string;
  sky: SkyPoint;
  tint: string;
}

export interface SkyBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SkyLayout {
  stars: SkyStar[];
  lines: SkyLine[];
  labels: SkyLabel[];
  bounds: SkyBounds;
}

export interface ConstellationSummary {
  id: string;
  name: string;
  theme: string;
  poems: { slug: string; title: string }[];
}

const LABEL_DROP = 0.62;
const data = constellationData as ConstellationFile;

export const CONSTELLATION_SUMMARIES: readonly ConstellationSummary[] = data.constellations.map(
  (constellation) => ({
    id: constellation.id,
    name: constellation.name,
    theme: constellation.theme,
    poems: constellation.stars.map(({ slug, title }) => ({ slug, title })),
  }),
);

export function resolveSkyLayout(aspect: number): SkyLayout {
  const kind: LayoutKind = aspect < 0.9 ? "portrait" : "landscape";
  const scale = data.layouts[kind].scale;
  const stars: SkyStar[] = [];
  const lines: SkyLine[] = [];
  const labels: SkyLabel[] = [];
  const indexBySlug = new Map<string, number>();

  data.constellations.forEach((constellation, constellationIndex) => {
    const placement = constellation.layout[kind];
    const [centreX, centreY] = placement.centre;
    const angle = THREE.MathUtils.degToRad(placement.rotation);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const tint = new THREE.Color(constellation.tint);
    constellation.stars.forEach((star) => {
      const [offsetX, offsetY] = star.offset;
      const rotatedX = offsetX * cosine - offsetY * sine;
      const rotatedY = offsetX * sine + offsetY * cosine;
      const index = stars.length;
      indexBySlug.set(star.slug, index);
      stars.push({
        index,
        slug: star.slug,
        title: star.title,
        constellationIndex,
        sky: [(centreX + rotatedX) * scale, (centreY + rotatedY) * scale],
        tint,
      });
    });
    labels.push({
      constellationIndex,
      name: constellation.name,
      theme: constellation.theme,
      sky: [centreX * scale, (centreY - LABEL_DROP) * scale],
      tint: constellation.tint,
    });
  });

  data.constellations.forEach((constellation, constellationIndex) => {
    constellation.lines.forEach(([from, to], order) => {
      const fromIndex = indexBySlug.get(from);
      const toIndex = indexBySlug.get(to);
      if (fromIndex === undefined || toIndex === undefined) return;
      lines.push({ from: fromIndex, to: toIndex, constellationIndex, isBridge: false, order });
    });
  });

  data.bridges.forEach(({ from, to }, order) => {
    const fromIndex = indexBySlug.get(from);
    const toIndex = indexBySlug.get(to);
    if (fromIndex === undefined || toIndex === undefined) return;
    lines.push({ from: fromIndex, to: toIndex, constellationIndex: -1, isBridge: true, order });
  });

  return { stars, lines, labels, bounds: measureBounds(stars, labels) };
}

export function findSkyStar(layout: SkyLayout, slug: string | null) {
  if (!slug) return null;
  return layout.stars.find((star) => star.slug === slug) ?? null;
}

function measureBounds(stars: SkyStar[], labels: SkyLabel[]): SkyBounds {
  const points = [...stars.map((star) => star.sky), ...labels.map((label) => label.sky)];
  return {
    minX: Math.min(...points.map(([x]) => x)),
    maxX: Math.max(...points.map(([x]) => x)),
    minY: Math.min(...points.map(([, y]) => y)),
    maxY: Math.max(...points.map(([, y]) => y)),
  };
}
