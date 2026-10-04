import * as THREE from "three";

import {
  BEAM_FRAGMENT_SHADER,
  BEAM_VERTEX_SHADER,
  MOTE_FRAGMENT_SHADER,
  MOTE_VERTEX_SHADER,
  WALL_POOL_FRAGMENT_SHADER,
  WALL_POOL_VERTEX_SHADER,
} from "./projectorBeamShaders";

export interface ProjectorBeamTarget {
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
}

interface ProjectorBeamFrame {
  lens: THREE.Object3D;
  target: ProjectorBeamTarget;
  time: number;
  opacity: number;
  pointScale: number;
}

type CornerQuad = [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];

const ACROSS_SEGMENTS = 8;
const ALONG_SEGMENTS = 24;
const MOTE_COUNT = 220;
const APERTURE_HALF_HEIGHT = 0.06;
const WALL_POOL_SPILL = 1.3;
const WALL_POOL_OFFSET = 0.004;
const HOT_COLOR = new THREE.Color("#f2f7ff");
const FAR_COLOR = new THREE.Color("#a9cdff");
const SIDE_EDGES: readonly ((across: number) => [number, number])[] = [
  (across) => [across, 1],
  (across) => [1, 1 - across],
  (across) => [1 - across, 0],
  (across) => [0, across],
];

export class ProjectorBeamRig {
  readonly group = new THREE.Group();
  private readonly beamGeometry = createBeamGeometry();
  private readonly moteGeometry = createMoteGeometry();
  private readonly apex = createCornerQuad();
  private readonly base = createCornerQuad();
  private readonly lensPosition = new THREE.Vector3();
  private readonly beamMaterial: THREE.ShaderMaterial;
  private readonly moteMaterial: THREE.ShaderMaterial;
  private readonly wallPoolGeometry = new THREE.PlaneGeometry(1, 1);
  private readonly wallPoolMaterial: THREE.ShaderMaterial;
  private readonly wallPool: THREE.Mesh;

  constructor() {
    const frustumUniforms = { uApex: { value: this.apex }, uBase: { value: this.base } };
    this.beamMaterial = new THREE.ShaderMaterial({
      vertexShader: BEAM_VERTEX_SHADER,
      fragmentShader: BEAM_FRAGMENT_SHADER,
      uniforms: {
        ...frustumUniforms,
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uHotColor: { value: HOT_COLOR },
        uFarColor: { value: FAR_COLOR },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.moteMaterial = new THREE.ShaderMaterial({
      vertexShader: MOTE_VERTEX_SHADER,
      fragmentShader: MOTE_FRAGMENT_SHADER,
      uniforms: {
        ...frustumUniforms,
        uTime: { value: 0 },
        uScale: { value: 1 },
        uOpacity: { value: 0 },
        uHotColor: { value: HOT_COLOR },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    this.wallPoolMaterial = new THREE.ShaderMaterial({
      vertexShader: WALL_POOL_VERTEX_SHADER,
      fragmentShader: WALL_POOL_FRAGMENT_SHADER,
      uniforms: {
        uOpacity: { value: 0 },
        uSpill: { value: WALL_POOL_SPILL },
        uColor: { value: FAR_COLOR },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.wallPool = new THREE.Mesh(this.wallPoolGeometry, this.wallPoolMaterial);
    this.wallPool.name = "ProjectorBeamWallPool";
    this.wallPool.renderOrder = 1;

    const beam = new THREE.Mesh(this.beamGeometry, this.beamMaterial);
    const motes = new THREE.Points(this.moteGeometry, this.moteMaterial);
    beam.name = "ProjectorBeam";
    motes.name = "ProjectorBeamMotes";
    beam.frustumCulled = false;
    motes.frustumCulled = false;
    beam.renderOrder = 2;
    motes.renderOrder = 3;
    this.group.add(this.wallPool, beam, motes);
    this.group.visible = false;
  }

  update({ lens, target, time, opacity, pointScale }: ProjectorBeamFrame) {
    this.group.visible = opacity > 0.001;
    if (!this.group.visible) return;

    lens.getWorldPosition(this.lensPosition);
    const [centerX, centerY, centerZ] = target.position;
    const halfWidth = target.scale[0] / 2;
    const halfHeight = target.scale[1] / 2;
    setRectangle(this.base, centerX, centerY, centerZ, halfWidth, halfHeight);
    this.wallPool.position.set(centerX, centerY, centerZ + WALL_POOL_OFFSET);
    this.wallPool.scale.set(
      target.scale[0] * WALL_POOL_SPILL,
      target.scale[1] * WALL_POOL_SPILL,
      1,
    );
    const apertureHalfWidth = (APERTURE_HALF_HEIGHT * halfWidth) / halfHeight;
    setRectangle(
      this.apex,
      this.lensPosition.x,
      this.lensPosition.y,
      this.lensPosition.z,
      apertureHalfWidth,
      APERTURE_HALF_HEIGHT,
    );

    this.beamMaterial.uniforms.uTime.value = time;
    this.beamMaterial.uniforms.uOpacity.value = opacity;
    this.moteMaterial.uniforms.uTime.value = time;
    this.moteMaterial.uniforms.uOpacity.value = opacity;
    this.moteMaterial.uniforms.uScale.value = pointScale;
    this.wallPoolMaterial.uniforms.uOpacity.value = opacity;
  }

  dispose() {
    this.group.removeFromParent();
    this.beamGeometry.dispose();
    this.moteGeometry.dispose();
    this.beamMaterial.dispose();
    this.moteMaterial.dispose();
    this.wallPoolGeometry.dispose();
    this.wallPoolMaterial.dispose();
  }
}

function createCornerQuad(): CornerQuad {
  return [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
}

function setRectangle(
  corners: CornerQuad,
  centerX: number,
  centerY: number,
  centerZ: number,
  halfWidth: number,
  halfHeight: number,
) {
  corners[0].set(centerX - halfWidth, centerY + halfHeight, centerZ);
  corners[1].set(centerX + halfWidth, centerY + halfHeight, centerZ);
  corners[2].set(centerX + halfWidth, centerY - halfHeight, centerZ);
  corners[3].set(centerX - halfWidth, centerY - halfHeight, centerZ);
}

function createBeamGeometry() {
  const columns = ACROSS_SEGMENTS + 1;
  const rows = ALONG_SEGMENTS + 1;
  const verticesPerSide = columns * rows;
  const positions = new Float32Array(SIDE_EDGES.length * verticesPerSide * 3);
  const indices: number[] = [];

  SIDE_EDGES.forEach((edgePoint, side) => {
    const offset = side * verticesPerSide;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const vertex = offset + row * columns + column;
        const acrossFraction = column / ACROSS_SEGMENTS;
        const [u, v] = edgePoint(acrossFraction);
        positions.set([u, v, row / ALONG_SEGMENTS], vertex * 3);
        if (row === ALONG_SEGMENTS || column === ACROSS_SEGMENTS) continue;
        indices.push(
          vertex,
          vertex + 1,
          vertex + columns,
          vertex + 1,
          vertex + columns + 1,
          vertex + columns,
        );
      }
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function createMoteGeometry() {
  const random = seededRandom(0x5eed);
  const positions = new Float32Array(MOTE_COUNT * 3);
  const seeds = new Float32Array(MOTE_COUNT * 4);
  for (let index = 0; index < MOTE_COUNT; index++) {
    seeds.set([random(), random(), random(), random()], index * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  return geometry;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
