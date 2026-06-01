import { useContext, useMemo } from "react";
import { SimulationContext } from "../../../context/SimulationContext";
import { useKalmanSignals } from "../../../hooks/useKalmanSignals";
import { useChartJs } from "../../../hooks/useChartJs";
import { PanelHeader } from "../PanelHeader";
import { COLORS } from "../kalmanColors";
import styles from "../kalman.module.css";

/** Step 1 output — true ECG, measurement, Kalman estimate on one chart. */
export function SignalOverviewPanel({
  cleanSignal = [],
  noisySignal = [],
  times = [],
}) {
  const { applyNoiseTrigger } = useContext(SimulationContext);
  const { filterResult } = useKalmanSignals();

  const chartDeps = [times, cleanSignal, noisySignal, filterResult, applyNoiseTrigger];

  const buildChart = () => {
    if (!times.length || !filterResult) return null;
    const n = Math.min(times.length, filterResult.xFiltered.length, 400);
    return {
      type: "line",
      data: {
        datasets: [
          {
            label: "True ECG",
            data: times.slice(0, n).map((x, i) => ({ x, y: cleanSignal[i] })),
            borderColor: COLORS.gray,
            borderWidth: 1.5,
            pointRadius: 0,
            borderDash: [4, 4],
          },
          {
            label: applyNoiseTrigger ? "Noisy measurement zₖ" : "Measurement zₖ",
            data: times.slice(0, n).map((x, i) => ({
              x,
              y: applyNoiseTrigger ? noisySignal[i] : cleanSignal[i],
            })),
            borderColor: COLORS.coral,
            borderWidth: 1,
            pointRadius: 0,
          },
          {
            label: "Kalman estimate x̂",
            data: times.slice(0, n).map((x, i) => ({ x, y: filterResult.xFiltered[i] })),
            borderColor: COLORS.teal,
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          title: {
            display: true,
            text: "Signal estimation on real ECG data",
          },
          legend: { position: "bottom" },
        },
        scales: {
          x: { type: "linear", title: { display: true, text: "Time (s)" } },
          y: { title: { display: true, text: "Amplitude" } },
        },
      },
    };
  };

  const { canvasRef } = useChartJs(buildChart, chartDeps);

  const flow = useMemo(
    () => ["True ECG", "→", "zₖ", "→", "x̂⁻ predict", "→", "x̂ correct"],
    []
  );

  return (
    <div className={styles.panelRoot}>
      <PanelHeader
        title="Signal Estimation"
        subtitle="Watch the filter track the ECG. Use playback above to step through predict → correct."
      />
      <div className={styles.flowHint} aria-hidden>
        {flow.map((s, i) => (
          <span key={i} className={s === "→" ? styles.flowArrow : styles.flowChip}>
            {s}
          </span>
        ))}
      </div>
      <div className={styles.chartBox} style={{ height: 260 }}>
        <canvas ref={canvasRef} />
      </div>
      <p className={styles.panelHint}>
        <strong>Experiment:</strong> Turn off Noiseless mode (Step 3) and increase Q — open the{" "}
        <em>Q=0 vs Q&gt;0</em> tab to compare covariance behavior.
      </p>
    </div>
  );
}
