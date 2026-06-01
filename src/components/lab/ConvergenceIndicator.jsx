import styles from "./lab.module.css";

export function ConvergenceIndicator({ steadyIdx, P_inf }) {
  if (steadyIdx < 0) {
    return (
      <span className={styles.badgeBad}>
        P∞ not reached in window (target ≈ {Number(P_inf).toFixed(6)})
      </span>
    );
  }
  return (
    <span className={styles.badgeOk}>
      P∞ reached near step {steadyIdx} (P∞ ≈ {Number(P_inf).toFixed(6)})
    </span>
  );
}
