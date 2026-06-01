import { motion } from "framer-motion";
import styles from "./visualLab.module.css";

export function AnimatedArrow({ vertical = false }) {
  return (
    <motion.span
      className={styles.flowArrow}
      animate={{ opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 1.4, repeat: Infinity }}
      aria-hidden
    >
      {vertical ? "↓" : "→"}
    </motion.span>
  );
}
