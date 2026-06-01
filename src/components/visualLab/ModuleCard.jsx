import { motion } from "framer-motion";
import styles from "./visualLab.module.css";

export function ModuleCard({ icon, title, active, onClick }) {
  return (
    <motion.button
      type="button"
      className={active ? styles.moduleCardActive : styles.moduleCard}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <span className={styles.cardIcon} aria-hidden>
        {icon}
      </span>
      <span className={styles.cardTitle}>{title}</span>
    </motion.button>
  );
}
