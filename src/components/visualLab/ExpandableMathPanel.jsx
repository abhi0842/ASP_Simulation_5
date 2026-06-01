import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./visualLab.module.css";

export function ExpandableMathPanel({ children, label = "Show math" }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className={styles.mathToggle} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide math" : label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.mathPanel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
