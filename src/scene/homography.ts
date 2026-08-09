export function solveHomography(
  source: readonly { x: number; y: number }[],
  destination: readonly { x: number; y: number }[],
) {
  const matrix: number[][] = [],
    values: number[] = [];
  source.forEach(({ x, y }, index) => {
    const { x: X, y: Y } = destination[index];
    matrix.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    values.push(X);
    matrix.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    values.push(Y);
  });
  for (let pivot = 0; pivot < 8; pivot++) {
    let row = pivot;
    for (let candidate = pivot + 1; candidate < 8; candidate++)
      if (Math.abs(matrix[candidate][pivot]) > Math.abs(matrix[row][pivot])) row = candidate;
    [matrix[pivot], matrix[row]] = [matrix[row], matrix[pivot]];
    [values[pivot], values[row]] = [values[row], values[pivot]];
    const divisor = matrix[pivot][pivot];
    if (Math.abs(divisor) < 1e-8) return null;
    for (let column = pivot; column < 8; column++) matrix[pivot][column] /= divisor;
    values[pivot] /= divisor;
    for (let candidate = 0; candidate < 8; candidate++) {
      if (candidate === pivot) continue;
      const factor = matrix[candidate][pivot];
      for (let column = pivot; column < 8; column++)
        matrix[candidate][column] -= factor * matrix[pivot][column];
      values[candidate] -= factor * values[pivot];
    }
  }
  const [a, b, c, d, e, f, g, h] = values;
  // CSS matrix3d is column-major. The fourth column carries the projective
  // denominator so the rectangle follows the surface's perspective exactly.
  // The solved coefficients are ordered as x' = (a*x + b*y + c) / w and
  // y' = (d*x + e*y + f) / w; CSS stores the x/y terms in column-major order.
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}
