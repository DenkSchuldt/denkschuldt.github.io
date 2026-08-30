import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_PATH = resolve("public/models/mini-projector.glb");
const REQUIRED_NODES = [
  "ProjectorRoot",
  "ProjectorStand",
  "ProjectorTilt",
  "ProjectorBody",
  "ProjectorLens",
  "ProjectorRear",
  "ProjectorVent",
  "ProjectorPivot_L",
  "ProjectorPivot_R",
  "ProjectorLED",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseGlb(data) {
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  return new Promise((resolveGltf, reject) => {
    new GLTFLoader().parse(arrayBuffer, "", resolveGltf, reject);
  });
}

function countTriangles(scene) {
  let triangles = 0;
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geometry = child.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
  });
  return triangles;
}

const data = await readFile(MODEL_PATH);
const file = await stat(MODEL_PATH);
const gltf = await parseGlb(data);
const projectorRoot = gltf.scene.getObjectByName("ProjectorRoot");
const tilt = gltf.scene.getObjectByName("ProjectorTilt");
const triangleCount = countTriangles(gltf.scene);

for (const nodeName of REQUIRED_NODES) {
  assert(gltf.scene.getObjectByName(nodeName), `Missing required node: ${nodeName}`);
}

assert(projectorRoot, "ProjectorRoot was not preserved");
assert(tilt?.parent === projectorRoot, "ProjectorTilt must be a direct child of ProjectorRoot");
assert(Math.abs(tilt.position.y - 0.075) < 0.0001, "ProjectorTilt pivot is not at hinge height");
assert(triangleCount >= 5_000 && triangleCount <= 20_000, "Triangle count is outside budget");
assert(gltf.cameras.length === 0, "Asset contains an unnecessary camera");

let lightCount = 0;
gltf.scene.traverse((child) => {
  if (child instanceof THREE.Light) lightCount += 1;
});
assert(lightCount === 0, "Asset contains an unnecessary light");

const bounds = new THREE.Box3().setFromObject(projectorRoot);
const size = bounds.getSize(new THREE.Vector3());
console.log(
  `Measured bounds: ${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)} m`,
);
assert(size.x > 0.21 && size.x < 0.22, "Unexpected model width");
assert(size.y > 0.11 && size.y < 0.13, "Unexpected model height");
assert(size.z > 0.12 && size.z < 0.13, "Unexpected model depth");

console.log(`Validated ${MODEL_PATH}`);
console.log(`File size: ${Math.round(file.size / 1024)} KiB`);
console.log(`Triangles: ${Math.round(triangleCount)}`);
console.log(`Bounds: ${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)} m`);
console.log("ProjectorTilt rotates independently around its local X axis");
