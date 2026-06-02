import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import styles from "./lab.module.css";

export function CollapsibleTheory({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.collapseBtn}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.collapseBody}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
