import { runKalmanFilter, solvePInfinity, buildFMatrix } from "./kalman";

export const COMPARISON_Q_VALUES = [0, 0.001, 0.01];

export function buildHMatrix(observable = true) {
  return observable ? [[1, 0]] : [[0, 1]];
}

export function observabilityRank(A, H) {
  const h0 = H[0][0];
  const h1 = H[0][1];
  const a00 = A[0][0];
  const a01 = A[0][1];
  const a10 = A[1][0];
  const a11 = A[1][1];
  const o20 = h0 * a00 + h1 * a10;
  const o21 = h0 * a01 + h1 * a11;
  const det = h0 * o21 - h1 * o20;
  return Math.abs(det) > 1e-9 ? 2 : 1;
}

export function isObservable(A, H) {
  return observabilityRank(A, H) === 2;
}

/** Open-loop propagation: x_{k+1} = A x_k (+ B u if forced). */
export function simulateOpenLoop(x0, steps, dt, { forced = false, u = 0 } = {}) {
  const A = buildFMatrix(dt);
  const B = [1, 0];
  let x = [...x0];
  const trace = [x[0]];
  for (let k = 0; k < steps; k++) {
    const x0n = A[0][0] * x[0] + A[0][1] * x[1] + (forced ? B[0] * u : 0);
    const x1n = A[1][0] * x[0] + A[1][1] * x[1] + (forced ? B[1] * u : 0);
    x = [x0n, x1n];
    trace.push(x[0]);
  }
  return trace;
}

export function runFilterForQ(measurements, dt, params, Q_diag) {
  return runKalmanFilter(
    measurements,
    dt,
    params.x0hat,
    params.P0_alpha,
    Q_diag,
    params.R,
    { noiselessMode: Q_diag === 0, includeTraces: true }
  );
}

export function runTripleQComparison(measurements, dt, params) {
  return COMPARISON_Q_VALUES.map((Q) => {
    const result = runFilterForQ(measurements, dt, params, Q);
    const P_inf = solvePInfinity(dt, Q, params.R);
    return { Q, result, P_inf };
  });
}

export function estimationErrorSeries(estimated, truth) {
  const n = Math.min(estimated.length, truth.length);
  return Array.from({ length: n }, (_, i) => Math.abs(estimated[i] - truth[i]));
}
