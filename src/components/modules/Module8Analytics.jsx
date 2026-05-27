/**
 * Module8Analytics.jsx
 * Performance Analytics & Scientific Reporting
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as MetricsService from '../../services/MetricsService';
import styles from './modules.module.css';

export function Module8Analytics() {
  const {
    ecgValues,
    cleanSignal,
    noisyEcg,
    kalmanFilterState,
    convergenceAnalysis,
    setPerformanceMetrics,
    setScientificReport,
    resetPipeline,
  } = useContext(SimulationContext);

  const [metrics, setMetrics] = useState({});
  const [report, setReport] = useState('');

  // Calculate all metrics
  useEffect(() => {
    const reference = cleanSignal.length ? cleanSignal : ecgValues;
    if (reference.length === 0 || noisyEcg.length === 0 || !kalmanFilterState?.xFiltered) {
      return;
    }

    try {
      const filtered = kalmanFilterState.xFiltered.map(x => x[0]);

      const perf = MetricsService.evaluateFilterPerformance(reference, noisyEcg, filtered);
      
      const allMetrics = {
        ...perf,
        convergenceStep: convergenceAnalysis?.convergenceStep || 0,
        innovationWhiteness: kalmanFilterState.innovations ? 
          MetricsService.testInnovationWhiteness(kalmanFilterState.innovations) : null,
      };

      setMetrics(allMetrics);
      setPerformanceMetrics(allMetrics);

      // Generate report
      const reportText = generateScientificReport(allMetrics, convergenceAnalysis);
      setReport(reportText);
      setScientificReport(reportText);
    } catch (error) {
      console.error('Metrics calculation error:', error);
    }
  }, [ecgValues, cleanSignal, noisyEcg, kalmanFilterState, convergenceAnalysis, setPerformanceMetrics, setScientificReport]);

  const exportReport = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', 'kalman_filter_report.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      convergenceAnalysis,
      report,
    };
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
    element.setAttribute('download', 'kalman_filter_data.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (ecgValues.length === 0) {
    return (
      <div className={styles.moduleContainer}>
        <p className={styles.warning}>⚠️ Please complete all modules 1-7 first.</p>
      </div>
    );
  }

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>📋 Performance Analytics & Scientific Report</h3>

        {Object.keys(metrics).length > 0 && (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <h4>RMSE (Filtered)</h4>
                <p className={styles.metricValue}>{metrics.rmseFiltered?.toFixed(4)}</p>
              </div>
              <div className={styles.metricCard}>
                <h4>MAE (Filtered)</h4>
                <p className={styles.metricValue}>{metrics.maeFiltered?.toFixed(4)}</p>
              </div>
              <div className={styles.metricCard}>
                <h4>SNR Improvement</h4>
                <p className={styles.metricValue}>{metrics.snrImprovement?.toFixed(2)} dB</p>
              </div>
              <div className={styles.metricCard}>
                <h4>RMSE Improvement</h4>
                <p className={styles.metricValue}>{metrics.rmseImprovement?.toFixed(1)}%</p>
              </div>
            </div>

            <div className={styles.comparisonTable}>
              <h4>Before & After Comparison</h4>
              <table className={styles.infoTable}>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Original (Noisy)</th>
                    <th>Filtered</th>
                    <th>Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>RMSE</td>
                    <td>{metrics.rmseNoisy?.toFixed(4)}</td>
                    <td>{metrics.rmseFiltered?.toFixed(4)}</td>
                    <td>{(metrics.rmseNoisy - metrics.rmseFiltered).toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>MAE</td>
                    <td>{metrics.maeNoisy?.toFixed(4)}</td>
                    <td>{metrics.maeFiltered?.toFixed(4)}</td>
                    <td>{(metrics.maeNoisy - metrics.maeFiltered).toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Peak Error</td>
                    <td>{metrics.paeNoisy?.toFixed(4)}</td>
                    <td>{metrics.paeFiltered?.toFixed(4)}</td>
                    <td>{(metrics.paeNoisy - metrics.paeFiltered).toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {convergenceAnalysis && (
              <div className={styles.infoBox}>
                <h4>Convergence Metrics</h4>
                <table className={styles.infoTable}>
                  <tbody>
                    <tr>
                      <td>Convergence Time:</td>
                      <td>{convergenceAnalysis.convergenceStep} steps</td>
                    </tr>
                    <tr>
                      <td>Settling Time (5% threshold):</td>
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
          </>
        )}

        {report && (
          <div className={styles.reportBox}>
            <h4>📄 Scientific Experiment Summary</h4>
            <pre>{report}</pre>
          </div>
        )}

        <div className={styles.controls}>
          <button onClick={exportReport} className={styles.btn}>
            📥 Export Report (Text)
          </button>
          <button onClick={exportJSON} className={styles.btn}>
            📥 Export Data (JSON)
          </button>
        </div>

        <div className={styles.educationalBox}>
          <h4>🎓 Learning Outcome Summary</h4>
          <ul>
            <li>
              <strong>Module 1:</strong> Understood ECG as physiological dynamic system
            </li>
            <li>
              <strong>Module 2:</strong> Explored biomedical noise sources and corruption mechanisms
            </li>
            <li>
              <strong>Module 3:</strong> Discovered state-space modeling and unforced dynamics
            </li>
            <li>
              <strong>Module 4:</strong> Implemented step-by-step Kalman filtering algorithm
            </li>
            <li>
              <strong>Module 5:</strong> Analyzed critical role of initial conditions (x̂₀, P₀) in convergence
            </li>
            <li>
              <strong>Module 6:</strong> Evaluated system stability and autonomous prediction
            </li>
            <li>
              <strong>Module 7:</strong> Interpreted results and tuned parameters adaptively
            </li>
            <li>
              <strong>Module 8:</strong> Generated scientific report and quantified performance
            </li>
          </ul>

          <p>
            <strong>Topic 2B Mastery:</strong> You have successfully demonstrated deep understanding of 
            Kalman filtering with unforced dynamic models and noiseless state-space systems. 
            You can now analyze how initial conditions, covariance evolution, and autonomous 
            system behavior affect prediction accuracy and convergence.
          </p>
        </div>

        <div className={styles.navigationSection}>
          <button onClick={resetPipeline} className={styles.resetBtn}>
            🔄 Start New Experiment
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Generate scientific experiment report
 */
