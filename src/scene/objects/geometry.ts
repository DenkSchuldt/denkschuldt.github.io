"use client";

import { useEffect, useMemo } from "react";

import * as THREE from "three";

export function roundedRectangleShape(width: number, height: number, radius: number) {
  const x = -width / 2,
    y = -height / 2,
    shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export function roundedRectangleHole(width: number, height: number, radius: number) {
  const x = -width / 2,
    y = -height / 2,
    path = new THREE.Path();
  path.moveTo(x + radius, y);
  path.quadraticCurveTo(x, y, x, y + radius);
  path.lineTo(x, y + height - radius);
  path.quadraticCurveTo(x, y + height, x + radius, y + height);
  path.lineTo(x + width - radius, y + height);
  path.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  path.lineTo(x + width, y + radius);
  path.quadraticCurveTo(x + width, y, x + width - radius, y);
  path.lineTo(x + radius, y);
  return path;
}

export function useMacBookShellGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevel: number,
) {
  const geometry = useMemo(() => {
    const result = new THREE.ExtrudeGeometry(roundedRectangleShape(width, height, radius), {
      depth,
      steps: 1,
      curveSegments: 16,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
    });
    result.center();
    result.computeVertexNormals();
    return result;
  }, [width, height, depth, radius, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}
