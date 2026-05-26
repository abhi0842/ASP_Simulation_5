/**
 * StateSpaceService.js
 * Handles state-space matrix configuration, validation, and dynamic system analysis
 * Focuses on UNFORCED systems: x_{k+1} = A x_k + w_k (NO B matrix)
 */

import * as math from 'mathjs';

/**
 * Validate state-space matrices
 */
export function validateStateSpaceMatrices(A, H, Q, R) {
  const errors = [];

  if (!A || A.length === 0) errors.push('A matrix required');
  if (!H || H.length === 0) errors.push('H matrix required');
  if (!Q || Q.length === 0) errors.push('Q matrix required');
  if (typeof R !== 'number' || R < 0) errors.push('R must be a non-negative number');

  // Check dimensions
  const n = A.length; // state dimension
  const m = H.length; // measurement dimension

  if (A.length !== n || !A.every(row => row.length === n)) {
    errors.push(`A must be ${n}x${n} square matrix`);
  }

  if (H.length !== m || !H.every(row => row.length === n)) {
    errors.push(`H must be ${m}x${n} matrix`);
  }

  if (Q.length !== n || !Q.every(row => row.length === n)) {
    errors.push(`Q must be ${n}x${n} symmetric positive semidefinite`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get 2-state ECG model presets
 */
export function getStateSpacePresets() {
  return [
    {
      id: 'ecg_stable',
      label: 'Stable ECG Model',
      description: 'Standard stable ECG dynamic model',
      A: [[1.0, 0.002], [0, 0.99]],
      H: [[1, 0]],
      Q: [[0.001, 0], [0, 0.0001]],
      R: 0.01,
    },
    {
      id: 'ecg_slow_drift',
      label: 'Slow-Drift Model',
      description: 'Accounts for slow physiological drift',
      A: [[0.995, 0.002], [0, 0.999]],
      H: [[1, 0]],
      Q: [[0.002, 0], [0, 0.0002]],
      R: 0.015,
    },
    {
      id: 'fast_dynamics',
      label: 'Fast Dynamics Model',
      description: 'Captures rapid ECG changes',
      A: [[0.98, 0.005], [0, 0.95]],
      H: [[1, 0]],
      Q: [[0.005, 0], [0, 0.0005]],
      R: 0.02,
    },
    {
      id: 'minimal_noise',
      label: 'Minimal Process Noise',
      description: 'Near-noiseless autonomous system (Topic 2B)',
      A: [[1.0, 0.002], [0, 0.995]],
      H: [[1, 0]],
      Q: [[0, 0], [0, 0]],
      R: 0.005,
    },
  ];
}

/**
 * Generate identity matrix
 */
export function createIdentityMatrix(n) {
  const I = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = 1;
    I.push(row);
  }
  return I;
}

/**
 * Create diagonal matrix from array
 */
export function createDiagonalMatrix(diag) {
  const n = diag.length;
  const matrix = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = diag[i];
    matrix.push(row);
  }
  return matrix;
}

/**
 * Parse matrix from string input (semicolon-separated rows, space/comma-separated columns)
 */
export function parseMatrixFromString(str) {
  try {
    const rows = str.split(';').map(r => r.trim()).filter(r => r);
    const matrix = rows.map(row => {
      const cols = row.split(/[\s,]+/).map(c => parseFloat(c.trim()));
      return cols.filter(c => !isNaN(c));
    });
    return matrix;
  } catch (e) {
    return null;
  }
}

/**
 * Format matrix to string for display
 */
export function formatMatrixToString(matrix) {
  if (!matrix || matrix.length === 0) return '';
  return matrix.map(row =>
    row.map(v => Number.isFinite(v) ? v.toFixed(4) : '0').join(', ')
  ).join('\n');
}

/**
 * Compute eigenvalues of 2x2 matrix using closed form
 */
export function computeEigenvalues2x2(A) {
  if (!A || A.length !== 2 || A[0].length !== 2) {
    return { lambda1: 0, lambda2: 0, error: 'Invalid matrix' };
  }

  const a = A[0][0];
  const b = A[0][1];
  const c = A[1][0];
  const d = A[1][1];

  // Characteristic polynomial: λ² - (a+d)λ + (ad-bc) = 0
  const trace = a + d;
  const det = a * d - b * c;
  const discriminant = trace * trace - 4 * det;

  if (discriminant < 0) {
    // Complex eigenvalues
    const realPart = trace / 2;
    const imagPart = Math.sqrt(-discriminant) / 2;
    return {
      lambda1: { real: realPart, imag: imagPart },
      lambda2: { real: realPart, imag: -imagPart },
      isComplex: true,
    };
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  return {
    lambda1,
    lambda2,
    isComplex: false,
  };
}

/**
 * Check system stability: all eigenvalues must have |λ| ≤ 1 for discrete systems
 */
export function checkStability(eigenvalues) {
  const magnitude1 = eigenvalues.isComplex
    ? Math.sqrt(eigenvalues.lambda1.real ** 2 + eigenvalues.lambda1.imag ** 2)
    : Math.abs(eigenvalues.lambda1);

  const magnitude2 = eigenvalues.isComplex
    ? Math.sqrt(eigenvalues.lambda2.real ** 2 + eigenvalues.lambda2.imag ** 2)
    : Math.abs(eigenvalues.lambda2);

  const stable = magnitude1 <= 1.0 && magnitude2 <= 1.0;
  const marginal = magnitude1 <= 1.001 && magnitude2 <= 1.001;

  return {
    stable,
    marginal,
    magnitude1: Number(magnitude1.toFixed(4)),
    magnitude2: Number(magnitude2.toFixed(4)),
  };
}

/**
 * Simulate autonomous system evolution: x_{k+1} = A x_k
 */
export function simulateAutonomousSystem(A, x0, steps) {
  const n = A.length;
  const trajectory = [x0];
  let x = [...x0];

  for (let k = 0; k < steps; k++) {
    // Matrix-vector multiply: x_new = A * x
    const xNew = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        xNew[i] += A[i][j] * x[j];
      }
    }
    x = xNew;
    trajectory.push([...x]);
  }

  return trajectory;
}

