import { runKalmanFilter2State, solvePInfinity, solveDARE_iterative, buildFMatrix } from "./kalman";
import { matrix } from "mathjs";

export const COMPARISON_Q_VALUES = [0, 0.001, 0.01];

export function buildBMatrix() {
  return [1, 0];
}

export function buildHMatrix(observable = true) {
  return observable ? [[1, 0]] : [[0, 1]];
}

/** Observability lab: full / partial use H=[1,0]; unobservable uses H=[0,0]. */
export function buildHForObservabilityLab(mode = "full") {
  if (mode === "unobservable") return [[0, 0]];
  return [[1, 0]];
}

export function observabilityMatrix(A, H) {
  const h0 = H[0][0];
  const h1 = H[0][1];
  const a00 = A[0][0];
  const a01 = A[0][1];
  const a10 = A[1][0];
  const a11 = A[1][1];
  return [
    [h0, h1],
    [h0 * a00 + h1 * a10, h0 * a01 + h1 * a11],
  ];
}

export function observabilityRank(A, H) {
  const O = observabilityMatrix(A, H);
  const det = O[0][0] * O[1][1] - O[0][1] * O[1][0];
  return Math.abs(det) > 1e-9 ? 2 : 1;
}

export function isObservable(A, H) {
  return observabilityRank(A, H) === 2;
}

export function runFilterForQ(measurements, dt, params, Q_diag, options = {}) {
  const H = options.H ?? [[1, 0]];
  return runKalmanFilter2State(
    measurements,
    dt,
    params.x0hat,
    params.P0_alpha,
    Q_diag,
    params.R,
    {
      H,
      noiselessMode: Q_diag === 0 || options.noiselessMode,
      includeTraces: true,
      forcedMode: options.forcedMode ?? false,
      forcedUSeries: options.forcedUSeries ?? null,
      forcedU: options.forcedU ?? 0,
    }
  );
}

export function solvePInfinityForH(dt, Q_diag, R, H = [[1, 0]]) {
  const F = matrix(buildFMatrix(dt));
  const Hm = matrix(H);
  const Q = matrix([
    [Q_diag, 0],
    [0, Q_diag * 0.1],
  ]);
  return solveDARE_iterative(F, Hm, Q, R);
}

export function runObservabilityPair(measurements, dt, params, options = {}) {
  const H_obs = [[1, 0]];
  const H_bad = [[0, 1]];
  const opts = { ...options, noiselessMode: true };
  return {
    observable: runFilterForQ(measurements, dt, params, 0, { ...opts, H: H_obs }),
    nonObservable: runFilterForQ(measurements, dt, params, 0, { ...opts, H: H_bad }),
    H_obs,
    H_bad,
  };
}

export function runNoiselessVsNoisyPair(measurements, dt, params, Q_noisy, options = {}) {
  const H = options.H ?? [[1, 0]];
  const noiseless = runFilterForQ(measurements, dt, params, 0, { ...options, H });
  const noisy = runFilterForQ(measurements, dt, params, Q_noisy, { ...options, H });
  return {
    noiseless,
    noisy,
    P_inf_noiseless: solvePInfinityForH(dt, 0, params.R, H),
    P_inf_noisy: solvePInfinityForH(dt, Q_noisy, params.R, H),
  };
}

export function runTripleQComparison(measurements, dt, params, options = {}) {
  const H = options.H ?? [[1, 0]];
  return COMPARISON_Q_VALUES.map((Q) => {
    const result = runFilterForQ(measurements, dt, params, Q, options);
    const P_inf = solvePInfinityForH(dt, Q, params.R, H);
    return { Q, result, P_inf };
  });
}

export function estimationErrorSeries(estimated, truth) {
  const n = Math.min(estimated.length, truth.length);
  return Array.from({ length: n }, (_, i) => Math.abs(estimated[i] - truth[i]));
}

export function errorNormSeries(estimated, truth) {
  const n = Math.min(estimated.length, truth.length);
  let sum = 0;
  return Array.from({ length: n }, (_, i) => {
    const e = estimated[i] - truth[i];
    sum += e * e;
    return Math.sqrt(sum / (i + 1));
  });
}

export function simulateOpenLoop(x0, steps, dt, { forced = false, uSeries = null, u = 0 } = {}) {
  const A = [
    [1, dt],
    [0, 1],
  ];
  const B = buildBMatrix();
  let x = [...x0];
  const trace = [x[0]];
  for (let k = 0; k < steps; k++) {
    const uk = uSeries ? uSeries[k] : u;
    const x0n =
      A[0][0] * x[0] + A[0][1] * x[1] + (forced ? B[0] * uk : 0);
    const x1n =
      A[1][0] * x[0] + A[1][1] * x[1] + (forced ? B[1] * uk : 0);
    x = [x0n, x1n];
    trace.push(x[0]);
  }
  return trace;
}

export function covarianceTrace2x2(P_trace_scalar, P0_alpha) {
  return P_trace_scalar.map((p00) => ({
    trace: 2 * p00,
    det: p00 * p00,
    p00,
    p11: P0_alpha * 0.1,
  }));
}

export function detectSteadyState(P_trace, P_inf, threshold = 0.05) {
  if (!P_trace.length || !Number.isFinite(P_inf)) return -1;
  const target = Math.max(P_inf, 1e-12);
  for (let k = 0; k < P_trace.length; k++) {
    if (Math.abs(P_trace[k] - target) / target < threshold) return k;
  }
  return -1;
}
