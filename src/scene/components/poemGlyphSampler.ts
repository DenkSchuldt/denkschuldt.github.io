export interface PoemGlyphSample {
  points: Float32Array;
  count: number;
  spacing: number;
}

interface GlyphBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const MAX_POINTS = 6000;
const MIN_STRIDE = 2;
const MAX_STRIDE = 10;
const COVERAGE_THRESHOLD = 110;
const SKIPPED_ANCESTORS = "figure, button, .poem-reader-image-actions";
const WHITESPACE = /\s/;

export function samplePoemGlyphs(root: HTMLElement): PoemGlyphSample | null {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewportWidth);
  canvas.height = Math.ceil(viewportHeight);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.fillStyle = "#000";
  context.textBaseline = "alphabetic";
  const bounds = rasterizeVisibleGlyphs(root, context, viewportWidth, viewportHeight);
  if (!bounds) return null;

  const left = Math.max(0, Math.floor(bounds.left));
  const top = Math.max(0, Math.floor(bounds.top));
  const width = Math.min(canvas.width, Math.ceil(bounds.right)) - left;
  const height = Math.min(canvas.height, Math.ceil(bounds.bottom)) - top;
  if (width <= 0 || height <= 0) return null;

  return collectCoveredPoints(context.getImageData(left, top, width, height), left, top);
}

function rasterizeVisibleGlyphs(
  root: HTMLElement,
  context: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
): GlyphBounds | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let bounds: GlyphBounds | null = null;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    const parent = text.parentElement;
    if (!parent || parent.closest(SKIPPED_ANCESTORS)) continue;

    const style = window.getComputedStyle(parent);
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const isUppercase = style.textTransform === "uppercase";
    const metrics = context.measureText("Hg");
    const ascent = metrics.fontBoundingBoxAscent;
    const fontHeight = ascent + metrics.fontBoundingBoxDescent;
    const data = text.data;

    for (let index = 0; index < data.length;) {
      const codePoint = data.codePointAt(index) ?? 0;
      const length = codePoint > 0xffff ? 2 : 1;
      const character = data.slice(index, index + length);
      const start = index;
      index += length;
      if (WHITESPACE.test(character)) continue;

      range.setStart(text, start);
      range.setEnd(text, start + length);
      const rect = glyphRect(range);
      if (!rect || rect.bottom < 0 || rect.top > viewportHeight) continue;
      if (rect.right < 0 || rect.left > viewportWidth) continue;

      const baseline = rect.top + (rect.height - fontHeight) / 2 + ascent;
      context.fillText(isUppercase ? character.toUpperCase() : character, rect.left, baseline);
      bounds = extendBounds(bounds, rect);
    }
  }
  range.detach();
  return bounds;
}

function glyphRect(range: Range) {
  const rects = range.getClientRects();
  for (let index = rects.length - 1; index >= 0; index--) {
    if (rects[index].width > 0) return rects[index];
  }
  return null;
}

function extendBounds(bounds: GlyphBounds | null, rect: DOMRect): GlyphBounds {
  if (!bounds) return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
  return {
    left: Math.min(bounds.left, rect.left),
    top: Math.min(bounds.top, rect.top),
    right: Math.max(bounds.right, rect.right),
    bottom: Math.max(bounds.bottom, rect.bottom),
  };
}

function collectCoveredPoints(
  { data, width, height }: ImageData,
  offsetX: number,
  offsetY: number,
): PoemGlyphSample | null {
  let stride = MIN_STRIDE;
  while (stride < MAX_STRIDE && countCovered(data, width, height, stride) > MAX_POINTS) stride++;

  const points = new Float32Array(MAX_POINTS * 2);
  const jitter = stride * 0.5;
  let count = 0;
  for (let y = 0; y < height && count < MAX_POINTS; y += stride) {
    for (let x = 0; x < width && count < MAX_POINTS; x += stride) {
      if (data[(y * width + x) * 4 + 3] < COVERAGE_THRESHOLD) continue;
      points[count * 2] = offsetX + x + (Math.random() - 0.5) * jitter;
      points[count * 2 + 1] = offsetY + y + (Math.random() - 0.5) * jitter;
      count++;
    }
  }
  if (count === 0) return null;
  return { points, count, spacing: stride };
}

function countCovered(data: Uint8ClampedArray, width: number, height: number, stride: number) {
  let covered = 0;
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      if (data[(y * width + x) * 4 + 3] >= COVERAGE_THRESHOLD) covered++;
    }
  }
  return covered;
}
