/**
 * EducationalExplanationService.js
 * Provides educational interpretations and explanations for Kalman filtering concepts
 * Lightweight, no external LLM dependencies
 */

/**
 * Interpret Kalman gain behavior
 */
export function interpretKalmanGain(K, iteration) {
  if (!K || K.length < 1) return '';

  const k = K[0][0]; // For 2-state system, K is 2x1
  const gain = k.toFixed(3);

  let explanation = `**Kalman Gain at Step ${iteration}**: K = ${gain}\n\n`;

  if (k < 0.01) {
    explanation += '🔵 **High confidence in prediction** (Low gain)\n';
    explanation += 'The filter trusts its internal model more than new measurements.\n';
    explanation += '→ Transition toward steady state (filter converged)';
  } else if (k < 0.1) {
    explanation += '🟡 **Moderate gain**\n';
    explanation += 'Filter balances model prediction and measurement information.\n';
    explanation += '→ Transient convergence phase';
  } else if (k < 0.5) {
    explanation += '🟠 **High gain** (Early convergence)\n';
    explanation += 'Filter weights new measurements heavily due to initial uncertainty.\n';
    explanation += '→ Learning from measurements';
  } else {
    explanation += '🔴 **Very high gain**\n';
    explanation += 'Filter highly uncertain, responsive to every measurement.\n';
    explanation += '→ Rapid initialization phase';
  }

  return explanation;
}

/**
 * Interpret covariance evolution
 */
export function interpretCovarianceEvolution(P_trace, P_pred_trace, iteration) {
  if (!P_trace || P_trace.length === 0) return '';

  const P_k = P_trace[Math.min(iteration, P_trace.length - 1)];
  const P_k_pred = P_pred_trace[Math.min(iteration, P_pred_trace.length - 1)];
  const P_decrease = ((P_k_pred - P_k) / P_k_pred * 100).toFixed(1);

  let explanation = `**Covariance Evolution**\n\n`;
  explanation += `- Predicted Covariance P⁻: ${P_k_pred.toFixed(4)}\n`;
  explanation += `- Updated Covariance P: ${P_k.toFixed(4)}\n`;
  explanation += `- Uncertainty Reduction: ${P_decrease}%\n\n`;

  if (P_decrease > 50) {
    explanation += '✓ **Strong measurement correction**\n';
    explanation += 'Measurements significantly reduce filter uncertainty.';
  } else if (P_decrease > 10) {
    explanation += '◐ **Moderate correction**\n';
    explanation += 'Filter converging, measurement provides useful information.';
  } else {
    explanation += '◯ **Weak correction**\n';
    explanation += 'Filter near equilibrium, measurements have minimal effect.';
  }

  return explanation;
}

/**
 * Interpret innovation signal
 */
export function interpretInnovation(innovation, P_cov, R) {
  let explanation = `**Innovation (Measurement Surprise)**\n\n`;
  explanation += `Innovation: ${innovation.toFixed(4)}\n`;
  explanation += `Innovation Covariance (S): ${(P_cov + R).toFixed(4)}\n\n`;

  if (Math.abs(innovation) < 0.001) {
    explanation += '✓ **Excellent agreement**\n';
    explanation += 'Prediction matches measurement very well.';
  } else if (Math.abs(innovation) < 0.1) {
    explanation += '◐ **Good agreement**\n';
    explanation += 'Prediction and measurement are close.';
  } else if (Math.abs(innovation) < 0.5) {
    explanation += '◆ **Noticeable difference**\n';
    explanation += 'Measurement provides correction to prediction.';
  } else {
    explanation += '⚠ **Large discrepancy**\n';
    explanation += 'Either measurement noise or filter not properly tuned.';
  }

  return explanation;
}

/**
 * Explain initial condition effects
 */
