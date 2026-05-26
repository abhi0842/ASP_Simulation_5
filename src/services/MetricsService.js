/**
 * MetricsService.js
 * Calculates performance metrics for Kalman filtering and signal estimation
 */

/**
 * Root Mean Squared Error
 */
export function calculateRMSE(signal1, signal2) {
  if (signal1.length !== signal2.length) {
    throw new Error('Signals must have equal length');
  }

  let sumSquaredError = 0;
  for (let i = 0; i < signal1.length; i++) {
    const diff = signal1[i] - signal2[i];
    sumSquaredError += diff * diff;
  }

  const rmse = Math.sqrt(sumSquaredError / signal1.length);
  return Number(rmse.toFixed(6));
}

/**
 * Mean Absolute Error
 */
export function calculateMAE(signal1, signal2) {
  if (signal1.length !== signal2.length) {
    throw new Error('Signals must have equal length');
  }

  let sumAbsError = 0;
  for (let i = 0; i < signal1.length; i++) {
    sumAbsError += Math.abs(signal1[i] - signal2[i]);
  }

  const mae = sumAbsError / signal1.length;
  return Number(mae.toFixed(6));
}

/**
 * Peak Absolute Error
 */
export function calculatePAE(signal1, signal2) {
  if (signal1.length !== signal2.length) {
    throw new Error('Signals must have equal length');
  }

  let maxError = 0;
  for (let i = 0; i < signal1.length; i++) {
    const error = Math.abs(signal1[i] - signal2[i]);
    if (error > maxError) maxError = error;
  }

  return Number(maxError.toFixed(6));
}

/**
 * Signal-to-Noise Ratio (dB)
 */
export function calculateSNR(cleanSignal, noisySignal) {
  if (cleanSignal.length !== noisySignal.length) {
    throw new Error('Signals must have equal length');
  }

  const signalPower = cleanSignal.reduce((a, v) => a + v * v, 0) / cleanSignal.length;
  const noisePower = cleanSignal.reduce((a, v, i) => {
    const diff = v - noisySignal[i];
    return a + diff * diff;
  }, 0) / cleanSignal.length;

  if (noisePower === 0) return Infinity;
  const snrDb = 10 * Math.log10(signalPower / noisePower);

  return Number(snrDb.toFixed(2));
}

/**
 * Covariance trace (sum of diagonal elements)
 */
export function calculateCovarianceTrace(P_trace) {
  if (!P_trace || P_trace.length === 0) return 0;
  return Number(P_trace[P_trace.length - 1].toFixed(6));
}

/**
 * Innovation energy (sum of squared innovations)
 */
export function calculateInnovationEnergy(innovations) {
  if (!innovations || innovations.length === 0) return 0;

  let energy = 0;
  for (const innov of innovations) {
    energy += innov * innov;
  }

  return Number(energy.toFixed(6));
}

/**
 * Innovation white-noise test (autocorrelation)
 */
export function testInnovationWhiteness(innovations, maxLag = 20) {
  if (!innovations || innovations.length < maxLag) return null;

  // Autocorrelation at lag 0 (variance)
  const mean = innovations.reduce((a, x) => a + x, 0) / innovations.length;
  const autoCorr0 = innovations.reduce((a, x) => a + (x - mean) ** 2, 0) / innovations.length;

  const autoCorrs = [];
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < innovations.length; i++) {
      sum += (innovations[i - lag] - mean) * (innovations[i] - mean);
    }
    const acf = sum / innovations.length / autoCorr0;
    autoCorrs.push(Number(acf.toFixed(4)));
  }

  // Ljung-Box test approximation
  let Q = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    Q += (autoCorrs[lag - 1] ** 2) / (innovations.length - lag);
  }
  Q *= innovations.length * (innovations.length + 2);

  return {
    autoCorrelations: autoCorrs,
    ljungBoxStat: Number(Q.toFixed(2)),
    isWhite: Q < 30.6, // Chi-square critical value for 20 DoF at 0.05
  };
}

/**
 * Convergence analysis
 */
