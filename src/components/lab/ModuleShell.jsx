import { motion } from "framer-motion";
import styles from "./lab.module.css";

export function ModuleShell({ title, objectives, theory, experiment, visualization, takeaways }) {
  return (
    <motion.article
      className={styles.module}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h2 className={styles.title}>{title}</h2>

      {objectives && (
        <div className={styles.section}>
          <h4>Learning Objectives</h4>
          <ul className={styles.objectives}>{objectives}</ul>
        </div>
      )}

      {theory}

      {experiment && (
        <div className={styles.section}>
          <h4>Interactive Experiment</h4>
          {experiment}
        </div>
      )}

      {visualization && (
        <div className={styles.section}>
          <h4>Visualization</h4>
          {visualization}
        </div>
      )}

      {takeaways && (
        <div className={styles.section}>
          <h4>Key Takeaways</h4>
          <p className={styles.takeaway}>{takeaways}</p>
        </div>
      )}
    </motion.article>
  );
}