export function explainInitialConditionEffects(x0hat, P0_diag) {
  let explanation = '## Initial Conditions Impact\n\n';

  explanation += `**Initial State x̂₀ = ${x0hat.toFixed(3)}**\n`;
  if (Math.abs(x0hat) < 0.1) {
    explanation += '- Zero or near-zero initial estimate\n';
    explanation += '- Filter will converge quickly if model is good\n';
  } else {
    explanation += `- Non-zero initialization\n`;
    explanation += '- May introduce initial bias in estimates\n';
  }

  explanation += `\n**Initial Covariance P₀ = ${P0_diag.toFixed(3)}**\n`;
  if (P0_diag < 0.001) {
    explanation += '- High confidence in initial estimate\n';
    explanation += '- Filter will ignore early measurements\n';
    explanation += '- Risk: locked into wrong initial condition\n';
  } else if (P0_diag < 0.1) {
    explanation += '- Moderate confidence\n';
    explanation += '- Balanced trust in model vs. measurements\n';
  } else if (P0_diag < 1.0) {
    explanation += '- Low confidence in initial estimate\n';
    explanation += '- Filter responsive to measurements\n';
  } else {
    explanation += '- Very low confidence (high uncertainty)\n';
    explanation += '- Filter heavily weights each measurement\n';
    explanation += '- May be noisy initially\n';
  }

  return explanation;
}

/**
 * Explain convergence behavior
 */
export function explainConvergence(convergenceAnalysis, eigenvalues) {
  let explanation = '## Convergence Analysis\n\n';

  if (convergenceAnalysis.converged) {
    explanation += `✓ **Filter Converged**\n`;
    explanation += `- Convergence Time: ${convergenceAnalysis.convergenceStep} steps\n`;
    explanation += `- Steady-State Error: ${convergenceAnalysis.steadyStateError.toFixed(6)}\n`;
  } else {
    explanation += `⚠ **Convergence Not Detected**\n`;
    explanation += `- Last 10% of data may not have reached steady state\n`;
  }

  explanation += `\n**Stability Margins**\n`;
  const maxMag = Math.max(eigenvalues.magnitude1, eigenvalues.magnitude2);
  if (maxMag < 0.99) {
    explanation += `✓ Stable (eigenvalues well within unit circle)\n`;
  } else if (maxMag < 1.01) {
    explanation += `⚠ Marginally stable (eigenvalues near boundary)\n`;
  } else {
    explanation += `✗ Unstable system\n`;
  }

  explanation += `\nSpectral Radius: ${maxMag.toFixed(4)}\n`;

  return explanation;
}

/**
 * Suggest parameter adjustments based on filter performance
 */
export function suggestParameterAdjustments(metrics, eigenvalues, innovations) {
  const suggestions = [];

  // Q adjustment
  if (metrics.innovationEnergy > 1.0) {
    suggestions.push({
      parameter: 'Q (Process Noise)',
      action: 'Increase',
      reason: 'Innovation energy is high, suggesting model mismatch. Increase Q to allow model flexibility.',
      code: 'Q ← Q × 1.5',
    });
  } else if (metrics.innovationEnergy < 0.01) {
    suggestions.push({
      parameter: 'Q (Process Noise)',
      action: 'Decrease',
      reason: 'Very low innovation energy. Model is very accurate. Can reduce Q.',
      code: 'Q ← Q × 0.5',
    });
  }

  // R adjustment
  if (Math.abs(metrics.snrImprovement) < 1.0) {
    suggestions.push({
      parameter: 'R (Measurement Noise)',
      action: 'Increase',
      reason: 'Limited SNR improvement. Measurements may be noisier than Q reflects.',
      code: 'R ← R × 1.5',
    });
  }

  // P0 adjustment
  if (metrics.convergenceStep > 50) {
    suggestions.push({
      parameter: 'P₀ (Initial Covariance)',
      action: 'Increase',
      reason: 'Slow convergence. Increase initial uncertainty to trust measurements earlier.',
      code: 'P₀ ← P₀ × 2',
    });
  }

  // System stability
  const maxMag = Math.max(eigenvalues.magnitude1, eigenvalues.magnitude2);
  if (maxMag > 1.01) {
    suggestions.push({
      parameter: 'Matrix A (System Model)',
      action: 'Review',
      reason: 'System is unstable. Check eigenvalues and system identification.',
      code: 'Check eigenvalues of A',
    });
  }

  return suggestions;
}

