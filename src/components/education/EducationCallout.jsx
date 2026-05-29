import styles from "./educational.module.css";

export function EducationCallout({ learn, idea, why, connection }) {
  return (
    <div className={styles.calloutGrid}>
      <div className={styles.calloutCard}>
        <h4>What You Learn</h4>
        <p>{learn}</p>
      </div>
      <div className={styles.calloutCard}>
        <h4>Key Mathematical Idea</h4>
        <p>{idea}</p>
      </div>
      <div className={styles.calloutCard}>
        <h4>Why This Matters</h4>
        <p>{why}</p>
      </div>
      <div className={styles.calloutCard}>
        <h4>Theory → Visualization</h4>
        <p>{connection}</p>
      </div>
    </div>
  );
}
