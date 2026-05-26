/**
 * Module4KalmanEngine.jsx
 * Interactive Kalman Filter Immersion with step-by-step execution
 */

import { useContext, useState, useEffect, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as KalmanService from '../../services/KalmanService';
import styles from './modules.module.css';

export function Module4KalmanEngine() {
  const {
    pipelineData,
    rawSamples,
    noisyEcg,
    stateSpaceMatrices,
    initialConditions,
    noiselessMode,
    setNoiselessMode,
    kalmanFilterState,
    setKalmanFilterState,
    filterStep,
    setFilterStep,
    isFiltering,
    setIsFiltering,
    advanceToNextModule,
    setPipelineData,
  } = useContext(SimulationContext);

  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(50);

  // Run Kalman filter
  const runKalmanFilter = useCallback(() => {
    if (noisyEcg.length === 0 || !stateSpaceMatrices.A) return;

    try {
      const P0 = StateSpaceMatrixToP0(stateSpaceMatrices.A.length, initialConditions.P0_diag || 1);
      const x0hat = [initialConditions.x0hat || 0, 0];

      const results = KalmanService.kalmanFilter(
        noisyEcg,
        stateSpaceMatrices.A,
        stateSpaceMatrices.H,
        stateSpaceMatrices.Q,
        stateSpaceMatrices.R,
        x0hat,
        P0,
        {
          noiselessMode,
          includeTraces: true,
        }
      );

      setKalmanFilterState(results);
      setFilterStep(0);

      // Update pipeline
      setPipelineData(prev => ({
        ...prev,
        module4: {
          kalmanResults: results,
          noiselessMode,
        },
      }));
    } catch (error) {
      console.error('Kalman filter error:', error);
    }
  }, [noisyEcg, stateSpaceMatrices, initialConditions, noiselessMode, setKalmanFilterState, setPipelineData]);

  useEffect(() => {
    runKalmanFilter();
  }, [runKalmanFilter]);

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || !isFiltering || filterStep >= kalmanFilterState.xFiltered.length) {
      return;
    }

    const delay = 2000 - speed * 30; // 50-2000 ms
    const timer = setTimeout(() => {
      setFilterStep(prev => Math.min(prev + 1, kalmanFilterState.xFiltered.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [autoPlay, isFiltering, filterStep, kalmanFilterState.xFiltered.length, speed]);

  const handlePlayPause = () => {
    setIsFiltering(!isFiltering);
  };

  const handleReset = () => {
    setFilterStep(0);
    setIsFiltering(false);
  };

  const handleNextStep = () => {
    if (filterStep < kalmanFilterState.xFiltered.length) {
      setFilterStep(filterStep + 1);
    }
  };

  if (noisyEcg.length === 0) {
    return (
      <div className={styles.moduleContainer}>
        <p className={styles.warning}>⚠️ Please complete Modules 1-3 first.</p>
      </div>
    );
  }

  const currentStep = Math.min(filterStep, kalmanFilterState.xFiltered.length - 1);
  const stepData = currentStep >= 0 ? {
    measurement: noisyEcg[currentStep],
    predicted: kalmanFilterState.xPredicted[currentStep]?.[0] || 0,
    filtered: kalmanFilterState.xFiltered[currentStep]?.[0] || 0,
    innovation: kalmanFilterState.innovations[currentStep] || 0,
    kalmanGain: kalmanFilterState.K_trace[currentStep] || 0,
    covariance: kalmanFilterState.P_trace[currentStep] || 0,
  } : null;

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>Kalman Filter Immersion Engine</h3>

        <div className={styles.toggleGroup}>
          <label>
            <input
              type="checkbox"
              checked={noiselessMode}
              onChange={(e) => setNoiselessMode(e.target.checked)}
            />
            🔇 <strong>NOISELESS MODE</strong> (Q = 0)
          </label>
          <p className={styles.hint}>
            Topic 2B: See how the filter behaves with ideal noiseless assumptions
          </p>
        </div>

        <div className={styles.controls}>
          <button onClick={handlePlayPause} className={styles.btn}>
            {isFiltering ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={handleNextStep} className={styles.btn} disabled={filterStep >= kalmanFilterState.xFiltered.length}>
            ⏭ Next Step
          </button>
          <button onClick={handleReset} className={styles.btn}>
            ↺ Reset
          </button>

          <label>
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
            />
            Auto-play
          </label>

          {autoPlay && (
            <div className={styles.speedControl}>
              <label>Speed:</label>
              <input
                type="range"
                min="1"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
              />
              <span>{speed}%</span>
            </div>
          )}
        </div>

        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${(filterStep / Math.max(1, kalmanFilterState.xFiltered.length)) * 100}%` }}
          />
        </div>
        <p>Step {filterStep + 1} / {kalmanFilterState.xFiltered.length}</p>

        {stepData && (
          <div className={styles.stepDataBox}>
            <h4>Step {filterStep} Analysis</h4>
            <table className={styles.infoTable}>
              <tbody>
                <tr>
                  <td>Measurement (z_k):</td>
                  <td>{stepData.measurement.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>Prediction (x̂⁻):</td>
                  <td>{stepData.predicted.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>Filtered (x̂):</td>
                  <td>{stepData.filtered.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>Innovation (y):</td>
                  <td>{stepData.innovation.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>Kalman Gain (K):</td>
                  <td>{stepData.kalmanGain.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>Covariance (P):</td>
                  <td>{stepData.covariance.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.educationalBox}>
          <h4>📚 Kalman Filter Equations</h4>
          <p><strong>Prediction Step:</strong></p>
          <pre>x̂⁻ = A x̂<br/>P⁻ = A P Aᵀ + Q</pre>
          
          <p><strong>Update Step:</strong></p>
          <pre>K = P⁻ Hᵀ (H P⁻ Hᵀ + R)⁻¹<br/>x̂ = x̂⁻ + K (z - H x̂⁻)<br/>P = (I - K H) P⁻</pre>

          <p>
            The Kalman gain K balances the prediction uncertainty (P⁻) against measurement noise (R). 
            Low K means we trust the model; high K means we trust the measurement.
          </p>
        </div>
      </section>

      <section className={styles.navigationSection}>
        <button className={styles.nextBtn} onClick={advanceToNextModule}>
          Next: Initial Condition Dynamics →
        </button>
      </section>
    </div>
  );
}

// Helper to convert P0_diag to matrix
function StateSpaceMatrixToP0(n, diag) {
  const P0 = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = diag;
    P0.push(row);
  }
  return P0;
}

export default Module4KalmanEngine;
