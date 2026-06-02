import { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SimulationContext } from "../context/SimulationContext";
import { INVESTIGATIONS } from "./constants";
import { Inv1UnforcedDynamics } from "./Inv1UnforcedDynamics";
import { Inv2ForcedComparison } from "./Inv2ForcedComparison";
import { Inv3NoiselessModel } from "./Inv3NoiselessModel";
import { Inv4ProcessNoise } from "./Inv4ProcessNoise";
import { Inv5SteadyState } from "./Inv5SteadyState";
import { Inv6Observability } from "./Inv6Observability";
import styles from "../components/kalman/kalman.module.css";
import s from "./shared/invShared.module.css";

const VIEWS = [
  Inv1UnforcedDynamics,
  Inv2ForcedComparison,
  Inv3NoiselessModel,
  Inv4ProcessNoise,
  Inv5SteadyState,
  Inv6Observability,
];

export function InvestigationPanel() {
  const {
    generateECG,
    activeInvestigation,
    setActiveInvestigation,
    maxUnlockedInvestigation,
    setMaxUnlockedInvestigation,
    setPlaybackIndex,
    setPlaybackPlaying,
  } = useContext(SimulationContext);

  const complete = () => {
    if (activeInvestigation < INVESTIGATIONS.length - 1) {
      setMaxUnlockedInvestigation((m) => Math.max(m, activeInvestigation + 1));
    }
  };

  const selectInv = (id) => {
    if (id > maxUnlockedInvestigation) return;
    setActiveInvestigation(id);
    setPlaybackIndex(0);
    setPlaybackPlaying(false);
  };

  if (!generateECG) {
    return (
      <p className={styles.panelHint} style={{ padding: 16 }}>
        Generate an ECG signal (Step 1, left panel) to begin the six investigations.
      </p>
    );
  }

  const ActiveView = VIEWS[activeInvestigation] ?? Inv1UnforcedDynamics;
  const progress = ((maxUnlockedInvestigation + 1) / INVESTIGATIONS.length) * 100;

  return (
    <section className={styles.kalmanTabsRoot} aria-label="Kalman investigations">
      <div className={s.progressBar}>
        <div className={s.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <p className={s.metric}>
        Progress: investigation {maxUnlockedInvestigation + 1} of {INVESTIGATIONS.length} unlocked
      </p>

      <nav className={styles.tabBar} role="tablist">
        {INVESTIGATIONS.map((inv) => {
          const locked = inv.id > maxUnlockedInvestigation;
          return (
            <button
              key={inv.id}
              type="button"
              role="tab"
              disabled={locked}
              aria-selected={activeInvestigation === inv.id}
              className={
                activeInvestigation === inv.id
                  ? styles.tabBtnActive
                  : locked
                    ? styles.tabBtn
                    : styles.tabBtn
              }
              style={locked ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
              onClick={() => selectInv(inv.id)}
              title={locked ? "Complete previous investigation first" : inv.title}
            >
              <span className={styles.tabStepBadge}>{inv.id + 1}</span>
              {inv.short}
            </button>
          );
        })}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeInvestigation}
          role="tabpanel"
          className={styles.tabContent}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <ActiveView onComplete={complete} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
