import { useContext, useMemo, useState } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { useKalmanSignals } from "../../hooks/useKalmanSignals";
import { StateSpacePanel } from "./panels/StateSpacePanel";
import { InitialConditionsPanel } from "./panels/InitialConditionsPanel";
import { GainInspectorPanel } from "./panels/GainInspectorPanel";
import { ConvergenceRacePanel } from "./panels/ConvergenceRacePanel";
import { ComparisonPanel } from "./panels/ComparisonPanel";
import styles from "./kalman.module.css";

/**
 * Learning tabs — each maps to a numbered step in the input panel (left).
 *
 *  Input panel step  →  Tab
 *  ─────────────────────────────────────────────────────────────
 *  Step 2 (model)    →  State Space   (see what x̂⁻ = Ax̂ does)
 *  Step 3 (x̂₀, P₀) →  Initial Conditions ★  (core experiment)
 *  Step 3 (x̂₀, P₀) →  Convergence Race       (P₀ speed effect)
 *  Step 5 (presets)  →  Scenario Comparison    (4 initial conds)
 *  Step 4 (Q, R)     →  Gain Inspector         (K_k dynamics)
 */
const TABS = [
  {
    id: "stateSpace",
    label: "Step 2 — Unforced Model",
    shortLabel: "Unforced Model",
    step: "2",
    hint: "Visualise x̂⁻ = A x̂ — no control input. Try the Predict Step button.",
  },
  {
    id: "initialConditions",
    label: "Step 3 — Initial Conditions ★",
    shortLabel: "Initial Conds ★",
    step: "3",
    hint: "Change x̂₀ and P₀ in the input panel (left) → watch RMSE and the filtered signal update here.",
  },
  {
    id: "convergenceRace",
    label: "Step 3b — Convergence Race",
    shortLabel: "Conv. Race",
    step: "3b",
    hint: "See how fast three different P₀ values race to steady-state P∞.",
  },
  {
    id: "comparison",
    label: "Step 5 — Scenario Comparison",
    shortLabel: "Scenarios",
    step: "5",
    hint: "Load one of the 4 scenarios from the input panel → compare performance side-by-side here.",
  },
  {
    id: "gainInspector",
    label: "Step 4 — Gain Inspector",
    shortLabel: "Gain K_k",
    step: "4",
    hint: "See how K_k evolves from P₀. Click a bar for the full K calculation at that step.",
  },
];

export function KalmanLearningPanel() {
  const [activeTab, setActiveTab] = useState("initialConditions");
  const { generateECG, noiselessMode, unforcedMode } = useContext(SimulationContext);
  const { aligned, dt } = useKalmanSignals();

  const panelProps = useMemo(
    () => ({
      cleanSignal: aligned.truth,
      noisySignal: aligned.measurements,
      times: aligned.times,
      dt,
    }),
    [aligned.truth, aligned.measurements, aligned.times, dt]
  );

  if (!generateECG) return null;

  const activeTabObj = TABS.find((t) => t.id === activeTab);

  return (
    <section className={styles.kalmanTabsRoot} aria-label="Kalman learning modules">

      {/* ── Topic context banner ── */}
      <div className={styles.topicBanner}>
        <div className={styles.topicBannerLeft}>
          <strong>Topic 2B</strong> — Unforced Dynamic Model &amp; Noiseless State-Space
        </div>
        <div className={styles.topicBannerBadges}>
          <span className={unforcedMode ? styles.topicBadgeOn : styles.topicBadgeOff}>
            {unforcedMode ? "✓ Unforced" : "✗ Unforced off"}
          </span>
          <span className={noiselessMode ? styles.topicBadgeOn : styles.topicBadgeOff}>
            {noiselessMode ? "✓ Noiseless (Q=0)" : "✗ Noiseless off"}
          </span>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <nav className={styles.tabBar} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setActiveTab(tab.id)}
            title={tab.hint}
          >
            <span className={styles.tabStepBadge}>{tab.step}</span>
            {tab.shortLabel}
          </button>
        ))}
      </nav>

      {/* ── Tab hint bar ── */}
      {activeTabObj && (
        <div className={styles.tabHintBar}>
          <span className={styles.tabHintIcon}>💡</span>
          {activeTabObj.hint}
        </div>
      )}

      {/* ── Panel content ── */}
      <div className={styles.tabContent} role="tabpanel">
        {activeTab === "stateSpace" && <StateSpacePanel {...panelProps} />}
        {activeTab === "initialConditions" && (
          <InitialConditionsPanel {...panelProps} />
        )}
        {activeTab === "convergenceRace" && (
          <ConvergenceRacePanel {...panelProps} />
        )}
        {activeTab === "comparison" && <ComparisonPanel {...panelProps} />}
        {activeTab === "gainInspector" && <GainInspectorPanel {...panelProps} />}
      </div>
    </section>
  );
}
