/**
 * Module6Stability.jsx
 * Dynamic Stability & Prediction Analysis Lab
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as StabilityService from '../../services/StabilityService';
import styles from './modules.module.css';

export function Module6Stability() {
  const {
    stateSpaceMatrices,
    advanceToNextModule,
    setPipelineData,
  } = useContext(SimulationContext);

  const [analysis, setAnalysis] = useState(null);
  const [predictionSteps, setPredictionSteps] = useState(50);
  const [prediction, setPrediction] = useState(null);

  // Analyze stability
  useEffect(() => {
    if (!stateSpaceMatrices.A) return;

    try {
      const eigs = StabilityService.computeEigenvalues2x2(stateSpaceMatrices.A);
      const stab = StabilityService.analyzeStability(eigs);
      const interpretation = StabilityService.getStabilityInterpretation(eigs, stab);

      setAnalysis({
        eigenvalues: eigs,
        stability: stab,
        interpretation,
      });
    } catch (error) {
      console.error('Stability analysis error:', error);
    }
  }, [stateSpaceMatrices, setPipelineData]);

  // Run autonomous prediction
  const runAutonomousPrediction = useCallback(() => {
    if (!stateSpaceMatrices.A) return;

    try {
      const x0 = [0.5, 0]; // Start with modest initial state
      const trajectory = StabilityService.simulateTrajectory(
        stateSpaceMatrices.A,
        x0,
        predictionSteps
      );

      setPrediction({
        trajectory,
        steps: predictionSteps,
      });

      // Update pipeline
      setPipelineData(prev => ({
        ...prev,
        module6: {
          stabilityAnalysis: analysis,
          prediction: { trajectory, steps: predictionSteps },
        },
      }));
    } catch (error) {
      console.error('Prediction error:', error);
    }
  }, [stateSpaceMatrices, predictionSteps, analysis, setPipelineData]);

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>Dynamic Stability & Autonomous Prediction</h3>

        {analysis && (
          <div className={styles.stabilityBox}>
            <h4>Eigenvalue Analysis</h4>
            <pre>{analysis.interpretation}</pre>

            {analysis.eigenvalues.isComplex ? (
              <div className={styles.infoBox}>
                <p>Complex Eigenvalues (Oscillatory Behavior):</p>
                <ul>
                  <li>Real Part: {analysis.eigenvalues.lambda1.real.toFixed(4)}</li>
                  <li>Imaginary Part: ±{analysis.eigenvalues.lambda1.imag.toFixed(4)}</li>
                  <li>Magnitude: {analysis.eigenvalues.magnitude1.toFixed(4)}</li>
                </ul>
              </div>
            ) : (
              <div className={styles.infoBox}>
                <p>Real Eigenvalues (Non-Oscillatory Behavior):</p>
                <ul>
                  <li>λ₁: {analysis.eigenvalues.lambda1.toFixed(4)}</li>
                  <li>λ₂: {analysis.eigenvalues.lambda2.toFixed(4)}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className={styles.controlsBox}>
          <label>
            Prediction Horizon (steps):
            <input
              type="number"
              min="10"
              max="200"
              step="10"
              value={predictionSteps}
              onChange={(e) => setPredictionSteps(parseInt(e.target.value))}
            />
          </label>
          <button onClick={runAutonomousPrediction} className={styles.btn}>
            Run Autonomous Prediction
          </button>
        </div>

        {prediction && (
          <div className={styles.infoBox}>
            <h4>Autonomous Prediction Results</h4>
            <p>
              Without measurements, the system evolves purely based on matrix A:
              <code>x_k = Aᵏ x₀</code>
            </p>
            <ul>
              <li>Initial State: [0.500, 0.000]</li>
              <li>Steps: {prediction.steps}</li>
              <li>Final State: [{prediction.trajectory[prediction.trajectory.length - 1][0].toFixed(4)}, 
                  {prediction.trajectory[prediction.trajectory.length - 1][1].toFixed(4)}]</li>
              {analysis?.stability?.stable && (
                <li>✓ Converges toward origin (stable equilibrium)</li>
              )}
              {analysis?.stability?.unstable && (
                <li>✗ Diverges from origin (unstable)</li>
              )}
            </ul>
          </div>
        )}

        <div className={styles.educationalBox}>
          <h4>📚 Stability in Discrete Systems</h4>
          <p>
            <strong>For discrete-time systems:</strong> A system is stable if all eigenvalues 
            have magnitude less than 1: |λᵢ| &lt; 1
          </p>
          <ul>
            <li>If |λ| &lt; 1: State converges exponentially to zero (stable)</li>
            <li>If |λ| = 1: State remains bounded (marginal)</li>
            <li>If |λ| &gt; 1: State grows exponentially (unstable)</li>
          </ul>
          <p>
            <strong>Autonomous Prediction Concern:</strong> In unforced mode, without measurements 
            to correct it, an unstable system will diverge. This is why Kalman gains must be 
            tuned to maintain observability and convergence.
          </p>
        </div>
      </section>

      <section className={styles.navigationSection}>
        <button className={styles.nextBtn} onClick={advanceToNextModule}>
          Next: AI-Assisted Interpretation →
        </button>
      </section>
    </div>
  );
}

export default Module6Stability;