/**
 * Generate learning objectives for current module
 */
export function getLearningObjectives(moduleId) {
  const objectives = {
    module1: [
      'Understand ECG morphology and physiological basis',
      'Learn R-peak detection and heart rate calculation',
      'Visualize ECG as output of dynamic system',
    ],
    module2: [
      'Understand biomedical noise sources',
      'Learn spectral characteristics of noise',
      'Appreciate why filtering is necessary',
    ],
    module3: [
      'Understand state-space representation',
      'Learn unforced autonomous systems',
      'Understand observable systems',
    ],
    module4: [
      'Learn Kalman filter equations step-by-step',
      'Understand prediction vs. correction trade-off',
      'Visualize covariance evolution',
    ],
    module5: [
      'Critical: Understand how x̂₀ affects convergence',
      'Understand P₀ as initial uncertainty',
      'Learn covariance propagation effects',
      'Compare different initialization strategies',
    ],
    module6: [
      'Understand system stability through eigenvalues',
      'Learn autonomous prediction behavior',
      'Visualize stability regions',
    ],
    module7: [
      'Learn parameter tuning principles',
      'Understand adaptive Kalman concepts',
      'Compare classical vs. tuned filter',
    ],
    module8: [
      'Comprehensive performance evaluation',
      'Scientific reporting and documentation',
      'Parameter sensitivity analysis',
    ],
  };

  return objectives[moduleId] || [];
}

/**
 * Get reference equations for pedagogy
 */
export function getReferenceEquations(equationId) {
  const equations = {
    prediction: {
      stateEq: 'x̂ₖ⁻ = A x̂ₖ₋₁',
      covEq: 'Pₖ⁻ = A Pₖ₋₁ Aᵀ + Q',
      description: 'Prediction step: extrapolate state and covariance forward',
    },
    update: {
      innovation: 'yₖ = zₖ - H x̂ₖ⁻',
      gain: 'Kₖ = Pₖ⁻ Hᵀ (H Pₖ⁻ Hᵀ + R)⁻¹',
      stateUpdate: 'x̂ₖ = x̂ₖ⁻ + Kₖ yₖ',
      covUpdate: 'Pₖ = (I - Kₖ H) Pₖ⁻',
      description: 'Update step: correct estimate using measurement',
    },
    autonomous: {
      dynamics: 'x_{k+1} = A x_k',
      prediction: 'x̂ₖ⁻ = Aᵏ x̂₀',
      description: 'Autonomous system (unforced): evolves without control input',
    },
    noiseless: {
      Q: 'Q = 0 (or very small)',
      description: 'Noiseless/near-noiseless mode: ideal system behavior',
    },
  };

  return equations[equationId] || null;
}

/**
 * Diagnostic message for filter health
 */
export function generateDiagnosticMessage(metrics, eigenvalues, convergence) {
  let diagnostic = '';

  // System health
  const maxMag = Math.max(eigenvalues.magnitude1, eigenvalues.magnitude2);
  if (maxMag > 1.001) {
    diagnostic += '🔴 **CRITICAL**: System is unstable. Filter divergence expected.\n';
    return diagnostic;
  }

  // Convergence health
  if (convergence.converged) {
    diagnostic += '✓ Filter converged\n';
  } else if (convergence.convergenceStep < convergence.settleTime) {
    diagnostic += '⚠ Slow convergence detected\n';
  }

  // Innovation health
  if (Math.abs(metrics.snrImprovement) < 0) {
    diagnostic += '⚠ SNR degradation: filter may be amplifying noise\n';
  }

  if (diagnostic === '') {
    diagnostic = '✓ Filter operating normally';
  }

  return diagnostic;
}
