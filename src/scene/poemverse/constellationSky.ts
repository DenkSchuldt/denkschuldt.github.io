import * as THREE from "three";

import { POEMVERSE_CEILING_HEIGHT } from "./poemverseCeiling";

import type { SkyLayout } from "./constellationLayout";

export interface SkyBasis {
  centre: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
}

export const RIPPLE_SPEED = 2.6;

const SKY_HEIGHT = POEMVERSE_CEILING_HEIGHT - 0.006;
const LINE_START_SECONDS = 1.7;
const LINE_GROUP_STAGGER = 0.3;
const LINE_STAGGER = 0.14;
const BRIDGE_START_SECONDS = 4.4;
const LINE_DRAW_SECONDS = 0.8;
const LABEL_FADE_SECONDS = 1.2;
const LABEL_WIDTH = 1.15;
const LABEL_TEXTURE_WIDTH = 640;
const LABEL_TEXTURE_HEIGHT = 128;
const STAR_SIZE = 0.075;

export const LINE_STYLE = {
  structural: { opacity: 0.34, hoverBoost: 1.3, penGlow: 0.9 },
  literary: {
    opacityRatio: 0.25,
    highlightRatio: 0.6,
    dimmedRatio: 0.1,
    luminance: 0.72,
    dashesPerMetre: 7,
    dashDuty: 0.4,
  },
} as const;

