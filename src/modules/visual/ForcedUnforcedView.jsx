import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLabKalman } from "../../hooks/useLabKalman";
import { FlowDiagram } from "../../components/visualLab/FlowDiagram.jsx";
import { StateTrajectoryGraph } from "../../components/visualLab/StateTrajectoryGraph.jsx";
import { ExpandableMathPanel } from "../../components/visualLab/ExpandableMathPanel.jsx";
import styles from "../../components/visualLab/visualLab.module.css";

export function ForcedUnforcedView() {
  const { hasData, openLoop, times, truth } = useLabKalman();
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(200);

  const data = useMemo(() => {
    if (!hasData) return [];
    const n = Math.min(openLoop.unforced.length, openLoop.forced.length, times.length, 350);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i] ?? i,
      truth: truth[i],
      unforced: openLoop.unforced[i],
      forced: openLoop.forced[i],
    }));
  }, [hasData, openLoop, times, truth]);

  useEffect(() => {
    if (!playing || !data.length) return;
    const id = setInterval(() => setFrame((f) => (f >= data.length - 1 ? 40 : f + 2)), 70);
    return () => clearInterval(id);
  }, [playing, data.length]);

  const view = data.slice(0, frame);

  if (!hasData) {
    return <p className={styles.caption}>Load ECG in Signal Estimation, or wait for auto-load…</p>;
  }

  return (
    <motion.div
      className={styles.viewArea}
      key="forced"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.compareRow}>
        <FlowDiagram steps={["xₖ", "A", "xₖ₊₁"]} />
        <FlowDiagram steps={["xₖ", "+ Buₖ", "A", "xₖ₊₁"]} />
      </div>
      <p className={styles.caption}>Left: unforced · Right: forced (toggle u in controls)</p>
      <button type="button" className={styles.btnSecondary} onClick={() => setPlaying((p) => !p)} style={{ marginBottom: 8 }}>
        {playing ? "Pause" : "Play"} animation
      </button>
      <StateTrajectoryGraph data={view} lines={["truth", "unforced", "forced"]} tall />
      <ExpandableMathPanel>
        {`Unforced:  xₖ₊₁ = A xₖ
Forced:    xₖ₊₁ = A xₖ + B uₖ`}
      </ExpandableMathPanel>
    </motion.div>
  );
}
