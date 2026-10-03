import * as THREE from "three";

interface ParticleSpec {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  birth: number;
  life: number;
  size: number;
  sparkle: number;
}

const STARDUST_CAPACITY = 1800;
const STREAK_RATE_PER_SECOND = 80;
const STREAK_RATE_PER_METRE = 120;
const DUST_RATE_PER_SECOND = 38;
const DUST_RATE_PER_METRE = 46;
const STARDUST_ATTRIBUTES = [
  "position",
  "aVelocity",
  "aBirth",
  "aLife",
  "aSize",
  "aSeed",
  "aSparkle",
] as const;

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  attribute vec3 aVelocity;
  attribute float aBirth;
  attribute float aLife;
  attribute float aSize;
  attribute float aSeed;
  attribute float aSparkle;
  varying float vAlpha;
  varying float vSparkle;
  varying float vTint;
  varying float vTwinkle;

  void main() {
    float age = uTime - aBirth;
    float alive = step(0.0, age) * step(age, aLife);
    float life = clamp(age / aLife, 0.0, 1.0);
    float drag = 1.7;
    vec3 travel = aVelocity * (1.0 - exp(-drag * age)) / drag;
    vec3 wobble = vec3(
      sin(age * 3.1 + aSeed * 6.283),
      sin(age * 1.7 + aSeed * 3.1) * 0.4,
      cos(age * 2.7 + aSeed * 11.0)
    ) * 0.04 * age;
    vec3 settle = vec3(0.0, -0.075 * age * age, 0.0);
    vec4 viewPosition = modelViewMatrix * vec4(position + travel + wobble + settle, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float twinkle = 0.5 + 0.5 * sin(uTime * (12.0 + aSeed * 19.0) + aSeed * 43.0);
    float fadeIn = smoothstep(0.0, 0.05, life);
    float fadeOut = 1.0 - smoothstep(0.4, 1.0, life);
    vAlpha = alive * fadeIn * fadeOut;
    vTwinkle = mix(1.0, twinkle, 0.2 + aSparkle * 0.75);
    vSparkle = aSparkle;
    vTint = fract(aSeed * 7.31);
    float size = aSize * (1.0 - 0.5 * life) * (0.7 + 0.6 * vTwinkle);
    gl_PointSize = alive * size * uScale / max(0.05, -viewPosition.z);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uGold;
  uniform vec3 uLilac;
  uniform vec3 uWhite;
  varying float vAlpha;
  varying float vSparkle;
  varying float vTint;
  varying float vTwinkle;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float radius = dot(uv, uv);
    float core = exp(-radius * 10.0);
    float halo = exp(-radius * 2.8) * 0.3;
    float glint =
      exp(-abs(uv.x) * 28.0) * exp(-abs(uv.y) * 2.6) +
      exp(-abs(uv.y) * 28.0) * exp(-abs(uv.x) * 2.6);
    float shape = core + halo + glint * vSparkle;
    vec3 tint = mix(uGold, uLilac, smoothstep(0.35, 0.85, vTint));
    vec3 color = mix(tint, uWhite, clamp(core * 0.7 + glint * vSparkle * 0.4, 0.0, 1.0));
    float alpha = shape * vAlpha * vTwinkle;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

export class StardustEmitter {
  readonly points: THREE.Points;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.ShaderMaterial;
  private readonly origins = new Float32Array(STARDUST_CAPACITY * 3);
  private readonly velocities = new Float32Array(STARDUST_CAPACITY * 3);
  private readonly births = new Float32Array(STARDUST_CAPACITY).fill(-1000);
  private readonly lives = new Float32Array(STARDUST_CAPACITY).fill(1);
  private readonly sizes = new Float32Array(STARDUST_CAPACITY);
  private readonly seeds = new Float32Array(STARDUST_CAPACITY);
  private readonly sparkles = new Float32Array(STARDUST_CAPACITY);
  private readonly particle: ParticleSpec = {
    x: 0,
    y: 0,
    z: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    birth: 0,
    life: 1,
    size: 0,
    sparkle: 0,
  };
  private cursor = 0;
  private streakCarry = 0;
  private dustCarry = 0;
  private latestDeath = -1;
  private hasPendingUpload = false;

  constructor() {
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.origins, 3));
    this.geometry.setAttribute("aVelocity", new THREE.BufferAttribute(this.velocities, 3));
    this.geometry.setAttribute("aBirth", new THREE.BufferAttribute(this.births, 1));
    this.geometry.setAttribute("aLife", new THREE.BufferAttribute(this.lives, 1));
    this.geometry.setAttribute("aSize", new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute("aSeed", new THREE.BufferAttribute(this.seeds, 1));
    this.geometry.setAttribute("aSparkle", new THREE.BufferAttribute(this.sparkles, 1));
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 1 },
        uGold: { value: new THREE.Color("#ffd9a3") },
        uLilac: { value: new THREE.Color("#c9b4ff") },
        uWhite: { value: new THREE.Color("#fff8ee") },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 12;
  }

  emitTrail(from: THREE.Vector3, to: THREE.Vector3, time: number, delta: number, strength = 1) {
    const distance = from.distanceTo(to);
    this.streakCarry +=
      (STREAK_RATE_PER_SECOND * delta + STREAK_RATE_PER_METRE * distance) * strength;
    this.dustCarry += (DUST_RATE_PER_SECOND * delta + DUST_RATE_PER_METRE * distance) * strength;
    const streakCount = Math.floor(this.streakCarry);
    const dustCount = Math.floor(this.dustCarry);
    this.streakCarry -= streakCount;
    this.dustCarry -= dustCount;
    for (let index = 0; index < streakCount; index++) {
      const along = Math.random();
      this.placeAlong(from, to, along, 0.01);
      this.setVelocity(0.03, 0);
      this.particle.birth = time - (1 - along) * delta;
      this.particle.life = randomBetween(0.32, 0.62);
      this.particle.size = randomBetween(0.026, 0.044) * strength;
      this.particle.sparkle = Math.random() < 0.12 ? 0.6 : 0;
      this.write();
    }
    for (let index = 0; index < dustCount; index++) {
      const along = Math.random();
      this.placeAlong(from, to, along, 0.035);
      this.setVelocity(randomBetween(0.08, 0.3), -0.05);
      this.particle.birth = time - (1 - along) * delta;
      this.particle.life = randomBetween(1.0, 2.3);
      this.particle.size = randomBetween(0.012, 0.034);
      this.particle.sparkle = Math.random() < 0.5 ? randomBetween(0.6, 1) : 0;
      this.write();
    }
  }

  emitBurst(center: THREE.Vector3, time: number, count: number, planar: boolean) {
    for (let index = 0; index < count; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(0.35, 1.45);
      this.particle.x = center.x;
      this.particle.y = center.y;
      this.particle.z = center.z;
      this.particle.velocityX = Math.cos(angle) * speed;
      this.particle.velocityZ = Math.sin(angle) * speed;
      this.particle.velocityY = planar ? randomBetween(-0.32, -0.04) : randomBetween(-0.6, 0.6);
      this.particle.birth = time + Math.random() * 0.08;
      this.particle.life = randomBetween(0.9, 2);
      this.particle.size = randomBetween(0.02, 0.055);
      this.particle.sparkle = Math.random() < 0.65 ? randomBetween(0.6, 1) : 0;
      this.write();
    }
  }

  update(time: number, scale: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uScale.value = scale;
    if (!this.hasPendingUpload) return;
    this.hasPendingUpload = false;
    for (const name of STARDUST_ATTRIBUTES) this.geometry.getAttribute(name).needsUpdate = true;
  }

  isAlive(time: number) {
    return time < this.latestDeath;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }

  private placeAlong(from: THREE.Vector3, to: THREE.Vector3, along: number, jitter: number) {
    this.particle.x = from.x + (to.x - from.x) * along + randomBetween(-jitter, jitter);
    this.particle.y = from.y + (to.y - from.y) * along + randomBetween(-jitter, jitter);
    this.particle.z = from.z + (to.z - from.z) * along + randomBetween(-jitter, jitter);
  }

  private setVelocity(speed: number, lift: number) {
    const theta = Math.random() * Math.PI * 2;
    const cosine = randomBetween(-1, 1);
    const radial = Math.sqrt(1 - cosine * cosine);
    this.particle.velocityX = radial * Math.cos(theta) * speed;
    this.particle.velocityY = cosine * speed + lift;
    this.particle.velocityZ = radial * Math.sin(theta) * speed;
  }

  private write() {
    const index = this.cursor;
    const particle = this.particle;
    this.origins[index * 3] = particle.x;
    this.origins[index * 3 + 1] = particle.y;
    this.origins[index * 3 + 2] = particle.z;
    this.velocities[index * 3] = particle.velocityX;
    this.velocities[index * 3 + 1] = particle.velocityY;
    this.velocities[index * 3 + 2] = particle.velocityZ;
    this.births[index] = particle.birth;
    this.lives[index] = particle.life;
    this.sizes[index] = particle.size;
    this.seeds[index] = Math.random();
    this.sparkles[index] = particle.sparkle;
    this.latestDeath = Math.max(this.latestDeath, particle.birth + particle.life);
    this.cursor = (index + 1) % STARDUST_CAPACITY;
    this.hasPendingUpload = true;
  }
}

function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum);
}
