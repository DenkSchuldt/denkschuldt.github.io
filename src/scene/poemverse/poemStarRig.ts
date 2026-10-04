import * as THREE from "three";

import { POEM_STAR_COLORS } from "./poemStarAsset";
import { createGlowTexture, createSpikeTexture } from "./poemverseTextures";

export interface PoemStarLook {
  radius: number;
  coreOpacity: number;
  flatten: number;
  glow: number;
  haloOpacity: number;
  spikeOpacity: number;
  spikeRotation: number;
  lightIntensity: number;
}

const CORE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CORE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uHighlight;
  uniform vec3 uBody;
  uniform vec3 uRim;
  uniform float uOpacity;
  uniform float uGlow;
  varying vec3 vViewNormal;

  void main() {
    vec3 normal = normalize(vViewNormal);
    float facing = clamp(normal.z, 0.0, 1.0);
    float gradient = clamp(length(normal.xy - vec2(-0.3, 0.44)) / 1.94, 0.0, 1.0);
    vec3 color = mix(uHighlight, uBody, smoothstep(0.0, 0.52, gradient));
    color = mix(color, uRim, smoothstep(0.52, 0.93, gradient));
    float fresnel = pow(1.0 - facing, 2.4);
    color += uRim * fresnel * 0.75 * uGlow;
    color += vec3(1.0, 0.94, 0.86) * pow(facing, 5.0) * 0.22 * uGlow;
    gl_FragColor = vec4(color, uOpacity);
    #include <colorspace_fragment>
  }
`;

const SPHERE_GEOMETRY = new THREE.SphereGeometry(1, 48, 32);

export class PoemStarRig {
  readonly group = new THREE.Group();
  readonly light = new THREE.PointLight("#e9c9ff", 0, 3.2, 2);
  private readonly core: THREE.Mesh;
  private readonly coreMaterial: THREE.ShaderMaterial;
  private readonly innerHalo: THREE.Sprite;
  private readonly outerHalo: THREE.Sprite;
  private readonly spikes: THREE.Sprite;
  private readonly textures: THREE.Texture[];
  private readonly materials: THREE.Material[];

  constructor() {
    const innerTexture = createGlowTexture([
      [0, "rgba(255, 247, 234, 0.8)"],
      [0.16, "rgba(255, 226, 190, 0.6)"],
      [0.45, "rgba(226, 178, 140, 0.2)"],
      [1, "rgba(215, 174, 131, 0)"],
    ]);
    const outerTexture = createGlowTexture([
      [0, "rgba(214, 190, 255, 0.55)"],
      [0.35, "rgba(171, 142, 184, 0.22)"],
      [0.7, "rgba(133, 139, 168, 0.06)"],
      [1, "rgba(133, 139, 168, 0)"],
    ]);
    const spikeTexture = createSpikeTexture();
    this.textures = [innerTexture, outerTexture, spikeTexture];

    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: CORE_VERTEX_SHADER,
      fragmentShader: CORE_FRAGMENT_SHADER,
      uniforms: {
        uHighlight: { value: new THREE.Color(POEM_STAR_COLORS.highlight) },
        uBody: { value: new THREE.Color(POEM_STAR_COLORS.body) },
        uRim: { value: new THREE.Color(POEM_STAR_COLORS.rim) },
        uOpacity: { value: 1 },
        uGlow: { value: 1 },
      },
      transparent: true,
    });
    const innerMaterial = createGlowMaterial(innerTexture);
    const outerMaterial = createGlowMaterial(outerTexture);
    const spikeMaterial = createGlowMaterial(spikeTexture);
    this.materials = [this.coreMaterial, innerMaterial, outerMaterial, spikeMaterial];

    this.core = new THREE.Mesh(SPHERE_GEOMETRY, this.coreMaterial);
    this.core.renderOrder = 13;
    this.innerHalo = new THREE.Sprite(innerMaterial);
    this.innerHalo.renderOrder = 14;
    this.outerHalo = new THREE.Sprite(outerMaterial);
    this.outerHalo.renderOrder = 11;
    this.spikes = new THREE.Sprite(spikeMaterial);
    this.spikes.renderOrder = 15;
    this.light.castShadow = false;

    this.group.add(this.outerHalo, this.core, this.innerHalo, this.spikes, this.light);
  }

  apply(look: PoemStarLook) {
    const radius = look.radius;
    this.core.scale.set(radius, radius * (1 - look.flatten), radius);
    this.core.position.y = radius * look.flatten;
    this.coreMaterial.uniforms.uOpacity.value = look.coreOpacity;
    this.coreMaterial.uniforms.uGlow.value = look.glow;
    this.core.visible = look.coreOpacity > 0.002;

    this.innerHalo.scale.setScalar((0.12 + radius * 3.4) * (0.75 + 0.25 * look.glow));
    this.innerHalo.material.opacity = look.haloOpacity * 0.85;
    this.outerHalo.scale.setScalar((0.5 + radius * 5) * (0.8 + 0.2 * look.glow));
    this.outerHalo.material.opacity = look.haloOpacity * 0.6;
    this.spikes.scale.setScalar((0.55 + radius * 2.2) * (0.8 + 0.2 * look.glow));
    this.spikes.material.opacity = look.spikeOpacity;
    this.spikes.material.rotation = look.spikeRotation;
    this.spikes.visible = look.spikeOpacity > 0.002;
    this.light.intensity = look.lightIntensity;
  }

  dispose() {
    this.textures.forEach((texture) => texture.dispose());
    this.materials.forEach((material) => material.dispose());
  }
}

function createGlowMaterial(map: THREE.Texture) {
  return new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}
