import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const OUTPUT_PATH = resolve("public/models/mini-projector.glb");

// GLTFExporter targets browsers, so provide its small FileReader dependency
// when regenerating the asset from Node.
globalThis.FileReader = class NodeFileReader {
  result = null;
  onloadend = null;

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      const base64 = Buffer.from(result).toString("base64");
      this.result = `data:${blob.type};base64,${base64}`;
      this.onloadend?.();
    });
  }
};

const materials = {
  body: new THREE.MeshStandardMaterial({
    name: "MatteGraphite",
    color: "#282b2d",
    metalness: 0.08,
    roughness: 0.68,
  }),
  stand: new THREE.MeshStandardMaterial({
    name: "AnodizedGraphite",
    color: "#191c1e",
    metalness: 0.62,
    roughness: 0.38,
  }),
  rear: new THREE.MeshStandardMaterial({
    name: "RearGraphite",
    color: "#202326",
    metalness: 0.12,
    roughness: 0.6,
  }),
  recessed: new THREE.MeshStandardMaterial({
    name: "RecessedNearBlack",
    color: "#050708",
    metalness: 0.02,
    roughness: 0.78,
  }),
  lens: new THREE.MeshPhysicalMaterial({
    name: "SmokedLensGlass",
    color: "#071017",
    metalness: 0.05,
    roughness: 0.16,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
  }),
  led: new THREE.MeshStandardMaterial({
    name: "NeutralWhiteLED",
    color: "#f2eee5",
    emissive: "#f2eee5",
    emissiveIntensity: 1.5,
    roughness: 0.5,
  }),
};

function roundedBox(name, size, radius, material) {
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius);
  geometry.name = `${name}Geometry`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(name, radius, depth, segments, material) {
  const geometry = new THREE.CylinderGeometry(radius, radius, depth, segments, 1, false);
  geometry.name = `${name}Geometry`;
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  return mesh;
}

function createStand() {
  const stand = new THREE.Group();
  stand.name = "ProjectorStand";

  const base = roundedBox("ProjectorStandBase", [0.204, 0.012, 0.082], 0.005, materials.stand);
  base.position.set(0, 0.006, 0.004);
  stand.add(base);

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? "L" : "R";
    const arm = roundedBox(
      `ProjectorStandArm_${suffix}`,
      [0.014, 0.074, 0.022],
      0.006,
      materials.stand,
    );
    arm.position.set(side * 0.097, 0.043, 0);
    stand.add(arm);

    const pivot = cylinder(`ProjectorPivot_${suffix}`, 0.014, 0.008, 20, materials.stand);
    pivot.rotation.y = Math.PI / 2;
    pivot.position.set(side * 0.098, 0.075, 0);
    stand.add(pivot);

    const pivotInset = cylinder(
      `ProjectorPivotInset_${suffix}`,
      0.0085,
      0.0085,
      20,
      materials.body,
    );
    pivotInset.rotation.y = Math.PI / 2;
    pivotInset.position.set(side * 0.103, 0.075, 0);
    stand.add(pivotInset);
  }

  return stand;
}

function createRearDetails(tilt) {
  const rearPanel = roundedBox("ProjectorRear", [0.15, 0.065, 0.0025], 0.012, materials.rear);
  rearPanel.position.set(0, 0, 0.056);
  tilt.add(rearPanel);

  const vents = new THREE.Group();
  vents.name = "ProjectorVent";
  vents.position.set(0, 0.011, 0.058);

  for (let index = 0; index < 11; index += 1) {
    const slot = roundedBox(
      `ProjectorVentSlot_${index + 1}`,
      [0.006, 0.029, 0.0018],
      0.0025,
      materials.recessed,
    );
    slot.position.x = (index - 5) * 0.0105;
    slot.rotation.z = -0.18;
    vents.add(slot);
  }
  tilt.add(vents);

  const usbC = roundedBox("ProjectorUSBC", [0.018, 0.007, 0.002], 0.003, materials.recessed);
  usbC.position.set(-0.038, -0.025, 0.0585);
  tilt.add(usbC);

  const auxiliaryPort = cylinder("ProjectorAuxInput", 0.0038, 0.002, 12, materials.recessed);
  auxiliaryPort.position.set(-0.012, -0.025, 0.0585);
  tilt.add(auxiliaryPort);

  const powerButton = cylinder("ProjectorPowerButton", 0.006, 0.002, 16, materials.recessed);
  powerButton.position.set(0.043, -0.025, 0.0585);
  tilt.add(powerButton);

  const led = cylinder("ProjectorLED", 0.0018, 0.0022, 12, materials.led);
  led.position.set(0.024, -0.025, 0.0587);
  tilt.add(led);
}

function createTiltingBody() {
  const tilt = new THREE.Group();
  tilt.name = "ProjectorTilt";
  tilt.position.set(0, 0.075, 0);

  const body = roundedBox("ProjectorBody", [0.18, 0.09, 0.11], 0.018, materials.body);
  tilt.add(body);

  createRearDetails(tilt);

  const lensHousing = cylinder("ProjectorLensHousing", 0.021, 0.006, 24, materials.recessed);
  lensHousing.position.set(0.044, 0.002, -0.056);
  tilt.add(lensHousing);

  const lens = cylinder("ProjectorLens", 0.0165, 0.0065, 24, materials.lens);
  lens.position.set(0.044, 0.002, -0.0605);
  tilt.add(lens);

  const topControl = cylinder("ProjectorTopControl", 0.005, 0.0015, 16, materials.recessed);
  topControl.rotation.x = Math.PI / 2;
  topControl.position.set(0.052, 0.046, 0.018);
  tilt.add(topControl);

  return tilt;
}

function createProjector() {
  const root = new THREE.Group();
  root.name = "ProjectorRoot";
  root.add(createStand(), createTiltingBody());
  root.userData = {
    dimensionsMeters: [0.215, 0.122, 0.124],
    tiltAxis: "local X",
    intendedBodyDimensionsMeters: [0.18, 0.09, 0.11],
  };
  return root;
}

function countTriangles(object) {
  let triangles = 0;
  object.traverse((child) => {
    if (!child.isMesh) return;
    const geometry = child.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
  });
  return triangles;
}

async function exportProjector() {
  const projector = createProjector();
  projector.updateMatrixWorld(true);

  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(projector, {
    binary: true,
    onlyVisible: true,
    trs: true,
  });

  await writeFile(OUTPUT_PATH, Buffer.from(arrayBuffer));
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Triangles: ${Math.round(countTriangles(projector))}`);
}

await exportProjector();
