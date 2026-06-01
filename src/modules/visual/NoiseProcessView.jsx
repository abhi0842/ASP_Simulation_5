import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLabKalman } from "../../hooks/useLabKalman";
import { ComparisonGraph } from "../../components/visualLab/ComparisonGraph.jsx";
import { LabLineChart } from "../../components/lab/LabLineChart.jsx";
import { ExpandableMathPanel } from "../../components/visualLab/ExpandableMathPanel.jsx";
import styles from "../../components/visualLab/visualLab.module.css";

export function NoiseProcessView() {
  const { hasData, pair, times } = useLabKalman();

  const { left, right, pChart } = useMemo(() => {
    if (!hasData || !pair) return { left: [], right: [], pChart: [] };
    const n = Math.min(280, pair.noiseless.xFiltered.length, times.length);
    const left = [];
    const right = [];
    const pChart = [];
    for (let i = 0; i < n; i++) {
      left.push({ t: times[i], y: pair.noiseless.xFiltered[i] });
      right.push({ t: times[i], y: pair.noisy.xFiltered[i] });
      pChart.push({
        t: times[i],
        p0: pair.noiseless.P_trace[i],
        pn: pair.noisy.P_trace[i],
      });
    }
    return { left, right, pChart };
  }, [hasData, pair, times]);

  if (!hasData) {
    return <p className={styles.caption}>Loading example signal…</p>;
  }

  return (
    <motion.div
      className={styles.viewArea}
      key="noise"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <ComparisonGraph
        leftTitle="Q = 0"
        rightTitle="Q > 0"
        leftTag="fast convergence"
        rightTag="high uncertainty"
        leftData={left}
        rightData={right}
        leftLines={[{ key: "y", name: "Estimate", color: "#1d7480" }]}
        rightLines={[{ key: "y", name: "Estimate", color: "#e24b4a" }]}
      />
      <p className={styles.caption}>Covariance Pₖ — watch it shrink faster when Q = 0</p>
      <div className={styles.chartBox}>
        <LabLineChart
          data={pChart}
          lines={[
            { key: "p0", name: "Pₖ (Q=0)", color: "#1d7480" },
            { key: "pn", name: "Pₖ (Q>0)", color: "#e24b4a" },
          ]}
        />
      </div>
      <ExpandableMathPanel>When Q = 0, uncertainty enters via R and P₀ only.</ExpandableMathPanel>
    </motion.div>
  );
}
