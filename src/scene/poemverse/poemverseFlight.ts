import * as THREE from "three";

import { skyToWorld } from "./constellationSky";
import { POEMVERSE_CEILING_HEIGHT, POEMVERSE_DECAL_SIZE } from "./poemverseCeiling";

import type { SkyBounds } from "./constellationLayout";
import type { SkyBasis } from "./constellationSky";

export interface FlightPlan {
  path: THREE.CatmullRomCurve3;
  spawn: THREE.Vector3;
  landing: THREE.Vector3;
  away: THREE.Vector3;
  side: THREE.Vector3;
  sky: SkyBasis;
  skyFocus: THREE.Vector3;
  flightCrane: THREE.Vector3;
  skyCrane: THREE.Vector3;
  skyFovBoost: number;
  startRadius: number;
}

export const FLIGHT_HOLD_SECONDS = 0.2;
export const FLIGHT_DURATION_SECONDS = 4.6;
export const CRUISE_RADIUS = 0.05;
export const LANDING_RADIUS = POEMVERSE_DECAL_SIZE * 0.3;
export const FLIGHT_FOV_BOOST = 9;

const SKY_DISTANCE = 1.0;
const SKY_CENTRE_X = 0.4;
const SKY_CENTRE_PULL = 0.5;
const FLIGHT_CAMERA_HEIGHT = 4.1;
const FLIGHT_CAMERA_RETREAT = 1.1;
const SKY_CAMERA_HEIGHT = 3.7;
const SKY_CAMERA_RETREAT = 1.7;
const LANDSCAPE_SKY_FOV = 46;
const PORTRAIT_SKY_FOV = 66;
const ROOM_BOUNDS = { minX: -5.4, maxX: 5.3, minZ: -3.6, maxZ: 6 };
const SKY_MARGIN = 0.25;
const SKY_FIT_PASSES = 3;
const SKY_FOCUS_LIFT = 0.45;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function createFlightPlan(options: {
  spawn: THREE.Vector3;
  cameraPosition: THREE.Vector3;
  cameraFov: number;
  aspect: number;
  startRadius: number;
  landingSky: [number, number] | null;
  skyBounds: SkyBounds;
}): FlightPlan {
  const spawn = options.spawn.clone();
  const centre = spawn
    .clone()
    .addScaledVector(horizontalDirection(options.cameraPosition, spawn), SKY_DISTANCE);
  centre.x = THREE.MathUtils.lerp(centre.x, SKY_CENTRE_X, SKY_CENTRE_PULL);
  centre.y = POEMVERSE_CEILING_HEIGHT;
  const away = horizontalDirection(options.cameraPosition, centre);
  const side = new THREE.Vector3();
  const sky: SkyBasis = { centre, right: new THREE.Vector3(), up: new THREE.Vector3() };
  const skyCamera = new THREE.Vector3();
  for (let pass = 0; pass < SKY_FIT_PASSES; pass++) {
    skyCamera
      .copy(options.cameraPosition)
      .add(craneOffset(away, options.cameraPosition, SKY_CAMERA_RETREAT, SKY_CAMERA_HEIGHT));
    away.copy(horizontalDirection(skyCamera, centre));
    side.crossVectors(away, WORLD_UP).normalize();
    sky.right.copy(side);
    sky.up.copy(away).negate();
    fitSkyInsideRoom(sky, options.skyBounds);
  }

  const landing = new THREE.Vector3();
  if (options.landingSky) skyToWorld(sky, options.landingSky[0], options.landingSky[1], landing);
  else landing.copy(centre);
  landing.x = THREE.MathUtils.clamp(landing.x, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
  landing.z = THREE.MathUtils.clamp(landing.z, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);
  landing.y = POEMVERSE_CEILING_HEIGHT;

  const arrival = landing.clone();
  arrival.y -= LANDING_RADIUS + 0.004;
  const rise = arrival.y - spawn.y;
  const axes = { away, side };
  const path = new THREE.CatmullRomCurve3(
    [
      spawn,
      offsetPoint(spawn, axes, { up: 0.42, away: -0.06, side: 0.04 }),
      offsetPoint(spawn, axes, { up: rise * 0.2, away: 0.55, side: 0.6 }),
      offsetPoint(spawn.clone().lerp(arrival, 0.58), axes, { up: 0, away: -0.15, side: -0.85 }),
      offsetPoint(arrival, axes, { up: -0.85, away: -0.3, side: 0.38 }),
      arrival,
    ],
    false,
    "centripetal",
  );

  const skyFov = options.aspect < 0.9 ? PORTRAIT_SKY_FOV : LANDSCAPE_SKY_FOV;
  return {
    path,
    spawn,
    landing,
    away,
    side,
    sky,
    skyFocus: centre.clone().addScaledVector(sky.up, SKY_FOCUS_LIFT),
    flightCrane: craneOffset(
      away,
      options.cameraPosition,
      FLIGHT_CAMERA_RETREAT,
      FLIGHT_CAMERA_HEIGHT,
    ),
    skyCrane: craneOffset(away, options.cameraPosition, SKY_CAMERA_RETREAT, SKY_CAMERA_HEIGHT),
    skyFovBoost: Math.max(FLIGHT_FOV_BOOST, skyFov - options.cameraFov),
    startRadius: options.startRadius,
  };
}

export function flightProgress(time: number) {
  const smooth = time * time * (3 - 2 * time);
  const dart = 1 - Math.pow(1 - time, 3);
  return smooth * 0.5 + dart * 0.5;
}

export function flightRadius(time: number, startRadius: number) {
  const departure = THREE.MathUtils.lerp(startRadius, CRUISE_RADIUS, smoothstep(0, 0.2, time));
  return THREE.MathUtils.lerp(departure, LANDING_RADIUS, smoothstep(0.7, 1, time));
}

export function flutterEnvelope(time: number) {
  return Math.pow(Math.sin(Math.PI * time), 1.2) * (1 - time * 0.45);
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function fitSkyInsideRoom(sky: SkyBasis, bounds: SkyBounds) {
  const corner = new THREE.Vector3();
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const x of [bounds.minX, bounds.maxX])
    for (const y of [bounds.minY, bounds.maxY]) {
      skyToWorld(sky, x, y, corner);
      minX = Math.min(minX, corner.x);
      maxX = Math.max(maxX, corner.x);
      minZ = Math.min(minZ, corner.z);
      maxZ = Math.max(maxZ, corner.z);
    }
  sky.centre.x += overflowCorrection(minX, maxX, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
  sky.centre.z += overflowCorrection(minZ, maxZ, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);
}

function overflowCorrection(minimum: number, maximum: number, lower: number, upper: number) {
  if (minimum < lower + SKY_MARGIN) return lower + SKY_MARGIN - minimum;
  if (maximum > upper - SKY_MARGIN) return upper - SKY_MARGIN - maximum;
  return 0;
}

function craneOffset(
  away: THREE.Vector3,
  cameraPosition: THREE.Vector3,
  retreat: number,
  height: number,
) {
  return new THREE.Vector3().addScaledVector(away, -retreat).setY(height - cameraPosition.y);
}

function horizontalDirection(from: THREE.Vector3, to: THREE.Vector3) {
  const direction = new THREE.Vector3(to.x - from.x, 0, to.z - from.z);
  if (direction.lengthSq() < 0.0001) return direction.set(0, 0, -1);
  return direction.normalize();
}

function offsetPoint(
  origin: THREE.Vector3,
  axes: { away: THREE.Vector3; side: THREE.Vector3 },
  offset: { up: number; away: number; side: number },
) {
  return origin
    .clone()
    .addScaledVector(WORLD_UP, offset.up)
    .addScaledVector(axes.away, offset.away)
    .addScaledVector(axes.side, offset.side);
}
