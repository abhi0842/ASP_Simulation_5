import { useContext, useMemo } from "react";
import { SimulationContext } from "../../../context/SimulationContext";
import {
  runKalmanFilter,
  solvePInfinity,
  computeRMSE,
} from "../../../utils/kalman";
import { ChartCanvas } from "../ChartCanvas";
import { KDerivationPanel } from "../KDerivationPanel";
import { createRiskWindowPlugin } from "../riskWindowPlugin";
import { COLORS } from "../kalmanColors";
import styles from "../kalman.module.css";

const baseScales = {
  x: { type: "linear", title: { display: true, text: "Time (s)" } },
  y: { title: { display: true, text: "Amplitude (mV)" } },
};

export function InitialConditionsPanel({
  cleanSignal = [],
  noisySignal = [],
  times = [],
  dt = 0.002,
}) {
  const {
    applyNoiseTrigger,
    kalmanParams,
    noiselessMode,
    unforcedMode,
    playbackIndex,
  } = useContext(SimulationContext);
  const { P0_alpha, R } = kalmanParams;
  const showRiskWindow = P0_alpha < 1;

  // Effective Q and R for unforced + noiseless model
  const effectiveQ = noiselessMode ? 0 : kalmanParams.Q_diag;
  const effectiveR = R;

  const filterResult = useMemo(() => {
    if (!cleanSignal.length || !noisySignal.length) return null;
    const result = runKalmanFilter(
      noisySignal,
      dt,
      kalmanParams.x0hat,
      kalmanParams.P0_alpha,
      effectiveQ,
      effectiveR,
      { noiselessMode }
    );
    const P_inf = solvePInfinity(dt, effectiveQ, effectiveR);
    return { ...result, P_inf };
  }, [cleanSignal, noisySignal, dt, kalmanParams, noiselessMode, effectiveQ, effectiveR, R]);

  const metrics = useMemo(() => {
    if (!filterResult) return null;
    const { xFiltered, xPred_trace } = filterResult;

    const earlyEnd = Math.min(50, xFiltered.length, cleanSignal.length);
    const lateStart = Math.max(0, xFiltered.length - 50);

    const earlyPredRmse = computeRMSE(
      xPred_trace,
      cleanSignal,
      0,
      earlyEnd
    );
    const latePredRmse = computeRMSE(
      xPred_trace,
      cleanSignal,
      lateStart,
      xPred_trace.length
    );

    const earlyUpdateRmse = computeRMSE(
      xFiltered,
      cleanSignal,
      0,
      earlyEnd
    );
    const lateUpdateRmse = computeRMSE(
      xFiltered,
      cleanSignal,
      lateStart,
      xFiltered.length
    );

    return {
      earlyPredRmse,
      latePredRmse,
      earlyUpdateRmse,
      lateUpdateRmse,
    };
  }, [filterResult, cleanSignal, noiselessMode]);

  const riskPlugin = useMemo(
    () =>
      createRiskWindowPlugin(
        times,
        filterResult?.P_trace,
        filterResult?.P_inf,
        showRiskWindow && !noiselessMode
      ),
    [times, filterResult?.P_trace, filterResult?.P_inf, showRiskWindow, noiselessMode]
  );

  const signalChartDeps = [
    times,
    cleanSignal,
    noisySignal,
    filterResult?.xFiltered,
    filterResult?.xPred_trace,
    filterResult?.P_trace,
    filterResult?.P_inf,
    applyNoiseTrigger,
    showRiskWindow,
    noiselessMode,
    playbackIndex,
  ];

  const buildSignalChart = () => {
    if (!filterResult || !times.length) return null;
    const fullN = times.length;
    const endIdx = Math.min(playbackIndex + 1, fullN);
    const n = endIdx;
    const sliceTimes = times.slice(0, n);
    const sliceClean = cleanSignal.slice(0, n);
    const sliceNoisy = noisySignal.slice(0, n);
    const sliceFiltered = filterResult.xFiltered.slice(0, n);
    const slicePred = filterResult.xPred_trace?.slice(0, n) ?? [];
    return {
      type: "line",
      data: {
        datasets: [
          {
            label: "True clean ECG",
            data: sliceTimes.map((x, i) => ({
              x,
              y: sliceClean[i],
            })),
            borderColor: COLORS.gray,
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.1,
          },
          {
            label: applyNoiseTrigger ? "Noisy measurements" : "Measurements",
            data: sliceTimes.map((x, i) => ({ x, y: sliceNoisy[i] })),
            borderColor: COLORS.coral,
            backgroundColor: COLORS.coral,
            showLine: false,
            pointRadius: 1.5,
          },
          {
            label: "Kalman filtered",
            data: sliceTimes.map((x, i) => ({
              x,
              y: sliceFiltered[i],
            })),
            borderColor: COLORS.teal,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
          },
          {
            label: "Prediction x̂⁻ (before update)",
            data: sliceTimes.map((x, i) => ({
              x,
              y: slicePred[i],
            })),
            borderColor: COLORS.amber,
            borderDash: [6, 4],
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        plugins: {
          title: {
            display: true,
            text: `Signal: Truth vs Noisy vs Filtered${noiselessMode ? " [Noiseless Q=0]" : ""}${unforcedMode ? " [Unforced x̂⁻=Ax̂]" : ""}`,
            font: { size: 14, weight: "600" },
          },
          legend: { labels: { boxWidth: 12 } },
        },
        scales: baseScales,
      },
      plugins: [riskPlugin],
    };
  };

  const uncertaintyDeps = [
    times,
    filterResult?.P_trace,
    filterResult?.K_trace,
    filterResult?.P_inf,
    noiselessMode,
    playbackIndex,
  ];

  const buildUncertaintyChart = () => {
    if (!filterResult) return null;
    const endIdx = Math.min(playbackIndex + 1, filterResult.P_trace.length);
    const steps = filterResult.P_trace
      .slice(0, endIdx)
      .map((y, i) => ({ x: times[i] ?? i, y }));
    const gains = filterResult.K_trace
      .slice(0, endIdx)
      .map((y, i) => ({ x: times[i] ?? i, y }));
    const datasets = [
      {
        label: "P_k[0,0] — covariance",
        data: steps,
        borderColor: COLORS.amber,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: "y",
      },
      {
        label: "K_k — Kalman gain",
        data: gains,
        borderColor: COLORS.purple,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: "y1",
      },
    ];

    // Only show P∞ reference when not in noiseless mode (P∞→0 in noiseless)
    if (!noiselessMode && filterResult.P_inf > 0) {
      datasets.push({
        label: "P∞ (steady state)",
        data: steps.map((p) => ({ x: p.x, y: filterResult.P_inf })),
        borderColor: COLORS.gray,
        borderDash: [4, 4],
        borderWidth: 1,
        pointRadius: 0,
        yAxisID: "y",
      });
    }

    return {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        plugins: {
          title: {
            display: true,
            text: "Covariance P_k and Kalman Gain K_k",
            font: { size: 13, weight: "600" },
          },
        },
        scales: {
          x: { type: "linear", title: { display: true, text: "Time (s)" } },
          y: { position: "left", title: { display: true, text: "P_k" } },
          y1: {
            position: "right",
            title: { display: true, text: "K_k" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    };
  };

  if (!times.length) {
    return (
      <p className={styles.emptyHint}>
        Generate an ECG signal. Tune x̂₀, P₀, and R in the input panel (left). Use Play on the output panel for slow-motion.
      </p>
    );
  }

  return (
    <div className={styles.panelRoot}>
      <h3 className={styles.panelTitle}>Initial Conditions → Prediction Performance ★</h3>

      {/* Model mode banner */}
      <div className={styles.modeBanner}>
        <span className={unforcedMode ? styles.modeOn : styles.modeOff}>
          {unforcedMode ? "✓ Unforced" : "✗ Unforced off"}
        </span>
        <span className={noiselessMode ? styles.modeOn : styles.modeOff}>
          {noiselessMode ? "✓ Noiseless (Q=0)" : "✗ Noiseless off"}
        </span>
        {noiselessMode && (
          <span className={styles.modeHint}>
            Q=0: the model is deterministic; prediction accuracy depends
            strongly on x̂₀ and P₀ (via the gain).
          </span>
        )}
      </div>

      <KDerivationPanel P0_alpha={P0_alpha} R={effectiveR} />

      {!applyNoiseTrigger && (
        <p className={styles.hintText}>
          Measurements are kept clean for Topic 2B. Change <b>R</b> to see how
          filter trust affects prediction vs update.
        </p>
      )}

      <div className={styles.chartsOnlyCol}>
        <ChartCanvas
          buildConfig={buildSignalChart}
          deps={signalChartDeps}
          className={styles.chartBox}
        />

        {metrics && (
          <div className={styles.metricsRow}>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Early Prediction RMSE (x̂⁻)</p>
              <p className={styles.metricValue}>
                {metrics.earlyPredRmse.toFixed(4)}
              </p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Late Prediction RMSE (x̂⁻)</p>
              <p className={styles.metricValue}>
                {metrics.latePredRmse.toFixed(4)}
              </p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Early Updated RMSE (x̂)</p>
              <p className={styles.metricValue}>
                {metrics.earlyUpdateRmse.toFixed(4)}
              </p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Late Updated RMSE (x̂)</p>
              <p className={styles.metricValue}>
                {metrics.lateUpdateRmse.toFixed(4)}
              </p>
            </div>
          </div>
        )}

        <ChartCanvas
          buildConfig={buildUncertaintyChart}
          deps={uncertaintyDeps}
          className={styles.chartBoxSmall}
        />
      </div>
    </div>
  );
}
