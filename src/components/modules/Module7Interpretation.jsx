/**
 * Module7Interpretation.jsx
 * AI-Assisted Educational Interpretation (lightweight, no external LLM)
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as EducationalExplanationService from '../../services/EducationalExplanationService';
import * as MetricsService from '../../services/MetricsService';
import styles from './modules.module.css';

export function Module7Interpretation() {
  const {
    kalmanFilterState,
    stateSpaceMatrices,
    initialConditions,
    convergenceAnalysis,
    advanceToNextModule,
    setEducationalInterpretation,
  } = useContext(SimulationContext);

  const [suggestions, setSuggestions] = useState([]);
  const [explanations, setExplanations] = useState({});
  const [selectedExplanation, setSelectedExplanation] = useState(null);

  // Generate insights
  useEffect(() => {
    if (!kalmanFilterState || kalmanFilterState.xFiltered.length === 0) return;

    try {
      // Calculate metrics
      const metrics = {
        innovationEnergy: MetricsService.calculateInnovationEnergy(kalmanFilterState.innovations),
        snrImprovement: 0, // Would need clean signal for this
        convergenceStep: convergenceAnalysis?.convergenceStep || 0,
      };

      const eigs = stateSpaceMatrices.A ? 
        (() => {
          const e = { magnitude1: 0.99, magnitude2: 0.9 }; // Safe default
          return e;
        })() : null;

      // Generate suggestions
      const sugg = EducationalExplanationService.suggestParameterAdjustments(
        metrics,
        eigs || { magnitude1: 0.99, magnitude2: 0.9 },
        kalmanFilterState.innovations
      );

      setSuggestions(sugg);

      // Generate explanations
      const exp = {
        convergence: EducationalExplanationService.explainConvergence(
          convergenceAnalysis,
          eigs || { magnitude1: 0.99, magnitude2: 0.9 }
        ),
        objectives: EducationalExplanationService.getLearningObjectives('module7'),
      };

      setExplanations(exp);

      setEducationalInterpretation({
        suggestions: sugg,
        explanations: exp,
      });
    } catch (error) {
      console.error('Interpretation error:', error);
    }
  }, [kalmanFilterState, convergenceAnalysis, stateSpaceMatrices, setEducationalInterpretation]);

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>🤖 AI-Assisted Educational Interpretation</h3>

        {suggestions.length > 0 && (
          <div className={styles.suggestionsBox}>
            <h4>💡 Parameter Tuning Suggestions</h4>
            {suggestions.map((sugg, idx) => (
              <div key={idx} className={styles.suggestionCard}>
                <h5>{sugg.parameter}</h5>
                <p><strong>Action:</strong> {sugg.action}</p>
                <p><strong>Reason:</strong> {sugg.reason}</p>
                <code>{sugg.code}</code>
              </div>
            ))}
          </div>
        )}

        <div className={styles.explanationControls}>
          <label>Select Explanation Topic:</label>
          <select value={selectedExplanation} onChange={(e) => setSelectedExplanation(e.target.value)}>
            <option value="">-- Choose a topic --</option>
            <option value="convergence">Convergence Behavior</option>
            <option value="kalman_gain">Kalman Gain Interpretation</option>
            <option value="innovation">Innovation Signal</option>
            <option value="initial_conditions">Initial Conditions</option>
            <option value="stability">System Stability</option>
          </select>
        </div>

        {selectedExplanation === 'convergence' && explanations.convergence && (
          <div className={styles.educationalBox}>
            <pre>{explanations.convergence}</pre>
          </div>
        )}

        {selectedExplanation === 'kalman_gain' && kalmanFilterState?.K_trace && (
          <div className={styles.educationalBox}>
            <h4>Kalman Gain Evolution</h4>
            <p>
              The Kalman gain K starts high (trusting measurements) and typically decreases 
              as covariance shrinks (trusting the model more).
            </p>
            <ul>
              <li>Initial Gain: {kalmanFilterState.K_trace[0]?.toFixed(4)}</li>
              <li>Final Gain: {kalmanFilterState.K_trace[kalmanFilterState.K_trace.length - 1]?.toFixed(4)}</li>
              <li>Trend: {kalmanFilterState.K_trace[0] > kalmanFilterState.K_trace[kalmanFilterState.K_trace.length - 1] ? '↓ Decreasing (converging)' : '↑ Increasing (diverging)'}</li>
            </ul>
          </div>
        )}

        {selectedExplanation === 'innovation' && kalmanFilterState?.innovations && (
          <div className={styles.educationalBox}>
            <h4>Innovation Sequence Analysis</h4>
            <p>
              Innovations (measurement surprises) should have small magnitude and 
              be white noise (uncorrelated).
            </p>
            <ul>
              <li>Mean Innovation: {(kalmanFilterState.innovations.reduce((a, b) => a + b, 0) / kalmanFilterState.innovations.length).toFixed(4)}</li>
              <li>Max Innovation: {Math.max(...kalmanFilterState.innovations.map(Math.abs)).toFixed(4)}</li>
              <li>Std Dev: {Math.sqrt(kalmanFilterState.innovations.reduce((a, v, i, arr) => {
                const mean = arr.reduce((x, y) => x + y) / arr.length;
                return a + (v - mean) ** 2;
              }, 0) / kalmanFilterState.innovations.length).toFixed(4)}</li>
            </ul>
          </div>
        )}

        {selectedExplanation === 'initial_conditions' && (
          <div className={styles.educationalBox}>
            <h4>Initial Conditions Impact</h4>
            <pre>
              {EducationalExplanationService.explainInitialConditionEffects(
                initialConditions.x0hat,
                initialConditions.P0_diag
              )}
            </pre>
          </div>
        )}

        {selectedExplanation === 'stability' && (
          <div className={styles.educationalBox}>
            <h4>Stability Assessment</h4>
            <p>
              Your system's eigenvalues determine whether predictions remain stable 
              over long horizons.
            </p>
            <p>
              Review Module 6 for detailed stability analysis.
            </p>
          </div>
        )}

        <div className={styles.educationalBox}>
          <h4>📚 Learning Objectives - Module 7</h4>
          <ul>
            {explanations.objectives?.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
          <p>
            This module consolidates the concepts from all previous modules. The goal is to 
            understand how all pieces (ECG, noise, state-space, Kalman filter, initial conditions, 
            and stability) work together to create an effective state estimator.
          </p>
        </div>
      </section>

      <section className={styles.navigationSection}>
        <button className={styles.nextBtn} onClick={advanceToNextModule}>
          Next: Performance Report →
        </button>
      </section>
    </div>
  );
}

export default Module7Interpretation;
