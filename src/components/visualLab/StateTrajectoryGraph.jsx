import { motion } from "framer-motion";
import { LabLineChart } from "../lab/LabLineChart.jsx";
import styles from "./visualLab.module.css";

const PALETTE = {
  truth: { key: "truth", name: "True state", color: "#888780", dash: "4 4" },
  unforced: { key: "unforced", name: "Unforced", color: "#1d7480" },
  forced: { key: "forced", name: "Forced", color: "#e24b4a" },
  estimate: { key: "est", name: "Estimate", color: "#378add" },
};

export function StateTrajectoryGraph({ data, lines = ["truth", "unforced", "forced"], tall }) {
  const chartLines = lines.map((id) => PALETTE[id]).filter(Boolean);
  return (
    <motion.div
      className={tall ? styles.chartTall : styles.chartBox}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <LabLineChart data={data} lines={chartLines} />
    </motion.div>
  );
}
