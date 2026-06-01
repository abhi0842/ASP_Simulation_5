import { useContext, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationContext } from "../context/SimulationContext";
import { LAB_CONCEPTS } from "../constants/labConcepts";
import { ModuleCard } from "../components/visualLab/ModuleCard";
import { SignalEstimationView } from "./visual/SignalEstimationView";
import { ForcedUnforcedView } from "./visual/ForcedUnforcedView";
import { NoiseProcessView } from "./visual/NoiseProcessView";
import { RiccatiView } from "./visual/RiccatiView";
import { ObservabilityView } from "./visual/ObservabilityView";
import styles from "../components/visualLab/visualLab.module.css";

const VIEWS = {
  signal: SignalEstimationView,
  forced: ForcedUnforcedView,
  noise: NoiseProcessView,
  riccati: RiccatiView,
  obs: ObservabilityView,
};

export function VisualKalmanLab() {
  const { activeConcept, setActiveConcept, setGenerateECG, generateECG, setNoiselessMode, setUnforcedMode } =
    useContext(SimulationContext);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (!generateECG) setGenerateECG(true);
    setNoiselessMode(true);
    setUnforcedMode(true);
  }, [generateECG, setGenerateECG, setNoiselessMode, setUnforcedMode]);

  const ActiveView = VIEWS[activeConcept] ?? SignalEstimationView;

  return (
    <section className={styles.shell} aria-label="Kalman visual lab">
      <nav className={styles.conceptGrid} aria-label="Choose a concept">
        {LAB_CONCEPTS.map((c) => (
          <ModuleCard
            key={c.id}
            icon={c.icon}
            title={c.title}
            active={activeConcept === c.id}
            onClick={() => setActiveConcept(c.id)}
          />
        ))}
      </nav>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeConcept}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          <ActiveView />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
