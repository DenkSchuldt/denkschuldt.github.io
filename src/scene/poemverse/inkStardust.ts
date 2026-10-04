import * as THREE from "three";

import type { PoemverseInkRequest } from "./poemverseStore";

interface InkEmission {
  request: PoemverseInkRequest;
  camera: THREE.Camera;
  canvasBounds: DOMRect;
  target: THREE.Vector3;
  tint: THREE.Color;
  time: number;
}

const INK_CAPACITY = 6000;
const GLYPH_PLANE_DISTANCE = 1;
const DOT_OVERLAP = 1.35;
const READING_WAVE_SECONDS = 0.35;
const ARRIVAL_SECONDS = 1.1;
const LIFETIME_SECONDS = 1.7;
const IGNITION_COLOR = new THREE.Color("#ffe6bd");

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uDotSize;
  uniform vec3 uTarget;
  uniform mat4 uCameraWorld;
  attribute vec3 aScatter;
  attribute float aDelay;
  attribute float aSeed;
  varying float vAlpha;
  varying float vTravel;
  varying float vIgnition;

  void main() {
    float hold = aDelay;
    float travelSeconds = 0.75 + aSeed * 0.3;
    float travel = clamp((uTime - hold) / travelSeconds, 0.0, 1.0);
    float eased = travel * (2.0 - travel);
    vec3 start = (uCameraWorld * vec4(position, 1.0)).xyz;
    vec3 control = mix(start, uTarget, 0.32) + aScatter * 1.4;
    vec3 towardControl = mix(start, control, eased);
    vec3 towardTarget = mix(control, uTarget, eased);
    vec3 world = mix(towardControl, towardTarget, eased);
    float swirl = sin(3.14159 * travel);
    world += vec3(
      sin(uTime * 2.3 + aSeed * 40.0),
      cos(uTime * 1.9 + aSeed * 23.0) * 0.6,
      cos(uTime * 2.1 + aSeed * 17.0)
    ) * 0.05 * swirl;

    vec4 viewPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float ignition = 1.0 - smoothstep(0.0, 0.3, uTime);
    float shimmer = 0.85 + 0.15 * sin(uTime * 18.0 + aSeed * 60.0) * (1.0 - travel);
    float arrivalFade = 1.0 - smoothstep(0.88, 1.0, travel);
    vAlpha = shimmer * arrivalFade;
    vTravel = travel;
    vIgnition = ignition;
    float size = uDotSize * mix(1.0, 0.45, smoothstep(0.0, 0.6, travel));
    gl_PointSize = size * uScale / max(0.05, -viewPosition.z);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uIgnitionColor;
  uniform vec3 uTargetColor;
  varying float vAlpha;
  varying float vTravel;
  varying float vIgnition;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float radius = dot(uv, uv);
    float disc = exp(-radius * 3.2) * (1.0 - smoothstep(0.7, 1.0, radius));
    vec3 color = mix(uIgnitionColor, uTargetColor, smoothstep(0.15, 0.85, vTravel));
    color = mix(color, vec3(1.0), vIgnition * 0.6);
    float alpha = disc * vAlpha;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha * 0.9);
    #include <colorspace_fragment>
  }
