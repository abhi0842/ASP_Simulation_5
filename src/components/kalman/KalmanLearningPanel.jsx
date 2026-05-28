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
    hint: "Unforced model",
  },
  {
    id: "initialConditions",
    label: "Step 3 — Initial Conditions ★",
    shortLabel: "Initial Conds ★",
    step: "3",
    hint: "Initial conditions impact",
  },
  {
    id: "convergenceRace",
    label: "Step 3b — Convergence Race",
    shortLabel: "Conv. Race",
    step: "3b",
    hint: "Convergence speed",
  },
  {
    id: "comparison",
    label: "Step 5 — Scenario Comparison",
    shortLabel: "Scenarios",
    step: "5",
    hint: "Scenario comparison",
  },
  {
    id: "gainInspector",
    label: "Step 4 — Gain Inspector",
    shortLabel: "Gain K_k",
    step: "4",
    hint: "Gain evolution",
  },
];

export function KalmanLearningPanel() {
  const [activeTab, setActiveTab] = useState("initialConditions");
  const { generateECG } = useContext(SimulationContext);
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

  return (
    <section className={styles.kalmanTabsRoot} aria-label="Kalman learning modules">
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
