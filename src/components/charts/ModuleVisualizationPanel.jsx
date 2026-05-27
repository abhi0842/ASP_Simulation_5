/**
 * ModuleVisualizationPanel — synchronized plots driven by pipeline state
 */

import { useContext, useMemo } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import { ScientificChart } from './ScientificChart';
import * as ECGService from '../../services/ECGService';
import styles from './moduleViz.module.css';

const COLORS = {
  clean: '#0078d4',
  noisy: '#e67e22',
  filtered: '#27ae60',
  predicted: '#9b59b6',
  innovation: '#c0392b',
  gain: '#16a085',
  covariance: '#8e44ad',
  error: '#e74c3c',
};

function sliceSignals(values, time, maxPts = 2500) {
  if (!values?.length) return { values: [], time: [] };
  return ECGService.downsampleForDisplay(values, time, maxPts);
}

export function ModuleVisualizationPanel() {
  const {
    currentModule,
    ecgValues,
    ecgTime,
    cleanSignal,
    noisyEcg,
    kalmanFilterState,
    snrMetrics,
    initialConditions,
    filterStep,
    systemAnalysis,
  } = useContext(SimulationContext);

  const { values: ecgDisp, time: tDisp } = useMemo(
    () => sliceSignals(ecgValues, ecgTime),
    [ecgValues, ecgTime]
  );

  const filtered = useMemo(
    () => kalmanFilterState?.xFiltered?.map((x) => x[0]) ?? [],
    [kalmanFilterState]
  );

  const predicted = useMemo(
    () => kalmanFilterState?.xPredicted?.map((x) => x[0]) ?? [],
    [kalmanFilterState]
  );

  const stepIdx = Math.min(filterStep, filtered.length - 1);

  if (!ecgValues.length) {
    return (
      <div className={styles.panel}>
        <p className={styles.placeholder}>
          Load an ECG dataset in Module 1 to begin the experiment pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Live Experiment Visualizations</h3>

      {(currentModule === 1 || currentModule >= 2) && (
        <ScientificChart
          title="ECG Waveform (ground truth reference)"
          datasets={[
            {
              label: 'ECG (raw)',
              data: ecgDisp,
              time: tDisp,
              borderColor: COLORS.clean,
            },
            cleanSignal.length > 0 && {
              label: 'Reference (filtered CSV)',
              data: sliceSignals(cleanSignal, ecgTime).values,
              time: sliceSignals(cleanSignal, ecgTime).time,
              borderColor: '#95a5a6',
              borderDash: [4, 4],
            },
          ].filter(Boolean)}
          annotation="Physiological dynamics evolve autonomously — the foundation for unforced state-space modeling."
        />
      )}

      {currentModule >= 2 && noisyEcg.length > 0 && (
        <>
          <ScientificChart
            title="Original vs Noisy ECG"
            datasets={[
              { label: 'Original', data: ecgDisp, time: tDisp, borderColor: COLORS.clean },
              {
                label: 'Noisy',
                data: sliceSignals(noisyEcg, ecgTime).values,
                time: sliceSignals(noisyEcg, ecgTime).time,
                borderColor: COLORS.noisy,
              },
            ]}
            annotation={`SNR (noisy): ${snrMetrics.after?.toFixed?.(1) ?? '—'} dB`}
          />
          <ScientificChart
            title="Measurement Error (noise residual)"
            datasets={[
              {
                label: 'z − x_true',
                data: ecgValues.map((v, i) => (noisyEcg[i] ?? v) - v).slice(0, ecgDisp.length),
                time: tDisp,
                borderColor: COLORS.error,
              },
            ]}
            yLabel="Error"
          />
        </>
      )}

      {currentModule >= 4 && filtered.length > 0 && (
        <>
          <ScientificChart
            title="Kalman Filter: Measurement → Prediction → Correction"
            datasets={[
              {
                label: 'Noisy z_k',
                data: sliceSignals(noisyEcg, ecgTime).values,
                time: sliceSignals(noisyEcg, ecgTime).time,
                borderColor: COLORS.noisy,
              },
              {
                label: 'Predicted x̂⁻',
                data: sliceSignals(predicted, ecgTime).values,
                time: sliceSignals(predicted, ecgTime).time,
                borderColor: COLORS.predicted,
                borderDash: [6, 3],
              },
              {
                label: 'Filtered x̂',
                data: sliceSignals(filtered, ecgTime).values,
                time: sliceSignals(filtered, ecgTime).time,
                borderColor: COLORS.filtered,
              },
            ]}
          />
          <ScientificChart
            title="Innovation y_k = z_k − H x̂⁻"
            datasets={[
              {
                label: 'Innovation',
                data: sliceSignals(kalmanFilterState.innovations, ecgTime).values,
                time: sliceSignals(kalmanFilterState.innovations, ecgTime).time,
                borderColor: COLORS.innovation,
              },
            ]}
            yLabel="Innovation"
          />
          <div className={styles.chartRow}>
            <ScientificChart
              title="Kalman Gain K_k"
              height={180}
              datasets={[
                {
                  label: 'K',
                  data: kalmanFilterState.K_trace,
                  borderColor: COLORS.gain,
                },
              ]}
              xLabel="Sample k"
              yLabel="Gain"
            />
            <ScientificChart
              title="Covariance trace P₀₀"
              height={180}
              datasets={[
                {
                  label: 'P trace',
                  data: kalmanFilterState.P_trace,
                  borderColor: COLORS.covariance,
                  fill: true,
                  backgroundColor: 'rgba(142, 68, 173, 0.15)',
                },
              ]}
              xLabel="Sample k"
              yLabel="P₀₀"
            />
          </div>
        </>
      )}

      {currentModule === 5 && filtered.length > 0 && (
        <ScientificChart
          title={`Estimation with x̂₀=${initialConditions.x0hat.toFixed(2)}, P₀=${initialConditions.P0_diag.toFixed(3)}`}
          datasets={[
            {
              label: 'Filtered',
              data: sliceSignals(filtered, ecgTime).values,
              time: sliceSignals(filtered, ecgTime).time,
              borderColor: COLORS.filtered,
            },
            cleanSignal.length > 0 && {
              label: 'Reference',
              data: sliceSignals(cleanSignal, ecgTime).values,
              time: sliceSignals(cleanSignal, ecgTime).time,
              borderColor: COLORS.clean,
              borderDash: [4, 4],
            },
          ].filter(Boolean)}
          annotation="Topic 2B: observe transient response and covariance-driven convergence from your initialization."
        />
      )}

      {currentModule === 6 && systemAnalysis?.eigenvalues && (
        <div className={styles.stabilityViz}>
          <h4>System Stability</h4>
          <p>
            |λ₁| = {(systemAnalysis.eigenvalues.magnitude1 ?? Math.abs(systemAnalysis.eigenvalues.lambda1))?.toFixed(4)}
            {' · '}
            |λ₂| = {(systemAnalysis.eigenvalues.magnitude2 ?? Math.abs(systemAnalysis.eigenvalues.lambda2))?.toFixed(4)}
          </p>
          <p className={styles.stabilityTag}>
            {systemAnalysis.stability?.stable
              ? '✓ Stable autonomous dynamics (|λ| < 1)'
              : systemAnalysis.stability?.marginal
                ? '⚠ Marginally stable'
                : '✗ Unstable — prediction diverges without measurement updates'}
          </p>
        </div>
      )}

      {currentModule >= 8 && filtered.length > 0 && cleanSignal.length > 0 && (
        <ScientificChart
          title="Performance: Reference vs Filtered"
          datasets={[
            {
              label: 'Reference',
              data: sliceSignals(cleanSignal, ecgTime).values,
              time: sliceSignals(cleanSignal, ecgTime).time,
              borderColor: COLORS.clean,
            },
            {
              label: 'Filtered',
              data: sliceSignals(filtered, ecgTime).values,
              time: sliceSignals(filtered, ecgTime).time,
              borderColor: COLORS.filtered,
            },
          ]}
        />
      )}

      {currentModule === 4 && stepIdx >= 0 && kalmanFilterState.K_trace?.length > 0 && (
        <div className={styles.stepHighlight}>
          Step {stepIdx + 1}: K = {kalmanFilterState.K_trace[stepIdx]?.toFixed(4)}, P ={' '}
          {kalmanFilterState.P_trace[stepIdx]?.toFixed(4)}
        </div>
      )}
    </div>
  );
}

export default ModuleVisualizationPanel;
