import styles from "./lab.module.css";

export function ObservabilityBadge({ observable, rank, n = 2 }) {
  if (observable) {
    return <span className={styles.badgeOk}>Observable (rank {rank}/{n})</span>;
  }
  return <span className={styles.badgeBad}>NOT observable (rank {rank}/{n})</span>;
}
