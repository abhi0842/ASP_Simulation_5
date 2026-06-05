/**
 * Deterministic state propagation and noiseless Kalman prediction (u=0, Q=0, R=0).
 */

import { kalmanFilter } from './KalmanService.js';
import {
  analyzeStability as analyzeStabilityFromEigs,
  computeEigenvalues2x2,
} from './StabilityService.js';

export const LAB_CONSTANTS = {
  u: 0,
  Q: [
    [0, 0],
    [0, 0],
  ],
  R: 0,
  C: [[1, 0]],
};

export function propagateState(x, A) {
  return [
    A[0][0] * x[0] + A[0][1] * x[1],
    A[1][0] * x[0] + A[1][1] * x[1],
  ];
}

export function measureState(x, C = LAB_CONSTANTS.C) {
  return C[0][0] * x[0] + C[0][1] * x[1];
}

function stateNormError(a, b) {
  const e0 = a[0] - b[0];
  const e1 = a[1] - b[1];
  return Math.sqrt(e0 * e0 + e1 * e1);
}

/**
 * True open-loop trajectory + noiseless Kalman estimates.
 */
export function runNoiselessLab(x0, A, numSteps = 500, C = LAB_CONSTANTS.C) {
  const stateHistory = [[...x0]];
  const measurementHistory = [];
  let x = [...x0];

  for (let k = 0; k < numSteps; k++) {
    measurementHistory.push(measureState(x, C));
    x = propagateState(x, A);
    stateHistory.push([...x]);
  }

  const P0 = [
    [0.01, 0],
    [0, 0.01],
  ];

  const kalman = kalmanFilter(
    measurementHistory,
    A,
    C,
    LAB_CONSTANTS.Q,
    LAB_CONSTANTS.R,
    [...x0],
    P0,
    { noiselessMode: true, idealMeasurements: true, includeTraces: true }
  );

  const estimateHistory = [[...x0], ...kalman.xFiltered.map((s) => [...s])];
  const predictionHistory = [[...x0], ...kalman.xPredicted.map((s) => [...s])];

  const n = Math.min(stateHistory.length, estimateHistory.length);
  const errorSeries = [];
  let sumSq = 0;
  let maxError = 0;
  let sumError = 0;

  for (let k = 0; k < n; k++) {
    const err = stateNormError(stateHistory[k], estimateHistory[k]);
    errorSeries.push({ k, error: err, e1: stateHistory[k][0] - estimateHistory[k][0], e2: stateHistory[k][1] - estimateHistory[k][1] });
    sumSq += err * err;
    maxError = Math.max(maxError, err);
    sumError += err;
  }

  const errorMetrics = {
    rmse: n > 0 ? Math.sqrt(sumSq / n) : 0,
    maxError,
    meanError: n > 0 ? sumError / n : 0,
  };

  const eigs = computeEigenvalues2x2(A);
  const stab = analyzeStabilityFromEigs(eigs);
  const spectralRadius = Math.max(eigs.magnitude1, eigs.magnitude2);
  const tol = 1e-6;
  let stability = 'stable';
  if (spectralRadius > 1 + tol) stability = 'unstable';
  else if (Math.abs(spectralRadius - 1) <= tol) stability = 'marginally_stable';

  const eigenvalues = eigs.isComplex
    ? [
        { re: eigs.lambda1.real, im: eigs.lambda1.imag, mag: eigs.magnitude1 },
        { re: eigs.lambda2.real, im: eigs.lambda2.imag, mag: eigs.magnitude2 },
      ]
    : [
        { re: eigs.lambda1, im: 0, mag: eigs.magnitude1 },
        { re: eigs.lambda2, im: 0, mag: eigs.magnitude2 },
      ];

  return {
    stateHistory,
    measurementHistory,
    estimateHistory,
    predictionHistory,
    errorSeries,
    errorMetrics,
    eigenvalues,
    spectralRadius,
    stability,
    eigenvalueDetail: eigs,
    stabilityDetail: stab,
    kalman,
  };
}
