import { motion } from "framer-motion";
import { LabLineChart } from "../lab/LabLineChart.jsx";
import styles from "./visualLab.module.css";

export function ComparisonGraph({
  leftTitle,
  rightTitle,
  leftData,
  rightData,
  leftLines,
  rightLines,
  leftTag,
  rightTag,
  singleChart,
  singleData,
  singleLines,
  singleTitle,
}) {
  if (singleChart) {
    return (
      <motion.div
        className={styles.chartBox}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {singleTitle && <p className={styles.caption}>{singleTitle}</p>}
        <LabLineChart data={singleData} lines={singleLines} />
      </motion.div>
    );
  }

  return (
    <div className={styles.compareRow}>
      <motion.div
        className={styles.compareCol}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h5>{leftTitle}</h5>
        {leftTag && <span className={styles.tagStable}>{leftTag}</span>}
        <div className={styles.chartBox}>
          <LabLineChart data={leftData} lines={leftLines} />
        </div>
      </motion.div>
      <motion.div
        className={styles.compareCol}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h5>{rightTitle}</h5>
        {rightTag && <span className={styles.tagUncertain}>{rightTag}</span>}
        <div className={styles.chartBox}>
          <LabLineChart data={rightData} lines={rightLines} />
        </div>
      </motion.div>
    </div>
  );
}
