import { Fragment } from "react";
import { motion } from "framer-motion";
import { AnimatedArrow } from "./AnimatedArrow.jsx";
import styles from "./visualLab.module.css";

export function FlowDiagram({ steps, vertical = false }) {
  const wrap = vertical ? styles.flowVertical : styles.flow;
  return (
    <div className={wrap} role="img" aria-label="Process flow">
      {steps.map((step, i) => (
        <Fragment key={`${step}-${i}`}>
          <motion.span
            className={styles.flowStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
          >
            {step}
          </motion.span>
          {i < steps.length - 1 && <AnimatedArrow vertical={vertical} />}
        </Fragment>
      ))}
    </div>
  );
}
