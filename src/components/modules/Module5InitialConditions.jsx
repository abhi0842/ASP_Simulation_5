/**
 * Module5InitialConditions.jsx
 * Initial Condition Dynamics Lab - HIGHEST PRIORITY FOR TOPIC 2B
 */

import { useContext, useState, useEffect, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as KalmanService from '../../services/KalmanService';
import * as MetricsService from '../../services/MetricsService';
import * as EducationalExplanationService from '../../services/EducationalExplanationService';
import styles from './modules.module.css';

export function Module5InitialConditions() {
  const {
    noisyEcg,
    stateSpaceMatrices,
    initialConditions,
    setInitialConditions,
    comparisonRun,
    setComparisonRun,
    convergenceAnalysis,
    setConvergenceAnalysis,
    advanceToNextModule,
    setPipelineData,
    noiselessMode,
  } = useContext(SimulationContext);

  const [presets] = useState([
    { id: 'good', label: 'Good Initialization', x0hat: 0, P0_diag: 0.5 },
    { id: 'poor', label: 'Poor Initialization', x0hat: 2.0, P0_diag: 10.0 },
    { id: 'zero', label: 'Zero Initialization', x0hat: 0, P0_diag: 1.0 },
    { id: 'overconfident', label: 'Overconfident (P₀ too small)', x0hat: 1.0, P0_diag: 0.001 },
  ]);

  const [selectedPreset, setSelectedPreset] = useState('good');
  const [comparisonInitCondition, setComparisonInitCondition] = useState('poor');
  const [filterRun, setFilterRun] = useState(null);
  const [explanation, setExplanation] = useState('');

  // Load preset
  const loadPreset = useCallback((presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setInitialConditions({
        x0hat: preset.x0hat,
        P0_diag: preset.P0_diag,
      });
      setSelectedPreset(presetId);
    }
  }, [presets, setInitialConditions]);

  // Run filter with current initial conditions
  const runFilterWithConditions = useCallback(() => {
    if (noisyEcg.length === 0 || !stateSpaceMatrices.A) return;

    try {
      const P0 = createDiagonalMatrix(stateSpaceMatrices.A.length, initialConditions.P0_diag);
      const x0hat = [initialConditions.x0hat, 0];

      const results = KalmanService.kalmanFilter(
        noisyEcg,
        stateSpaceMatrices.A,
        stateSpaceMatrices.H,
        stateSpaceMatrices.Q,
        stateSpaceMatrices.R,
        x0hat,
        P0,
        { noiselessMode, includeTraces: true }
      );

      setFilterRun(results);

      // Generate explanation
      const explanation = EducationalExplanationService.explainInitialConditionEffects(
        initialConditions.x0hat,
        initialConditions.P0_diag
      );
      setExplanation(explanation);

      // Analyze convergence
      if (results.innovations) {
        const convergence = MetricsService.analyzeConvergence(results.innovations);
        setConvergenceAnalysis(convergence);
      }
    } catch (error) {
      console.error('Filter error:', error);
    }
  }, [noisyEcg, stateSpaceMatrices, initialConditions, noiselessMode, setConvergenceAnalysis]);

  // Run comparison
  const runComparison = useCallback(() => {
    if (!filterRun) return;

    try {
      const preset = presets.find(p => p.id === comparisonInitCondition);
      if (!preset) return;

      const P0 = createDiagonalMatrix(stateSpaceMatrices.A.length, preset.P0_diag);
      const x0hat = [preset.x0hat, 0];

      const compResults = KalmanService.kalmanFilter(
        noisyEcg,
        stateSpaceMatrices.A,
        stateSpaceMatrices.H,
        stateSpaceMatrices.Q,
        stateSpaceMatrices.R,
        x0hat,
        P0,
        { noiselessMode, includeTraces: true }
      );

      const comparison = MetricsService.compareInitialConditions(filterRun, compResults);
      setComparisonRun({ results: compResults, comparison, preset });

      // Update pipeline
      setPipelineData(prev => ({
        ...prev,
        module5: {
          initialConditions,
          comparisonRun: { filterRun, compResults, comparison },
          convergenceAnalysis,
        },
      }));
    } catch (error) {
      console.error('Comparison error:', error);
    }
  }, [filterRun, presets, comparisonInitCondition, noisyEcg, stateSpaceMatrices, noiselessMode, setComparisonRun, initialConditions, convergenceAnalysis, setPipelineData]);

  // Run filter when conditions change
  useEffect(() => {
    runFilterWithConditions();
  }, [runFilterWithConditions]);

  if (noisyEcg.length === 0) {
    return (
      <div className={styles.moduleContainer}>
        <p className={styles.warning}>⚠️ Please complete Modules 1-4 first.</p>
      </div>
    );
  }

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>⭐ Initial Condition Dynamics Lab - TOPIC 2B FOCUS</h3>

        <div className={styles.formGroup}>
          <label><strong>Quick Presets for x̂₀ and P₀:</strong></label>
          <select value={selectedPreset} onChange={(e) => loadPreset(e.target.value)}>
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.sliderGroup}>
          <label>
            <strong>Initial State Estimate (x̂₀):</strong> {initialConditions.x0hat.toFixed(3)}
          </label>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.1"
            value={initialConditions.x0hat}
            onChange={(e) => setInitialConditions(prev => ({
              ...prev,
              x0hat: parseFloat(e.target.value),
            }))}
          />
        </div>

        <div className={styles.sliderGroup}>
          <label>
            <strong>Initial Covariance (P₀):</strong> {initialConditions.P0_diag.toFixed(3)}
          </label>
          <input
            type="range"
            min="0.001"
            max="10"
            step="0.1"
            value={initialConditions.P0_diag}
            onChange={(e) => setInitialConditions(prev => ({
              ...prev,
              P0_diag: parseFloat(e.target.value),
            }))}
          />
        </div>

        {explanation && (
          <div className={styles.educationalBox}>
            <h4>📚 Initial Condition Interpretation</h4>
            <pre>{explanation}</pre>
          </div>
        )}

        {convergenceAnalysis && (
          <div className={styles.infoBox}>
            <h4>Convergence Analysis</h4>
            <table className={styles.infoTable}>
              <tbody>
                <tr>
                  <td>Converged:</td>
                  <td>{convergenceAnalysis.converged ? '✓ Yes' : '✗ No'}</td>
                </tr>
                <tr>
                  <td>Convergence Step:</td>
                  <td>{convergenceAnalysis.convergenceStep}</td>
                </tr>
                <tr>
                  <td>Settling Time:</td>
                  <td>{convergenceAnalysis.settleTime} steps</td>
                </tr>
                <tr>
                  <td>Overshoot:</td>
                  <td>{convergenceAnalysis.overshoot}%</td>
                </tr>
                <tr>
                  <td>Steady-State Error:</td>
                  <td>{convergenceAnalysis.steadyStateError.toFixed(6)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.comparisonSection}>
          <h4>🔄 Compare Two Initial Conditions</h4>

          <div className={styles.formGroup}>
            <label>Compare Current vs.:</label>
            <select value={comparisonInitCondition} onChange={(e) => setComparisonInitCondition(e.target.value)}>
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <button onClick={runComparison} className={styles.btn}>
            Run Comparison
          </button>

          {comparisonRun && (
            <div className={styles.infoBox}>
              <h4>Comparison Results</h4>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td>Max State Difference:</td>
                    <td>{comparisonRun.comparison.maxStateDifference.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <td>Avg State Difference:</td>
                    <td>{comparisonRun.comparison.avgStateDifference.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <td>Convergence Steps:</td>
                    <td>{comparisonRun.comparison.convergenceSteps}</td>
                  </tr>
                  <tr>
                    <td>Percent Divergence:</td>
                    <td>{comparisonRun.comparison.percentDivergence}%</td>
                  </tr>
                </tbody>
              </table>
              <p className={styles.insight}>
                <strong>Insight:</strong> The two filters {comparisonRun.comparison.convergenceSteps < 50 
                  ? 'quickly converge' 
                  : 'take a long time to converge'} to similar estimates, 
                demonstrating the <strong>convergence</strong> property of the Kalman filter.
              </p>
            </div>
          )}
        </div>

        <div className={styles.educationalBox}>
          <h4>🎯 TOPIC 2B Key Concepts</h4>
          <ul>
            <li>
              <strong>x̂₀ (Initial State Estimate):</strong> 
              Your prior belief about the system state. Wrong initial state introduces bias 
              that gradually corrects through measurements.
            </li>
            <li>
              <strong>P₀ (Initial Covariance):</strong> 
              Your confidence in the initial estimate. Small P₀ means you're very confident 
              (risky!); large P₀ means very uncertain (flexible).
            </li>
            <li>
              <strong>Transient Response:</strong> 
              The filter's behavior before steady-state. Heavily influenced by initialization.
            </li>
            <li>
              <strong>Autonomous Evolution:</strong> 
              With unforced dynamics, the predicted state evolves according to matrix A alone. 
              Poor initialization affects predictions before measurements arrive.
            </li>
            <li>
              <strong>Covariance Propagation:</strong> 
              P₀ propagates forward: P⁻ = A P Aᵀ + Q. Initial uncertainty shapes the entire trajectory.
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.navigationSection}>
        <button className={styles.nextBtn} onClick={advanceToNextModule}>
          Next: Stability Analysis →
        </button>
      </section>
    </div>
  );
}

// Helper function
function createDiagonalMatrix(n, diag) {
  const P = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = diag;
    P.push(row);
  }
  return P;
}

export default Module5InitialConditions;
