/**
 * KalmanService.js
 * Enhanced Kalman filtering with UNFORCED dynamics and NOISELESS mode
 * Focus on initial conditions, covariance evolution, and autonomous system behavior
 */

/**
 * Perform Kalman filtering on measurements
 * 
 * System: x_{k+1} = A x_k + w_k (unforced, autonomous)
 *         z_k = H x_k + v_k
 * 
 * Parameters:
 *   - measurements: array of observations
 *   - A: state transition matrix
 *   - H: measurement matrix
 *   - Q: process noise covariance
 *   - R: measurement noise covariance (scalar)
 *   - x0hat: initial state estimate
 *   - P0: initial error covariance matrix (diagonal)
 *   - options: {noiselessMode, includeTraces}
 */
export function kalmanFilter(
  measurements,
  A,
  H,
  Q,
  R,
  x0hat,
  P0,
  options = {}
) {
  const { noiselessMode = false, includeTraces = true } = options;

  const n = A.length; // state dimension
  const m = measurements.length;

  if (m === 0) {
    return {
      xFiltered: [],
      xPredicted: [],
      P_trace: [],
      P_predicted_trace: [],
      K_trace: [],
      innovations: [],
      converged: false,
      convergenceTime: 0,
    };
  }

  // Topic 2B: noiseless state-space model → force process noise Q = 0.
  // Measurement noise level R is kept as provided by the student.
  let Q_eff = Q;
  let R_eff = R;
  if (noiselessMode) {
    Q_eff = Q.map(row => row.map(() => 0));
  }

  // Initialize
  let xhat = x0hat;
  let P = P0.map(row => [...row]); // Copy

  const xFiltered = [];
  const xPredicted = [];
  const P_trace = [];
  const P_predicted_trace = [];
  const K_trace = [];
  const innovations = [];

  let converged = false;
  let convergenceTime = 0;

  for (let k = 0; k < m; k++) {
    // PREDICTION STEP
    // x_k^- = A * x_{k-1}
    const xPred = matrixVectorMultiply(A, xhat);

    // P_k^- = A * P_{k-1} * A^T + Q
    const AP = matrixMultiply(A, P);
    const APAt = matrixMultiply(AP, transpose(A));
    const Ppred = matrixAdd(APAt, Q_eff);

    // MEASUREMENT UPDATE
    // Innovation: y_k = z_k - H * x_k^-
    const Hxpred = matrixVectorMultiply(H, xPred);
    const z_k = measurements[k];
    const innov = z_k - Hxpred[0]; // For 1D measurement

    // Innovation covariance: S_k = H * P_k^- * H^T + R
    const HP = matrixMultiply(H, Ppred);
    const HPHt = matrixMultiply(HP, transpose(H));
    const S = HPHt[0][0] + R_eff;

    // Kalman gain: K_k = P_k^- * H^T * S_k^{-1}
    const PHt = matrixMultiply(Ppred, transpose(H)); // P^- * H^T
    const K = PHt.map(row => row.map(v => v / S)); // Divide by scalar S

    // Updated estimate: x_k = x_k^- + K_k * (z_k - H * x_k^-)
    const Kinnov = matrixVectorMultiply(K, [innov]);
    xhat = vectorAdd(xPred, Kinnov);

    // Updated covariance: P_k = (I - K_k * H) * P_k^-
    const KH = matrixMultiply(K, H);
    const I = createIdentityMatrix(n);
    const IKH = matrixSubtract(I, KH);
    // Joseph form for numerical stability:
    // P = (I-KH)P^-(I-KH)^T + K R K^T
    const josephLeft = matrixMultiply(matrixMultiply(IKH, Ppred), transpose(IKH));
    const KR = K.map(row => row.map(v => v * R_eff));
    const josephRight = matrixMultiply(KR, transpose(K));
    P = matrixAdd(josephLeft, josephRight);

    // Store results
    xFiltered.push([...xhat]);
    xPredicted.push([...xPred]);

    if (includeTraces) {
      P_predicted_trace.push(Ppred[0][0]); // For 2-state, store p00
      P_trace.push(P[0][0]);
      const Ktrace = K[0][0]; // For 1D measurement
      K_trace.push(Ktrace);
      innovations.push(innov);

      // Check for convergence
      if (!converged && Math.abs(innov) < 0.01 && k > 10) {
        converged = true;
        convergenceTime = k;
      }
    }
  }

  return {
    xFiltered,
    xPredicted,
    P_trace,
    P_predicted_trace,
    K_trace,
    innovations,
    converged,
    convergenceTime,
  };
}

/**
 * Step-by-step Kalman filter for interactive learning
 * Returns detailed information for each step
 */
export class InteractiveKalmanFilter {
  constructor(A, H, Q, R, x0hat, P0, measurements, options = {}) {
    this.A = A;
    this.H = H;
    this.Q = options.noiselessMode ? Q.map(r => r.map(() => 0)) : Q;
    this.R = R;
    this.measurements = measurements;
    this.options = options;

    this.n = A.length;
    this.xhat = x0hat;
    this.P = P0.map(row => [...row]);
    this.step = 0;
    this.history = [];

    this.updateHistory();
  }

