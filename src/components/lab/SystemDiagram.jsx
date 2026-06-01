import styles from "./lab.module.css";

export function SystemDiagram() {
  return (
    <div className={styles.diagram} aria-label="State-space system diagram">
      <div className={styles.diagramRow}>
        <span className={styles.diagramBox}>xₖ</span>
        <span className={styles.diagramArrow}>—A→</span>
        <span className={styles.diagramBox}>xₖ₊₁</span>
        <span className={styles.diagramArrow}>—H→</span>
        <span className={styles.diagramBox}>zₖ</span>
      </div>
      <div className={styles.diagramRow}>
        <span className={styles.diagramNote}>Unforced: no B uₖ · Noiseless: Q = 0</span>
      </div>
      <div className={styles.diagramRow}>
        <span className={styles.diagramBoxMuted}>Kalman</span>
        <span className={styles.diagramArrow}>predict → correct</span>
        <span className={styles.diagramBoxMuted}>x̂ₖ, Pₖ</span>
      </div>
    </div>
  );
}
