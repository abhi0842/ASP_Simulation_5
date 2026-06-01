import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLabKalman } from "../../hooks/useLabKalman";
import { ObservabilityBadge } from "../../components/lab/ObservabilityBadge.jsx";
import { ComparisonGraph } from "../../components/visualLab/ComparisonGraph.jsx";
import { ExpandableMathPanel } from "../../components/visualLab/ExpandableMathPanel.jsx";
import { AnimatedArrow } from "../../components/visualLab/AnimatedArrow.jsx";
import styles from "../../components/visualLab/visualLab.module.css";

export function ObservabilityView() {
  const { hasData, observable, rank, times, truth, obsPair } = useLabKalman();

  const good = useMemo(() => {
    if (!obsPair) return [];
    const n = Math.min(220, times.length);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      truth: truth[i],
      est: obsPair.observable.xStates?.[i]?.[0] ?? obsPair.observable.xFiltered[i],
    }));
  }, [obsPair, times, truth]);

  const bad = useMemo(() => {
    if (!obsPair) return [];
    const n = Math.min(220, times.length);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      truth: truth[i],
      est: obsPair.nonObservable.xFiltered[i],
    }));
  }, [obsPair, times, truth]);

  return (
    <motion.div
      className={styles.viewArea}
      key="obs"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.obsDiagram}>
        <div className={styles.obsHidden}>Hidden states x</div>
        <AnimatedArrow vertical />
        <div className={styles.obsMeasured}>Measured z = Hx</div>
        <AnimatedArrow vertical />
        <div className={styles.obsEstimate}>Recovered x̂</div>
      </div>
      <ObservabilityBadge observable={observable} rank={rank} n={2} />
      {!observable && (
        <p className={styles.badgeBad} style={{ display: "block", textAlign: "center", margin: "8px 0" }}>
          System is NOT observable
        </p>
      )}
      {hasData && obsPair && (
        <ComparisonGraph
          leftTitle="Observable H=[1,0]"
          rightTitle="H=[0,1] — loses position"
          leftTag="reconstructs"
          rightTag="diverges"
          leftData={good}
          rightData={bad}
          leftLines={[
            { key: "truth", name: "True", color: "#888780", dash: "4 4" },
            { key: "est", name: "x̂", color: "#1d7480" },
          ]}
          rightLines={[
            { key: "truth", name: "True", color: "#888780", dash: "4 4" },
            { key: "est", name: "x̂", color: "#e24b4a" },
          ]}
        />
      )}
      <ExpandableMathPanel label="Show math">O = [H; HA] — rank must equal 2</ExpandableMathPanel>
    </motion.div>
  );
}