const STAR_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uHover;
  uniform float uHoverGroup;
  attribute vec3 aTint;
  attribute float aDelay;
  attribute float aSeed;
  attribute float aGroup;
  attribute float aIndex;
  varying vec3 vTint;
  varying float vAlpha;
  varying float vFlash;
  varying float vHover;

  void main() {
    float age = uTime - aDelay;
    float lit = smoothstep(0.0, 0.5, age);
    float flash = age >= 0.0 ? exp(-age * 2.6) : 0.0;
    float hovered = 1.0 - step(0.5, abs(aIndex - uHover));
    float inGroup = 1.0 - step(0.5, abs(aGroup - uHoverGroup));
    float twinkle = 0.82 + 0.18 * sin(uTime * (1.1 + aSeed * 2.3) + aSeed * 31.0);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float size = ${STAR_SIZE.toFixed(3)} * (0.75 + aSeed * 0.5) * (1.0 + flash * 1.8 + hovered * 0.9 + inGroup * 0.25);
    gl_PointSize = lit * twinkle * size * uScale / max(0.05, -viewPosition.z);
    vTint = aTint;
    vAlpha = lit;
    vFlash = flash;
    vHover = max(hovered, inGroup * 0.4);
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vTint;
  varying float vAlpha;
  varying float vFlash;
  varying float vHover;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float radius = dot(uv, uv);
    float core = exp(-radius * 16.0);
    float halo = exp(-radius * 3.6) * (0.32 + vHover * 0.25);
    float glint =
      exp(-abs(uv.x) * 30.0) * exp(-abs(uv.y) * 2.4) +
      exp(-abs(uv.y) * 30.0) * exp(-abs(uv.x) * 2.4);
    float shape = core + halo + glint * (0.35 + vFlash * 0.8 + vHover * 0.4);
    vec3 color = mix(vTint, vec3(1.0, 0.97, 0.92), clamp(core * 0.8 + vFlash * 0.5, 0.0, 1.0));
    float alpha = shape * vAlpha;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const LINE_VERTEX_SHADER = /* glsl */ `
  attribute float aAlong;
  attribute float aDelay;
  attribute float aGroup;
  attribute float aBridge;
  attribute float aLength;
  attribute float aFromIndex;
  attribute float aToIndex;
  attribute vec3 aTint;
  varying float vAlong;
  varying float vDelay;
  varying float vGroup;
  varying float vBridge;
  varying float vLength;
  varying float vFromIndex;
  varying float vToIndex;
  varying vec3 vTint;

  void main() {
    vAlong = aAlong;
    vDelay = aDelay;
    vGroup = aGroup;
    vBridge = aBridge;
    vLength = aLength;
    vFromIndex = aFromIndex;
    vToIndex = aToIndex;
    vTint = aTint;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uHoverGroup;
  uniform float uStructuralOpacity;
  uniform float uStructuralHoverBoost;
  uniform float uStructuralPenGlow;
  uniform float uLiteraryOpacity;
  uniform float uLiteraryHighlightOpacity;
  uniform float uLiteraryDimmedOpacity;
  uniform float uLiteraryLuminance;
  uniform float uLiteraryDashFrequency;
  uniform float uLiteraryDashDuty;
  varying float vAlong;
  varying float vDelay;
  varying float vGroup;
  varying float vBridge;
  varying float vLength;
  varying float vFromIndex;
  varying float vToIndex;
  varying vec3 vTint;

  void main() {
    float progress = clamp((uTime - vDelay) / ${LINE_DRAW_SECONDS.toFixed(2)}, 0.0, 1.0);
    if (vAlong > progress) discard;

    if (vBridge > 0.5) {
      if (fract(vAlong * vLength * uLiteraryDashFrequency) > uLiteraryDashDuty) discard;
      float isSelecting = step(-0.5, uHover);
      float touchesSelection = max(
        1.0 - step(0.5, abs(vFromIndex - uHover)),
        1.0 - step(0.5, abs(vToIndex - uHover))
      );
      float selectedOpacity = mix(uLiteraryDimmedOpacity, uLiteraryHighlightOpacity, touchesSelection);
      float opacity = mix(uLiteraryOpacity, selectedOpacity, isSelecting);
      gl_FragColor = vec4(vTint * uLiteraryLuminance, opacity);
      #include <colorspace_fragment>
      return;
    }

    float inGroup = step(-0.5, uHoverGroup) * (1.0 - step(0.5, abs(vGroup - uHoverGroup)));
    float base = uStructuralOpacity * (1.0 + inGroup * uStructuralHoverBoost);
    float pen = progress < 1.0 ? exp(-(progress - vAlong) * vLength * 9.0) : 0.0;
    vec3 color = mix(vTint, vec3(1.0, 0.96, 0.9), pen);
    gl_FragColor = vec4(color, clamp(base + pen * uStructuralPenGlow, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

const projected = new THREE.Vector3();

export class ConstellationSky {
  readonly group = new THREE.Group();
  private readonly layout: SkyLayout;
  private readonly worldPositions: THREE.Vector3[];
  private readonly delays: Float32Array;
  private readonly starGeometry = new THREE.BufferGeometry();
  private readonly lineGeometry = new THREE.BufferGeometry();
  private readonly starMaterial: THREE.ShaderMaterial;
  private readonly lineMaterial: THREE.ShaderMaterial;
  private readonly labelMeshes: THREE.Mesh[] = [];
  private readonly labelMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly labelTextures: THREE.Texture[] = [];
  private readonly labelGeometry = new THREE.PlaneGeometry(1, 1);
  private readonly labelDelays: number[] = [];
  private drawnBy = Infinity;

  constructor(layout: SkyLayout) {
    this.layout = layout;
    this.worldPositions = layout.stars.map(() => new THREE.Vector3());
    this.delays = new Float32Array(layout.stars.length);
    this.starMaterial = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: -1000 },
        uScale: { value: 1 },
        uHover: { value: -1 },
        uHoverGroup: { value: -1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.lineMaterial = new THREE.ShaderMaterial({
      vertexShader: LINE_VERTEX_SHADER,
      fragmentShader: LINE_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: -1000 },
        uHover: { value: -1 },
        uHoverGroup: { value: -1 },
        uStructuralOpacity: { value: LINE_STYLE.structural.opacity },
        uStructuralHoverBoost: { value: LINE_STYLE.structural.hoverBoost },
        uStructuralPenGlow: { value: LINE_STYLE.structural.penGlow },
        uLiteraryOpacity: {
          value: LINE_STYLE.structural.opacity * LINE_STYLE.literary.opacityRatio,
        },
        uLiteraryHighlightOpacity: {
          value: LINE_STYLE.structural.opacity * LINE_STYLE.literary.highlightRatio,
        },
        uLiteraryDimmedOpacity: {
          value: LINE_STYLE.structural.opacity * LINE_STYLE.literary.dimmedRatio,
        },
        uLiteraryLuminance: { value: LINE_STYLE.literary.luminance },
        uLiteraryDashFrequency: { value: LINE_STYLE.literary.dashesPerMetre },
        uLiteraryDashDuty: { value: LINE_STYLE.literary.dashDuty },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(this.starGeometry, this.starMaterial);
    stars.frustumCulled = false;
    stars.renderOrder = 12;
    const lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    lines.frustumCulled = false;
    lines.renderOrder = 11;
    this.group.add(lines, stars);
    layout.labels.forEach((label) => {
      const texture = createLabelTexture(label.name, label.tint);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(this.labelGeometry, material);
      mesh.scale.set(LABEL_WIDTH, (LABEL_WIDTH * LABEL_TEXTURE_HEIGHT) / LABEL_TEXTURE_WIDTH, 1);
      mesh.renderOrder = 10;
      mesh.visible = false;
      this.labelTextures.push(texture);
      this.labelMaterials.push(material);
      this.labelMeshes.push(mesh);
      this.group.add(mesh);
    });
  }

  get starCount() {
    return this.layout.stars.length;
  }

  star(index: number) {
    return this.layout.stars[index];
  }

  worldPosition(index: number) {
    return this.worldPositions[index];
  }

  place(basis: SkyBasis, landing: THREE.Vector3, orientation: THREE.Quaternion) {
    const { stars, lines, labels } = this.layout;
    const positions = new Float32Array(stars.length * 3);
    const tints = new Float32Array(stars.length * 3);
    const seeds = new Float32Array(stars.length);
    const groups = new Float32Array(stars.length);
    const indices = new Float32Array(stars.length);
    stars.forEach((star, index) => {
      const world = skyToWorld(basis, star.sky[0], star.sky[1], this.worldPositions[index]);
      world.toArray(positions, index * 3);
      star.tint.toArray(tints, index * 3);
      seeds[index] = pseudoRandom(index);
      groups[index] = star.constellationIndex;
      indices[index] = index;
      this.delays[index] = world.distanceTo(landing) / RIPPLE_SPEED;
    });
    this.starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.starGeometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 3));
    this.starGeometry.setAttribute("aDelay", new THREE.BufferAttribute(this.delays, 1));
    this.starGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    this.starGeometry.setAttribute("aGroup", new THREE.BufferAttribute(groups, 1));
    this.starGeometry.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));

    const lineCount = lines.length;
    const linePositions = new Float32Array(lineCount * 6);
    const along = new Float32Array(lineCount * 2);
    const lineDelays = new Float32Array(lineCount * 2);
    const lineGroups = new Float32Array(lineCount * 2);
    const bridges = new Float32Array(lineCount * 2);
    const fromIndices = new Float32Array(lineCount * 2);
    const toIndices = new Float32Array(lineCount * 2);
    const lengths = new Float32Array(lineCount * 2);
    const lineTints = new Float32Array(lineCount * 6);
    const bridgeTint = new THREE.Color("#e9d8ff");
    lines.forEach((line, index) => {
      const from = this.worldPositions[line.from];
      const to = this.worldPositions[line.to];
      from.toArray(linePositions, index * 6);
      to.toArray(linePositions, index * 6 + 3);
      const delay: number = line.isBridge
        ? BRIDGE_START_SECONDS + line.order * 0.3
        : LINE_START_SECONDS +
          line.constellationIndex * LINE_GROUP_STAGGER +
          line.order * LINE_STAGGER;
      const tint = line.isBridge ? bridgeTint : stars[line.from].tint;
      for (let vertex = 0; vertex < 2; vertex++) {
        const slot = index * 2 + vertex;
        along[slot] = vertex;
        lineDelays[slot] = delay;
        lineGroups[slot] = line.constellationIndex;
        bridges[slot] = line.isBridge ? 1 : 0;
        fromIndices[slot] = line.from;
        toIndices[slot] = line.to;
        lengths[slot] = from.distanceTo(to);
        tint.toArray(lineTints, slot * 3);
      }
    });
    this.lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    this.lineGeometry.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
    this.lineGeometry.setAttribute("aDelay", new THREE.BufferAttribute(lineDelays, 1));
    this.lineGeometry.setAttribute("aGroup", new THREE.BufferAttribute(lineGroups, 1));
    this.lineGeometry.setAttribute("aBridge", new THREE.BufferAttribute(bridges, 1));
    this.lineGeometry.setAttribute("aFromIndex", new THREE.BufferAttribute(fromIndices, 1));
    this.lineGeometry.setAttribute("aToIndex", new THREE.BufferAttribute(toIndices, 1));
    this.lineGeometry.setAttribute("aLength", new THREE.BufferAttribute(lengths, 1));
    this.lineGeometry.setAttribute("aTint", new THREE.BufferAttribute(lineTints, 3));

    let drawnBy = 0;
    for (let slot = 0; slot < lineDelays.length; slot++)
      drawnBy = Math.max(drawnBy, lineDelays[slot] + LINE_DRAW_SECONDS);
    labels.forEach((label, index) => {
      const mesh = this.labelMeshes[index];
      skyToWorld(basis, label.sky[0], label.sky[1], mesh.position);
      mesh.position.y -= 0.002;
      mesh.quaternion.copy(orientation);
      this.labelDelays[index] =
        LINE_START_SECONDS + label.constellationIndex * LINE_GROUP_STAGGER + 0.9;
      drawnBy = Math.max(drawnBy, this.labelDelays[index] + LABEL_FADE_SECONDS);
    });
    this.drawnBy = drawnBy;
  }

  update(sinceLanding: number, scale: number, hoverIndex: number) {
    const hoverGroup = hoverIndex >= 0 ? this.layout.stars[hoverIndex].constellationIndex : -1;
    const time = sinceLanding >= 0 ? sinceLanding : -1000;
    this.starMaterial.uniforms.uTime.value = time;
    this.starMaterial.uniforms.uScale.value = scale;
    this.starMaterial.uniforms.uHover.value = hoverIndex;
    this.starMaterial.uniforms.uHoverGroup.value = hoverGroup;
    this.lineMaterial.uniforms.uTime.value = time;
    this.lineMaterial.uniforms.uHover.value = hoverIndex;
    this.lineMaterial.uniforms.uHoverGroup.value = hoverGroup;
    this.labelMeshes.forEach((mesh, index) => {
      const reveal = THREE.MathUtils.clamp(
        (time - this.labelDelays[index]) / LABEL_FADE_SECONDS,
        0,
        1,
      );
      const emphasis = hoverGroup === index ? 1 : 0.62;
      this.labelMaterials[index].opacity = reveal * emphasis;
      mesh.visible = reveal > 0.002;
    });
  }

  isFullyDrawn(sinceLanding: number) {
    return sinceLanding > this.drawnBy;
  }

  pick(
    camera: THREE.Camera,
    pointer: { x: number; y: number },
    viewport: DOMRect,
    sinceLanding: number,
    radius: number,
  ) {
    let nearest = -1;
    let nearestDistance = radius;
    this.worldPositions.forEach((world, index) => {
      if (sinceLanding < this.delays[index] + 0.3) return;
      projected.copy(world).project(camera);
      if (projected.z > 1) return;
      const x = ((projected.x + 1) / 2) * viewport.width + viewport.left;
      const y = ((1 - projected.y) / 2) * viewport.height + viewport.top;
      const distance = Math.hypot(x - pointer.x, y - pointer.y);
      if (distance >= nearestDistance) return;
      nearest = index;
      nearestDistance = distance;
    });
    return nearest;
  }

  screenPosition(camera: THREE.Camera, index: number, viewport: DOMRect) {
    projected.copy(this.worldPositions[index]).project(camera);
    return {
      x: ((projected.x + 1) / 2) * viewport.width + viewport.left,
      y: ((1 - projected.y) / 2) * viewport.height + viewport.top,
    };
  }

  dispose() {
    this.starGeometry.dispose();
    this.lineGeometry.dispose();
    this.starMaterial.dispose();
    this.lineMaterial.dispose();
    this.labelGeometry.dispose();
    this.labelMaterials.forEach((material) => material.dispose());
    this.labelTextures.forEach((texture) => texture.dispose());
  }
}

export function skyToWorld(basis: SkyBasis, x: number, y: number, target: THREE.Vector3) {
  return target
    .copy(basis.centre)
    .addScaledVector(basis.right, x)
    .addScaledVector(basis.up, y)
    .setY(SKY_HEIGHT);
}

function createLabelTexture(text: string, tint: string) {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_TEXTURE_WIDTH;
  canvas.height = LABEL_TEXTURE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Constellation labels require a 2D canvas context");
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = 'italic 400 54px Georgia, "Times New Roman", serif';
  context.shadowColor = tint;
  context.shadowBlur = 18;
  context.fillStyle = "rgba(246, 238, 255, 0.95)";
  context.fillText(text, LABEL_TEXTURE_WIDTH / 2, LABEL_TEXTURE_HEIGHT / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}