`;

const ndc = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const start = new THREE.Vector3();

export class InkStardust {
  readonly points: THREE.Points;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.ShaderMaterial;
  private readonly starts = new Float32Array(INK_CAPACITY * 3);
  private readonly scatters = new Float32Array(INK_CAPACITY * 3);
  private readonly delays = new Float32Array(INK_CAPACITY);
  private readonly seeds = new Float32Array(INK_CAPACITY);
  private readonly target = new THREE.Vector3();
  private readonly targetColor = new THREE.Color();
  private readonly cameraWorld = new THREE.Matrix4();
  private emittedAt = -1;

  constructor() {
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.starts, 3));
    this.geometry.setAttribute("aScatter", new THREE.BufferAttribute(this.scatters, 3));
    this.geometry.setAttribute("aDelay", new THREE.BufferAttribute(this.delays, 1));
    this.geometry.setAttribute("aSeed", new THREE.BufferAttribute(this.seeds, 1));
    this.geometry.setDrawRange(0, 0);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 1 },
        uDotSize: { value: 0.01 },
        uTarget: { value: this.target },
        uCameraWorld: { value: this.cameraWorld },
        uIgnitionColor: { value: IGNITION_COLOR },
        uTargetColor: { value: this.targetColor },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = "PoemInkStardust";
    this.points.frustumCulled = false;
    this.points.renderOrder = 14;
    this.points.visible = false;
    this.points.onBeforeRender = (_renderer, _scene, camera) => {
      this.cameraWorld.copy(camera.matrixWorld);
    };
  }

  get arrivalTime() {
    return this.emittedAt < 0 ? -1 : this.emittedAt + ARRIVAL_SECONDS;
  }

  emit({ request, camera, canvasBounds, target, tint, time }: InkEmission) {
    const count = Math.min(request.count, INK_CAPACITY);
    if (count === 0 || canvasBounds.width === 0 || canvasBounds.height === 0) return false;

    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraForward);
    this.target.copy(target);
    this.targetColor.copy(tint);
    const { minY, rangeY, minX, rangeX } = measureBounds(request.points, count);

    for (let index = 0; index < count; index++) {
      const screenX = request.points[index * 2];
      const screenY = request.points[index * 2 + 1];
      ndc.set(
        ((screenX - canvasBounds.left) / canvasBounds.width) * 2 - 1,
        -((screenY - canvasBounds.top) / canvasBounds.height) * 2 + 1,
        0.5,
      );
      ndc.unproject(camera).sub(cameraPosition).normalize();
      const distance = GLYPH_PLANE_DISTANCE / Math.max(0.2, ndc.dot(cameraForward));
      start
        .copy(cameraPosition)
        .addScaledVector(ndc, distance)
        .applyMatrix4(camera.matrixWorldInverse);
      start.toArray(this.starts, index * 3);
      this.scatters[index * 3] = Math.random() - 0.5;
      this.scatters[index * 3 + 1] = Math.random() * 0.6;
      this.scatters[index * 3 + 2] = Math.random() - 0.5;

      const readingOrder = (screenY - minY) / rangeY + ((screenX - minX) / rangeX) * 0.12;
      this.delays[index] = readingOrder * READING_WAVE_SECONDS + Math.random() * 0.08;
      this.seeds[index] = Math.random();
    }

    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 42;
    const worldPerPixel =
      (2 * GLYPH_PLANE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(fov) / 2)) /
      canvasBounds.height;
    this.material.uniforms.uDotSize.value = request.spacing * worldPerPixel * DOT_OVERLAP;
    markUpdated(this.geometry);
    this.geometry.setDrawRange(0, count);
    this.emittedAt = time;
    this.points.visible = true;
    return true;
  }

  isAlive(time: number) {
    return this.emittedAt >= 0 && time - this.emittedAt < LIFETIME_SECONDS;
  }

  update(time: number, pointScale: number) {
    if (!this.isAlive(time)) {
      this.points.visible = false;
      return;
    }
    this.material.uniforms.uTime.value = time - this.emittedAt;
    this.material.uniforms.uScale.value = pointScale;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

function measureBounds(points: Float32Array, count: number) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < count; index++) {
    minX = Math.min(minX, points[index * 2]);
    maxX = Math.max(maxX, points[index * 2]);
    minY = Math.min(minY, points[index * 2 + 1]);
    maxY = Math.max(maxY, points[index * 2 + 1]);
  }
  return { minX, minY, rangeX: Math.max(1, maxX - minX), rangeY: Math.max(1, maxY - minY) };
}

function markUpdated(geometry: THREE.BufferGeometry) {
  Object.values(geometry.attributes).forEach((attribute) => {
    attribute.needsUpdate = true;
  });
}
