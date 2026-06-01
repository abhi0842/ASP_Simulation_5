import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLabKalman } from "../../hooks/useLabKalman";
import { CovarianceHeatmap } from "../../components/lab/CovarianceHeatmap.jsx";
import { ConvergenceIndicator } from "../../components/lab/ConvergenceIndicator.jsx";
import { FlowDiagram } from "../../components/visualLab/FlowDiagram.jsx";
import { LabLineChart } from "../../components/lab/LabLineChart.jsx";
import { ExpandableMathPanel } from "../../components/visualLab/ExpandableMathPanel.jsx";
import styles from "../../components/visualLab/visualLab.module.css";

export function RiccatiView() {
  const { hasData, pair, tripleQ, steadyIdx, times } = useLabKalman();
  const [idx, setIdx] = useState(0);
  const matrices = pair?.noiseless?.P_matrix_trace ?? [];
  const m = matrices[idx] ?? matrices.at(-1) ?? { p00: 0, p01: 0, p10: 0, p11: 0 };

  useEffect(() => {
    if (!matrices.length) return;
    const id = setInterval(() => setIdx((i) => (i >= matrices.length - 1 ? 0 : i + 4)), 100);
    return () => clearInterval(id);
  }, [matrices.length]);

  const pChart = useMemo(() => {
    if (!tripleQ.length) return [];
    const n = Math.min(280, tripleQ[0].result.P_trace.length, times.length);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      p: tripleQ[0].result.P_trace[i],
      k: tripleQ[0].result.K_trace[i],
    }));
  }, [tripleQ, times]);

  return (
    <motion.div
      className={styles.viewArea}
      key="riccati"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.riccatiFlow}>
        <span className={styles.riccatiStep}>Predict</span>
        <span className={styles.flowArrow}>↓</span>
        <span className={styles.riccatiStep}>Covariance grows</span>
        <span className={styles.flowArrow}>↓</span>
        <span className={styles.riccatiStep}>Measurement update</span>
        <span className={styles.flowArrow}>↓</span>
        <span className={styles.riccatiStep}>P shrinks</span>
      </div>
      <ConvergenceIndicator steadyIdx={steadyIdx} P_inf={pair?.P_inf_noiseless} />
      <div className={styles.compareRow}>
        <div>
          <p className={styles.caption}>Pₖ matrix (animated)</p>
          <CovarianceHeatmap p00={m.p00} p01={m.p01} p10={m.p10} p11={m.p11} />
        </div>
        <div className={styles.chartBox}>
          <LabLineChart
            data={pChart}
            lines={[
              { key: "p", name: "trace(P)", color: "#1d7480" },
              { key: "k", name: "‖K‖", color: "#378add" },
            ]}
          />
        </div>
      </div>
      <span className={styles.tagFast}>steady-state gain</span>
      <ExpandableMathPanel>Pₖ₊₁ = A Pₖ Aᵀ − … + Q · P∞ = f(P∞)</ExpandableMathPanel>
    </motion.div>
  );
}
