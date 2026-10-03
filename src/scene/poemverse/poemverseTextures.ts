import * as THREE from "three";

type GlowStop = readonly [offset: number, color: string];

const GLOW_TEXTURE_SIZE = 128;
const SPIKE_TEXTURE_SIZE = 256;

export function createGlowTexture(stops: readonly GlowStop[]) {
  const canvas = document.createElement("canvas");
  canvas.width = GLOW_TEXTURE_SIZE;
  canvas.height = GLOW_TEXTURE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Poemverse glow texture requires a 2D canvas context");
  const center = GLOW_TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);
  return finishTexture(canvas);
}

export function createSpikeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = SPIKE_TEXTURE_SIZE;
  canvas.height = SPIKE_TEXTURE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Poemverse spike texture requires a 2D canvas context");
  const center = SPIKE_TEXTURE_SIZE / 2;
  context.translate(center, center);
  context.globalCompositeOperation = "lighter";
  drawSpikePair(context, center, 3.2, 1);
  context.rotate(Math.PI / 2);
  drawSpikePair(context, center, 3.2, 1);
  context.rotate(Math.PI / 4);
  drawSpikePair(context, center * 0.48, 1.6, 0.42);
  context.rotate(Math.PI / 2);
  drawSpikePair(context, center * 0.48, 1.6, 0.42);
  return finishTexture(canvas);
}

function drawSpikePair(
  context: CanvasRenderingContext2D,
  length: number,
  thickness: number,
  strength: number,
) {
  const gradient = context.createLinearGradient(-length, 0, length, 0);
  gradient.addColorStop(0, "rgba(255, 236, 214, 0)");
  gradient.addColorStop(0.5, `rgba(255, 246, 232, ${strength})`);
  gradient.addColorStop(1, "rgba(255, 236, 214, 0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(-length, 0);
  context.quadraticCurveTo(0, -thickness, length, 0);
  context.quadraticCurveTo(0, thickness, -length, 0);
  context.fill();
}

function finishTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
