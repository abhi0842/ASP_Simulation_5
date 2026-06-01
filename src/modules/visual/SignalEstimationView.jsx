import { useMemo, useContext } from "react";
import { motion } from "framer-motion";
import { SimulationContext } from "../../context/SimulationContext";
import { useKalmanSignals } from "../../hooks/useKalmanSignals";
import { FlowDiagram } from "../../components/visualLab/FlowDiagram.jsx";
import { ComparisonGraph } from "../../components/visualLab/ComparisonGraph.jsx";
import { CompactEcgPlayback } from "../../components/visualLab/CompactEcgPlayback.jsx";
import { ExpandableMathPanel } from "../../components/visualLab/ExpandableMathPanel.jsx";
import styles from "../../components/visualLab/visualLab.module.css";

export function SignalEstimationView() {
  const { generateECG, applyNoiseTrigger } = useContext(SimulationContext);
  const { aligned, filterResult } = useKalmanSignals();

  const chartData = useMemo(() => {
    if (!aligned.hasData || !filterResult) return [];
    const n = Math.min(300, aligned.truth.length, filterResult.xFiltered.length);
    return Array.from({ length: n }, (_, i) => ({
      t: aligned.times[i],
      truth: aligned.truth[i],
      meas: aligned.measurements[i],
      est: filterResult.xFiltered[i],
    }));
  }, [aligned, filterResult]);

  if (!generateECG) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.viewArea}>
        <p className={styles.caption}>← Click <strong>Generate ECG</strong> in controls to start</p>
        <FlowDiagram
          vertical
          steps={["True ECG", "Noise added", "Kalman predict", "Corrected estimate"]}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.viewArea}
      key="signal"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <FlowDiagram
        vertical
        steps={["True ECG", "Noisy zₖ", "Prediction x̂⁻", "Estimate x̂"]}
      />
      <ComparisonGraph
        singleChart
        singleTitle="True · measurement · Kalman estimate"
        singleData={chartData}
        singleLines={[
          { key: "truth", name: "True", color: "#888780", dash: "4 4" },
          { key: "meas", name: "Measured", color: applyNoiseTrigger ? "#e24b4a" : "#ba7517" },
          { key: "est", name: "Kalman x̂", color: "#1d7480" },
        ]}
      />
      <CompactEcgPlayback />
      <ExpandableMathPanel>
        {`x̂ₖ⁻ = A x̂ₖ₋₁
x̂ₖ = x̂ₖ⁻ + Kₖ (zₖ − H x̂ₖ⁻)`}
      </ExpandableMathPanel>
    </motion.div>
  );
}