export function analyzeConvergence(innovations, threshold = 0.01) {
  if (!innovations || innovations.length === 0) return null;

  let convergenceStep = -1;
  for (let i = 10; i < innovations.length; i++) {
    if (Math.abs(innovations[i]) < threshold) {
      convergenceStep = i;
      break;
    }
  }

  // Settling time: first 5% of maximum error
  const maxError = Math.max(...innovations.map(Math.abs));
  const settleThreshold = 0.05 * maxError;
  let settleTime = -1;
  for (let i = 0; i < innovations.length; i++) {
    if (Math.abs(innovations[i]) < settleThreshold) {
      settleTime = i;
      break;
    }
  }

  // Overshoot: maximum error relative to steady state
  const steadyStateError = innovations.slice(-10).reduce((a, x) => a + Math.abs(x), 0) / 10;
  const maxErrorVal = Math.max(...innovations.map(Math.abs));
  const overshoot = ((maxErrorVal - steadyStateError) / (steadyStateError || 1)) * 100;

  return {
    converged: convergenceStep > 0,
    convergenceStep: convergenceStep > 0 ? convergenceStep : innovations.length,
    settleTime: settleTime > 0 ? settleTime : innovations.length,
    overshoot: Number(Math.max(0, overshoot).toFixed(2)),
    steadyStateError: Number(steadyStateError.toFixed(6)),
  };
}

/**
 * Initial condition effect analysis
 * Compare two filter runs with different initial conditions
 */
export function compareInitialConditions(run1, run2) {
  const minLen = Math.min(run1.xFiltered.length, run2.xFiltered.length);

  let maxStateDiff = 0;
  let totalStateDiff = 0;

  for (let i = 0; i < minLen; i++) {
    const diff = Math.abs(run1.xFiltered[i][0] - run2.xFiltered[i][0]);
    maxStateDiff = Math.max(maxStateDiff, diff);
    totalStateDiff += diff;
  }

  const avgStateDiff = totalStateDiff / minLen;

  // Find when difference becomes small
  let convergenceStep = minLen;
  const threshold = 0.001 * maxStateDiff;
  for (let i = 0; i < minLen; i++) {
    if (Math.abs(run1.xFiltered[i][0] - run2.xFiltered[i][0]) < threshold) {
      convergenceStep = i;
      break;
    }
  }

  return {
    maxStateDifference: Number(maxStateDiff.toFixed(6)),
    avgStateDifference: Number(avgStateDiff.toFixed(6)),
    convergenceSteps: convergenceStep,
    percentDivergence: Number(((maxStateDiff / Math.max(1, Math.max(...run1.xFiltered.map(x => Math.abs(x[0]))))) * 100).toFixed(2)),
  };
}

/**
 * Comprehensive filter evaluation
 */
export function evaluateFilterPerformance(cleanSignal, noisySignal, filteredSignal) {
  return {
    rmseNoisy: calculateRMSE(cleanSignal, noisySignal),
    rmseFiltered: calculateRMSE(cleanSignal, filteredSignal),
    maeNoisy: calculateMAE(cleanSignal, noisySignal),
    maeFiltered: calculateMAE(cleanSignal, filteredSignal),
    paeNoisy: calculatePAE(cleanSignal, noisySignal),
    paeFiltered: calculatePAE(cleanSignal, filteredSignal),
    snrImprovement: calculateSNR(cleanSignal, filteredSignal) - calculateSNR(cleanSignal, noisySignal),
    rmseImprovement: Number(((calculateRMSE(cleanSignal, noisySignal) - calculateRMSE(cleanSignal, filteredSignal)) / calculateRMSE(cleanSignal, noisySignal) * 100).toFixed(2)),
  };
}

/**
 * Stability verification through spectral radius
 */
export function calculateSpectralRadius(eigenvalues) {
  const mag1 = eigenvalues.magnitude1 || Math.abs(eigenvalues.lambda1);
  const mag2 = eigenvalues.magnitude2 || Math.abs(eigenvalues.lambda2);
  return Math.max(mag1, mag2);
}

/**
 * Controllability index (simplified for observable systems)
 */
export function estimateControllability(A) {
  // For a 2D system, controllability is related to trace and determinant
  const trace = A[0][0] + A[1][1];
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];

  // Rough metric: if eigenvalues are distinct, system is more "controllable"
  const discriminant = trace ** 2 - 4 * det;
  return {
    wellConditioned: discriminant > 0.01,
    eigenvaluesDistinct: discriminant > 0.01,
  };
}

/**
 * Generate performance summary report
 */
export function generatePerformanceReport(metrics) {
  let report = '';

  report += '## Performance Evaluation\n\n';

  report += '### Filtering Quality\n';
  report += `- RMSE (Filtered): ${metrics.rmseFiltered}\n`;
  report += `- MAE (Filtered): ${metrics.maeFiltered}\n`;
  report += `- Peak Error: ${metrics.paeFiltered}\n`;
  report += `- RMSE Improvement: ${metrics.rmseImprovement}%\n\n`;

  report += '### Noise Rejection\n';
  report += `- SNR Improvement: ${metrics.snrImprovement.toFixed(2)} dB\n`;
  report += `- Original RMSE: ${metrics.rmseNoisy}\n`;
  report += `- Filtered RMSE: ${metrics.rmseFiltered}\n`;

  return report;
}