function generateScientificReport(metrics, convergence) {
  let report = `
KALMAN FILTER PERFORMANCE REPORT
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
================
This report evaluates the performance of a Kalman filter applied to ECG signal 
denoising using an unforced autonomous state-space model with noiseless assumptions.

KEY FINDINGS
============
• RMSE Reduction: ${(metrics.rmseNoisy - metrics.rmseFiltered).toFixed(4)} 
  (from ${metrics.rmseNoisy?.toFixed(4)} to ${metrics.rmseFiltered?.toFixed(4)})

• Relative Improvement: ${metrics.rmseImprovement?.toFixed(1)}%

• SNR Improvement: ${metrics.snrImprovement?.toFixed(2)} dB

• Convergence Time: ${convergence?.convergenceStep || 'N/A'} samples

FILTER PERFORMANCE ANALYSIS
===========================
The Kalman filter achieved significant noise reduction while maintaining signal fidelity.

Original Signal (with noise):
  - RMSE: ${metrics.rmseNoisy?.toFixed(4)}
  - MAE:  ${metrics.maeNoisy?.toFixed(4)}
  - Peak Error: ${metrics.paeNoisy?.toFixed(4)}

Filtered Signal:
  - RMSE: ${metrics.rmseFiltered?.toFixed(4)}
  - MAE:  ${metrics.maeFiltered?.toFixed(4)}
  - Peak Error: ${metrics.paeFiltered?.toFixed(4)}

${convergence ? `
CONVERGENCE BEHAVIOR
====================
The filter exhibited well-behaved transient response:
  - Convergence Step: ${convergence.convergenceStep}
  - Settling Time (5%): ${convergence.settleTime} steps
  - Overshoot: ${convergence.overshoot}%
  - Steady-State Error: ${convergence.steadyStateError.toFixed(6)}
` : ''}

CONCLUSIONS
===========
The Kalman filter successfully denoised the ECG signal by exploiting the 
unforced autonomous dynamics (x_{k+1} = A x_k) and near-noiseless state-space 
assumptions (Q ≈ 0).

Initial conditions (x̂₀, P₀) and covariance propagation played a critical role 
in shaping filter convergence and estimation accuracy.

RECOMMENDATIONS FOR FURTHER STUDY
==================================
1. Explore sensitivity to initial condition variations
2. Investigate impact of system matrix eigenvalues on prediction horizon
3. Compare with adaptive Kalman filtering for non-stationary signals
4. Extend to higher-dimensional state representations
5. Validate on diverse ECG datasets and noise scenarios

====================================================
End of Report
`;
  return report;
}

export default Module8Analytics;
