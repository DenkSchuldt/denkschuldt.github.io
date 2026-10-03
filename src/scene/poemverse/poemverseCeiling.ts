import * as THREE from "three";

import { POEM_STAR_IMAGE_URL } from "./poemStarAsset";
import { createGlowTexture } from "./poemverseTextures";

export const POEMVERSE_CEILING_HEIGHT = 7.985;
export const POEMVERSE_DECAL_SIZE = 0.36;

const ROOM_INTERIOR = { minX: -6, maxX: 5.85, minZ: -4, maxZ: 7.5 };
const CEILING_WIDTH = ROOM_INTERIOR.maxX - ROOM_INTERIOR.minX;
const CEILING_DEPTH = ROOM_INTERIOR.maxZ - ROOM_INTERIOR.minZ;
const CEILING_CENTRE_X = (ROOM_INTERIOR.minX + ROOM_INTERIOR.maxX) / 2;
const CEILING_CENTRE_Z = (ROOM_INTERIOR.minZ + ROOM_INTERIOR.maxZ) / 2;
const DOME_WALL_BOTTOM = 2.2;
const DOME_WALL_HEIGHT = POEMVERSE_CEILING_HEIGHT - DOME_WALL_BOTTOM;

type DomeSurface = "ceiling" | "wall-x" | "wall-z";

interface DomePanel {
  surface: DomeSurface;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

const DOME_PANELS: readonly DomePanel[] = [
  {
    surface: "ceiling",
    width: CEILING_WIDTH,
    height: CEILING_DEPTH,
    position: [CEILING_CENTRE_X, POEMVERSE_CEILING_HEIGHT, CEILING_CENTRE_Z],
    rotation: [Math.PI / 2, 0, 0],
  },
  {
    surface: "wall-z",
    width: 11.85,
    height: DOME_WALL_HEIGHT,
    position: [-0.075, DOME_WALL_BOTTOM + DOME_WALL_HEIGHT / 2, -3.985],
    rotation: [0, 0, 0],
  },
  {
    surface: "wall-x",
    width: 11.5,
    height: DOME_WALL_HEIGHT,
    position: [5.835, DOME_WALL_BOTTOM + DOME_WALL_HEIGHT / 2, 1.75],
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    surface: "wall-x",
    width: 11.5,
    height: DOME_WALL_HEIGHT,
    position: [-5.985, DOME_WALL_BOTTOM + DOME_WALL_HEIGHT / 2, 1.75],
    rotation: [0, Math.PI / 2, 0],
  },
];

const SURFACE_DEFINES: Record<DomeSurface, Record<string, number>> = {
  ceiling: { DOME_SURFACE: 0 },
  "wall-x": { DOME_SURFACE: 1 },
  "wall-z": { DOME_SURFACE: 2 },
};

const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCenter;
  uniform float uReveal;
  uniform float uImpact;
  uniform float uOpacity;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uGold;
  uniform vec3 uLilac;
  uniform vec3 uStarlight;
  varying vec3 vWorldPosition;

