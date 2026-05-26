/**
 * StabilityService.js
 * Analyzes system stability, eigenvalues, and autonomous dynamics
 */

/**
 * Compute eigenvalues of 2x2 matrix analytically
 */
export function computeEigenvalues2x2(A) {
  if (!A || A.length !== 2 || A[0].length !== 2) {
    return null;
  }

  const a = A[0][0];
  const b = A[0][1];
  const c = A[1][0];
  const d = A[1][1];

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
      magnitude1: Math.sqrt(realPart ** 2 + imagPart ** 2),
      magnitude2: Math.sqrt(realPart ** 2 + imagPart ** 2),
    };
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  return {
    lambda1,
    lambda2,
    isComplex: false,
    magnitude1: Math.abs(lambda1),
    magnitude2: Math.abs(lambda2),
  };
}

/**
 * Analyze system stability for discrete-time systems
 * Stable if all |λᵢ| < 1
 * Marginal if all |λᵢ| ≤ 1 with at least one |λᵢ| = 1
 * Unstable otherwise
 */
export function analyzeStability(eigenvalues) {
  if (!eigenvalues) return null;

  const mag1 = eigenvalues.magnitude1;
  const mag2 = eigenvalues.magnitude2;

  const stable = mag1 < 1.0 && mag2 < 1.0;
  const marginal = (mag1 <= 1.0 && mag2 <= 1.0) && (Math.abs(mag1 - 1.0) < 1e-6 || Math.abs(mag2 - 1.0) < 1e-6);
  const unstable = mag1 > 1.0 || mag2 > 1.0;

  return {
    stable,
    marginal,
    unstable,
    magnitude1: Number(mag1.toFixed(4)),
    magnitude2: Number(mag2.toFixed(4)),
    stabilityMargin: Number((1.0 - Math.max(mag1, mag2)).toFixed(4)),
  };
}

/**
 * Generate stability region data for visualization
 * Returns grid of stability info
 */
export function generateStabilityRegion(minVal = -2, maxVal = 2, gridSize = 50) {
  const step = (maxVal - minVal) / gridSize;
  const data = [];

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const a = minVal + i * step;
      const d = minVal + j * step;

      // Simple 2D approximation: A = [[a, 0], [0, d]]
      const A = [[a, 0], [0, d]];
      const eigs = computeEigenvalues2x2(A);
      const stab = analyzeStability(eigs);

      data.push({
        x: a,
        y: d,
        stable: stab.stable,
        marginal: stab.marginal,
      });
    }
  }

  return data;
}

/**
 * Predict divergence rate based on eigenvalues
 */
export function predictDivergence(eigenvalues, steps) {
  if (!eigenvalues) return null;

  const mag1 = eigenvalues.magnitude1;
  const mag2 = eigenvalues.magnitude2;
  const maxMag = Math.max(mag1, mag2);

  const amplification = Math.pow(maxMag, steps);
  const divergenceRate = Math.log(maxMag);

  return {
    amplification: Number(amplification.toFixed(4)),
    divergenceRate: Number(divergenceRate.toFixed(4)),
    willDiverge: maxMag > 1.001,
    willConverge: maxMag < 0.999,
    isNeutral: Math.abs(maxMag - 1.0) < 0.001,
  };
}

/**
 * Get stability interpretation for pedagogy
 */
export function getStabilityInterpretation(eigenvalues, stability) {
  if (!eigenvalues || !stability) return '';

  let text = '';

  if (stability.stable) {
    text += '✓ **Asymptotically Stable**\n';
    text += 'All autonomous trajectories converge to equilibrium.\n';
  } else if (stability.marginal) {
    text += '⚠ **Marginally Stable**\n';
    text += 'System remains bounded but may not converge.\n';
  } else {
    text += '✗ **Unstable**\n';
    text += 'Trajectories diverge from equilibrium (exponential growth).\n';
  }

  text += `\nEigenvalues: λ₁ = ${eigenvalues.isComplex ? 
    `${eigenvalues.lambda1.real.toFixed(3)} ± ${eigenvalues.lambda1.imag.toFixed(3)}i` :
    eigenvalues.lambda1.toFixed(3)
  }\n`;

  if (!eigenvalues.isComplex) {
    text += `λ₂ = ${eigenvalues.lambda2.toFixed(3)}\n`;
  }

  text += `\nStability Margin: ${Math.max(0, stability.stabilityMargin).toFixed(3)}`;

  return text;
}

/**
 * Analyze long-term prediction degradation
 */
export function analyzePredictionHorizon(eigenvalues, S0 = 1.0, Q = [[0, 0], [0, 0]], thresholdFactor = 10) {
  const mag = Math.max(eigenvalues.magnitude1, eigenvalues.magnitude2);

  // Covariance grows as P_k ≈ A^k * P_0 * A^{kT} + Q
  // For autonomous Q=0 case: P_k ~ mag^{2k} * P_0
  // Find k where ||P_k|| > threshold * ||P_0||

  if (mag < 1.0) {
    return {
      horizon: Infinity,
      reason: 'Stable system - covariance converges',
    };
  }

  if (Math.abs(mag - 1.0) < 1e-6) {
    return {
      horizon: Infinity,
      reason: 'Marginal system - covariance constant',
    };
  }

  const k = Math.log(thresholdFactor) / (2 * Math.log(mag));
  return {
    horizon: Math.ceil(k),
    reason: `Unstable system - covariance grows exponentially`,
    growthRate: Number(mag.toFixed(4)),
  };
}

/**
 * Phase portrait analysis for 2D systems
 */
export function generatePhasePortrait(A, bounds = { x: [-2, 2], y: [-2, 2] }, gridSize = 15) {
  const vectors = [];
  const xRange = bounds.x;
  const yRange = bounds.y;

  const xStep = (xRange[1] - xRange[0]) / gridSize;
  const yStep = (yRange[1] - yRange[0]) / gridSize;

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const x = xRange[0] + i * xStep;
      const y = yRange[0] + j * yStep;

      // Next state: [x', y']' = A * [x, y]'
      const xp = A[0][0] * x + A[0][1] * y;
      const yp = A[1][0] * x + A[1][1] * y;

      // Displacement vector
      const dx = xp - x;
      const dy = yp - y;

      // Normalize for visualization
      const mag = Math.sqrt(dx * dx + dy * dy);
      const scale = mag === 0 ? 0 : 0.5 / mag;

      vectors.push({
        x,
        y,
        dx: dx * scale,
        dy: dy * scale,
        magnitude: mag,
      });
    }
  }

  return vectors;
}

/**
 * Simulate trajectory in phase space
 */
export function simulateTrajectory(A, x0, steps) {
  const trajectory = [x0];
  let x = [...x0];

  for (let k = 0; k < steps; k++) {
    const xNew = [
      A[0][0] * x[0] + A[0][1] * x[1],
      A[1][0] * x[0] + A[1][1] * x[1],
    ];
    trajectory.push(xNew);
    x = xNew;
  }

  return trajectory;
}
