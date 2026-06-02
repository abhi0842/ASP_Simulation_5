import { motion, AnimatePresence } from "framer-motion";
import s from "./invShared.module.css";

export function DynamicInsight({ text }) {
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={text}
        className={s.insight}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        {text}
      </motion.p>
    </AnimatePresence>
  );
}