  float hash(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float hash3(vec3 point) {
    point = fract(point * vec3(123.34, 456.21, 289.17));
    point += dot(point, point.yzx + 45.32);
    return fract((point.x + point.y) * point.z);
  }

  float noise3(vec3 point) {
    vec3 cell = floor(point);
    vec3 local = fract(point);
    vec3 blend = local * local * (3.0 - 2.0 * local);
    float bottom = mix(
      mix(hash3(cell), hash3(cell + vec3(1.0, 0.0, 0.0)), blend.x),
      mix(hash3(cell + vec3(0.0, 1.0, 0.0)), hash3(cell + vec3(1.0, 1.0, 0.0)), blend.x),
      blend.y
    );
    float top = mix(
      mix(hash3(cell + vec3(0.0, 0.0, 1.0)), hash3(cell + vec3(1.0, 0.0, 1.0)), blend.x),
      mix(hash3(cell + vec3(0.0, 1.0, 1.0)), hash3(cell + vec3(1.0, 1.0, 1.0)), blend.x),
      blend.y
    );
    return mix(bottom, top, blend.z);
  }

  float fbm3(vec3 point) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += amplitude * noise3(point);
      point *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  float starLayer(vec2 point, float cellSize, float density, float seed) {
    vec2 grid = point / cellSize;
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float presence = hash(cell + seed);
    if (presence > density) return 0.0;
    vec2 offset = (vec2(hash(cell + seed + 3.1), hash(cell + seed + 7.7)) - 0.5) * 0.7;
    float distanceToStar = length(local - offset);
    float size = mix(0.018, 0.06, pow(hash(cell + seed + 1.3), 3.0));
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + hash(cell + seed + 9.2) * 2.2) + presence * 40.0);
    float falloff = distanceToStar / size;
    float light = exp(-falloff * falloff * 2.2) + 0.18 * exp(-falloff * 0.9);
    return light * twinkle * mix(0.3, 1.0, hash(cell + seed + 5.5));
  }

  void main() {
    #if DOME_SURFACE == 0
      vec2 point = vWorldPosition.xz;
      float wallFade = 1.0;
    #elif DOME_SURFACE == 1
      vec2 point = vWorldPosition.zy;
      float wallFade = smoothstep(2.6, 5.4, vWorldPosition.y);
    #else
      vec2 point = vWorldPosition.xy;
      float wallFade = smoothstep(2.6, 5.4, vWorldPosition.y);
    #endif
    float distanceToCenter = length(vWorldPosition - uCenter);
    float mask = 1.0 - smoothstep(uReveal - 1.6, uReveal, distanceToCenter);

    vec3 drift = vec3(uTime * 0.012, 0.0, -uTime * 0.008);
    float nebula = fbm3(vWorldPosition * 0.32 + drift);
    float wisps = fbm3(vWorldPosition * 0.85 - nebula * 1.7);
    vec3 sky = mix(uDeep, uMid, smoothstep(0.25, 0.85, nebula) * 0.9);
    sky += uLilac * pow(wisps, 3.0) * 0.26 + uGold * pow(nebula, 4.0) * 0.16;
    sky *= mix(0.5, 1.0, exp(-distanceToCenter * distanceToCenter * 0.02));

    float stars = starLayer(point, 0.2, 0.3, 0.0) + starLayer(point + 3.7, 0.48, 0.42, 11.0);
    vec3 color = sky + uStarlight * stars;

    float revealing = step(0.01, uReveal) * (1.0 - smoothstep(7.0, 11.0, uReveal));
    float rim = exp(-pow((distanceToCenter - uReveal + 0.4) / 0.38, 2.0)) * revealing;
    float ring = step(0.0, uImpact)
      * exp(-pow((distanceToCenter - uImpact * 2.6) / 0.08, 2.0))
      * exp(-uImpact * 1.05);
    float bloom = exp(-distanceToCenter * distanceToCenter * 1.4) * mask;
    color += (uGold * 0.85 + uLilac * 0.45) * (rim * 0.6 + ring * 1.5) + uGold * bloom * 0.3;

    float alpha = clamp(mask + rim * 0.6 + ring, 0.0, 1.0) * uOpacity * wallFade;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const decalUp = new THREE.Vector3();
const decalRight = new THREE.Vector3();
const DECAL_NORMAL = new THREE.Vector3(0, -1, 0);
const decalBasis = new THREE.Matrix4();

export class PoemverseCeiling {
  readonly group = new THREE.Group();
  private readonly skyUniforms: Record<string, THREE.IUniform>;
  private readonly skyMaterials: THREE.ShaderMaterial[];
  private readonly decal: THREE.Mesh;
  private readonly decalMaterial: THREE.MeshBasicMaterial;
  private readonly glow: THREE.Mesh;
  private readonly glowMaterial: THREE.MeshBasicMaterial;
  private readonly geometries: THREE.BufferGeometry[];
  private readonly textures: THREE.Texture[];

  constructor(onAssetReady: () => void) {
    const decalGeometry = new THREE.PlaneGeometry(1, 1);
    this.geometries = [decalGeometry];
    this.skyUniforms = {
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector3() },
      uReveal: { value: 0 },
      uImpact: { value: -1 },
      uOpacity: { value: 1 },
      uDeep: { value: new THREE.Color("#0f0d1a") },
      uMid: { value: new THREE.Color("#2b2243") },
      uGold: { value: new THREE.Color("#d7ae83") },
      uLilac: { value: new THREE.Color("#ab8eb8") },
      uStarlight: { value: new THREE.Color("#f1e6ff") },
    };
    this.skyMaterials = [];
    for (const panel of DOME_PANELS) {
      const geometry = new THREE.PlaneGeometry(panel.width, panel.height);
      const material = new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX_SHADER,
        fragmentShader: SKY_FRAGMENT_SHADER,
        uniforms: this.skyUniforms,
        defines: SURFACE_DEFINES[panel.surface],
        transparent: true,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...panel.position);
      mesh.rotation.set(...panel.rotation);
      mesh.renderOrder = 9;
      this.geometries.push(geometry);
      this.skyMaterials.push(material);
      this.group.add(mesh);
    }

    const starTexture = new THREE.TextureLoader().load(POEM_STAR_IMAGE_URL, onAssetReady);
    starTexture.colorSpace = THREE.SRGBColorSpace;
    starTexture.anisotropy = 4;
    const glowTexture = createGlowTexture([
      [0, "rgba(255, 226, 190, 0)"],
      [0.2, "rgba(255, 226, 190, 0.32)"],
      [0.42, "rgba(215, 174, 131, 0.14)"],
      [0.7, "rgba(171, 142, 184, 0.05)"],
      [1, "rgba(171, 142, 184, 0)"],
    ]);
    this.textures = [starTexture, glowTexture];

    this.decalMaterial = new THREE.MeshBasicMaterial({
      map: starTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    });
    this.decal = new THREE.Mesh(decalGeometry, this.decalMaterial);
    this.decal.scale.setScalar(POEMVERSE_DECAL_SIZE);
    this.decal.renderOrder = 10;

    this.glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.glow = new THREE.Mesh(decalGeometry, this.glowMaterial);
    this.glow.scale.setScalar(POEMVERSE_DECAL_SIZE * 2.6);
    this.glow.renderOrder = 11;

    this.group.add(this.decal, this.glow);
  }

  get orientation() {
    return this.decal.quaternion;
  }

  placeDecal(landing: THREE.Vector3, awayFromViewer: THREE.Vector3) {
    this.skyUniforms.uCenter.value.copy(landing);
    decalUp.copy(awayFromViewer).negate().setY(0).normalize();
    decalRight.crossVectors(decalUp, DECAL_NORMAL).normalize();
    decalBasis.makeBasis(decalRight, decalUp, DECAL_NORMAL);
    for (const mesh of [this.decal, this.glow]) {
      mesh.quaternion.setFromRotationMatrix(decalBasis);
      mesh.position.set(landing.x, POEMVERSE_CEILING_HEIGHT - 0.004, landing.z);
    }
    this.glow.position.y -= 0.002;
  }

  update(options: {
    time: number;
    reveal: number;
    impactAge: number;
    decalOpacity: number;
    glowOpacity: number;
  }) {
    const uniforms = this.skyUniforms;
    uniforms.uTime.value = options.time;
    uniforms.uReveal.value = options.reveal;
    uniforms.uImpact.value = options.impactAge;
    this.decalMaterial.opacity = options.decalOpacity;
    this.decal.visible = options.decalOpacity > 0.002;
    this.glowMaterial.opacity = options.glowOpacity;
    this.glow.visible = options.glowOpacity > 0.002;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.skyMaterials.forEach((material) => material.dispose());
    this.decalMaterial.dispose();
    this.glowMaterial.dispose();
  }
}