/**
 * Get observability matrix [H; H*A; H*A²; ...]
 */
export function getObservabilityMatrix(H, A, rank = 2) {
  const obsMatrix = [H];
  let Apow = A;

  for (let i = 1; i < rank; i++) {
    const row = matrixVectorMultiply(H, Apow);
    obsMatrix.push(row);
    Apow = matrixMultiply(Apow, A);
  }

  return obsMatrix;
}

/**
 * Check observability (rank of observability matrix == n)
 */
export function isObservable(H, A) {
  const obsMatrix = getObservabilityMatrix(H, A, A.length);
  const rank = computeMatrixRank(obsMatrix);
  return rank === A.length;
}

/**
 * Simple matrix multiplication
 */
export function matrixMultiply(A, B) {
  const n = A.length;
  const m = B[0].length;
  const p = B.length;

  const C = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < p; k++) {
        row[j] += A[i][k] * B[k][j];
      }
    }
    C.push(row);
  }
  return C;
}

/**
 * Matrix-vector multiply
 */
export function matrixVectorMultiply(A, v) {
  return A.map(row => row.reduce((sum, a, j) => sum + a * v[j], 0));
}

/**
 * Compute matrix rank using Gaussian elimination
 */
export function computeMatrixRank(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const M = matrix.map(row => [...row]);

  let rank = 0;
  for (let col = 0; col < cols; col++) {
    // Find pivot
    let pivot = -1;
    for (let row = rank; row < rows; row++) {
      if (Math.abs(M[row][col]) > 1e-10) {
        pivot = row;
        break;
      }
    }
    if (pivot === -1) continue;

    // Swap rows
    [M[rank], M[pivot]] = [M[pivot], M[rank]];

    // Eliminate column
    for (let row = rank + 1; row < rows; row++) {
      const factor = M[row][col] / M[rank][col];
      for (let c = col; c < cols; c++) {
        M[row][c] -= factor * M[rank][c];
      }
    }
    rank++;
  }

  return rank;
}

/**
 * Get system description (human-readable interpretation)
 */
export function getSystemDescription(A, H, Q, R) {
  const eigenvalues = computeEigenvalues2x2(A);
  const stability = checkStability(eigenvalues);
  const observable = isObservable(H, A);

  let description = '';

  if (stability.stable) {
    description += '✓ Asymptotically stable system\n';
  } else if (stability.marginal) {
    description += '⚠ Marginally stable system (eigenvalues near boundary)\n';
  } else {
    description += '✗ Unstable system (divergent)\n';
  }

  description += `Eigenvalues: λ₁ = ${eigenvalues.isComplex ? 
    `${eigenvalues.lambda1.real.toFixed(4)} ± ${eigenvalues.lambda1.imag.toFixed(4)}i` :
    eigenvalues.lambda1.toFixed(4)}, λ₂ = ${eigenvalues.isComplex ?
    eigenvalues.lambda2.imag.toFixed(4) :
    eigenvalues.lambda2.toFixed(4)}\n`;

  description += `Observability: ${observable ? '✓ Observable' : '✗ Not observable'}\n`;

  if (Q.every(row => row.every(v => Math.abs(v) < 1e-10))) {
    description += 'Process Noise: Noiseless (Q ≈ 0) - Topic 2B\n';
  } else {
    description += `Process Noise: Q trace = ${Q.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0).toFixed(4)}\n`;
  }

  description += `Measurement Noise: R = ${R.toFixed(4)}`;

  return description;
}