  updateHistory() {
    this.history.push({
      step: this.step,
      xhat: [...this.xhat],
      P: this.P.map(r => [...r]),
    });
  }

  /**
   * Execute single Kalman step
   */
  executeStep() {
    if (this.step >= this.measurements.length) {
      return { error: 'No more measurements' };
    }

    // Prediction
    const xPred = matrixVectorMultiply(this.A, this.xhat);
    const AP = matrixMultiply(this.A, this.P);
    const APAt = matrixMultiply(AP, transpose(this.A));
    const Ppred = matrixAdd(APAt, this.Q);

    // Innovation
    const Hxpred = matrixVectorMultiply(this.H, xPred);
    const z = this.measurements[this.step];
    const innov = z - Hxpred[0];

    // Innovation covariance
    const HP = matrixMultiply(this.H, Ppred);
    const HPHt = matrixMultiply(HP, transpose(this.H));
    const S = HPHt[0][0] + this.R;

    // Kalman gain
    // Use predicted covariance for gain at step k: K_k = P_k^- H^T S_k^{-1}
    const PHt = matrixMultiply(Ppred, transpose(this.H));
    const K = PHt.map(row => row.map(v => v / S));

    // Update
    const Kinnov = matrixVectorMultiply(K, [innov]);
    const xhatNew = vectorAdd(xPred, Kinnov);

    // Covariance update
    const KH = matrixMultiply(K, this.H);
    const I = createIdentityMatrix(this.n);
    const IKH = matrixSubtract(I, KH);
    const P = matrixMultiply(IKH, Ppred);

    const result = {
      step: this.step,
      measurement: z,
      xPredicted: xPred,
      Ppredicted: Ppred,
      innovation: innov,
      innovationCov: S,
      kalmanGain: K,
      xUpdated: xhatNew,
      Pupdated: P,
    };

    this.xhat = xhatNew;
    this.P = P;
    this.step++;
    this.updateHistory();

    return result;
  }

  /**
   * Reset filter
   */
  reset(x0hat, P0) {
    this.xhat = x0hat;
    this.P = P0.map(row => [...row]);
    this.step = 0;
    this.history = [];
    this.updateHistory();
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return {
      step: this.step,
      xhat: [...this.xhat],
      P: this.P.map(r => [...r]),
    };
  }
}

/**
 * Compare two filter runs (e.g., different initial conditions)
 */
export function compareFilterRuns(run1, run2) {
  const errorState = [];
  const errorCovariance = [];

  const minLen = Math.min(run1.xFiltered.length, run2.xFiltered.length);

  for (let k = 0; k < minLen; k++) {
    const diff = run1.xFiltered[k][0] - run2.xFiltered[k][0];
    errorState.push(Math.abs(diff));

    const P1 = run1.P_trace[k];
    const P2 = run2.P_trace[k];
    errorCovariance.push(Math.abs(P1 - P2));
  }

  return {
    errorState,
    errorCovariance,
    maxStateError: Math.max(...errorState),
    avgStateError: errorState.reduce((a, b) => a + b, 0) / errorState.length,
    maxCovError: Math.max(...errorCovariance),
  };
}

/**
 * Autonomous prediction without measurements
 */
export function predictAutonomous(A, x0hat, P0, steps, Q) {
  const xPrediction = [x0hat];
  const PPrediction = [P0.map(r => [...r])];

  let x = [...x0hat];
  let P = P0.map(r => [...r]);

  for (let k = 0; k < steps; k++) {
    // State prediction
    x = matrixVectorMultiply(A, x);
    xPrediction.push([...x]);

    // Covariance prediction
    const AP = matrixMultiply(A, P);
    const APAt = matrixMultiply(AP, transpose(A));
    P = matrixAdd(APAt, Q);
    PPrediction.push(P.map(r => [...r]));
  }

  return { xPrediction, PPrediction };
}

// ========== Matrix utilities ==========

export function createIdentityMatrix(n) {
  const I = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = 1;
    I.push(row);
  }
  return I;
}

export function matrixAdd(A, B) {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

export function matrixSubtract(A, B) {
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

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

export function matrixVectorMultiply(A, v) {
  return A.map(row => row.reduce((sum, a, j) => sum + a * v[j], 0));
}

export function vectorAdd(v1, v2) {
  return v1.map((v, i) => v + v2[i]);
}

export function vectorSubtract(v1, v2) {
  return v1.map((v, i) => v - v2[i]);
}

export function transpose(A) {
  const n = A.length;
  const m = A[0].length;
  const AT = [];
  for (let j = 0; j < m; j++) {
    const row = [];
    for (let i = 0; i < n; i++) {
      row.push(A[i][j]);
    }
    AT.push(row);
  }
  return AT;
}

export function formatMatrix(A, precision = 4) {
  return A.map(row =>
    '[' + row.map(v => Number.isFinite(v) ? v.toFixed(precision) : '—').join(', ') + ']'
  ).join('\n');
}

export function formatVector(v, precision = 4) {
  return '[' + v.map(val => Number.isFinite(val) ? val.toFixed(precision) : '—').join(', ') + ']';
}
