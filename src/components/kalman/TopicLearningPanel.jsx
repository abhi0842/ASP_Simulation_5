import { useContext, useMemo } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { useKalmanSignals } from "../../hooks/useKalmanSignals";
import { StateSpacePanel } from "./panels/StateSpacePanel";
import { SignalOverviewPanel } from "./panels/SignalOverviewPanel";
import { GainInspectorPanel } from "./panels/GainInspectorPanel";
import { InitialConditionsPanel } from "./panels/InitialConditionsPanel";
import { ConvergenceRacePanel } from "./panels/ConvergenceRacePanel";
import { ComparisonPanel } from "./panels/ComparisonPanel";
import { NoiseProcessView } from "../../modules/visual/NoiseProcessView";
import { ForcedUnforcedView } from "../../modules/visual/ForcedUnforcedView";
import { RiccatiView } from "../../modules/visual/RiccatiView";
import { ObservabilityView } from "../../modules/visual/ObservabilityView";
import styles from "./kalman.module.css";

/**
 * Output-panel learning tabs — matches numbered steps on the input panel (left).
 * Topic: Kalman filter · unforced model · noiseless Q=0 · Riccati · observability
 */
const TABS = [
  {
    id: "overview",
    label: "Signal Estimation",
    shortLabel: "Estimation",
    step: "1",
    hint: "True vs measured vs estimated ECG",
  },
  {
    id: "stateSpace",
    label: "Unforced Model",
    shortLabel: "Unforced",
    step: "2",
    hint: "x̂⁻ = A x̂ — no control input",
  },
  {
    id: "noiseless",
    label: "Q=0 vs Q>0",
    shortLabel: "Q compare",
    step: "3",
    hint: "Noiseless vs noisy process",
  },
  {
    id: "forced",
    label: "Forced vs Unforced",
    shortLabel: "Forced",
    step: "4",
    hint: "Effect of B uₖ",
  },
  {
    id: "riccati",
    label: "Riccati / P∞",
    shortLabel: "Riccati",
    step: "5",
    hint: "Covariance convergence",
  },
  {
    id: "obs",
    label: "Observability",
    shortLabel: "Obs.",
    step: "6",
    hint: "Rank of O = [H; HA]",
  },
  {
    id: "gain",
    label: "Gain Inspector",
    shortLabel: "Gain Kₖ",
    step: "7",
    hint: "Kalman gain evolution",
  },
  {
    id: "initial",
    label: "Initial Conds",
    shortLabel: "x̂₀ P₀",
    step: "Adv",
    hint: "Advanced — initial conditions",
  },
  {
    id: "convergence",
    label: "Conv. Race",
    shortLabel: "Race",
    step: "Adv",
    hint: "P₀ convergence speed",
  },
  {
    id: "scenarios",
    label: "Scenarios",
    shortLabel: "Scenarios",
    step: "Adv",
    hint: "Compare x̂₀ / P₀ presets",
  },
];

const TAB_TO_CONCEPT = {
  overview: "signal",
  stateSpace: "signal",
  noiseless: "noise",
  forced: "forced",
  riccati: "riccati",
  obs: "obs",
  gain: "riccati",
  initial: "signal",
  convergence: "riccati",
  scenarios: "signal",
};

export function TopicLearningPanel() {
  const {
    generateECG,
    activeLearningTab,
    setActiveLearningTab,
    setActiveConcept,
  } = useContext(SimulationContext);
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

  const selectTab = (id) => {
    setActiveLearningTab(id);
    if (TAB_TO_CONCEPT[id]) setActiveConcept(TAB_TO_CONCEPT[id]);
  };

  if (!generateECG) {
    return (
      <p className={styles.panelHint} style={{ padding: 16 }}>
        Generate an ECG signal (Step 1, left panel) to open the learning tabs.
      </p>
    );
  }

  const activeTab = activeLearningTab || "overview";

  return (
    <section className={styles.kalmanTabsRoot} aria-label="Kalman topic learning">
      <nav className={styles.tabBar} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => selectTab(tab.id)}
            title={tab.hint}
          >
            <span className={styles.tabStepBadge}>{tab.step}</span>
            {tab.shortLabel}
          </button>
        ))}
      </nav>

      <div className={styles.tabContent} role="tabpanel">
        {activeTab === "overview" && <SignalOverviewPanel {...panelProps} />}
        {activeTab === "stateSpace" && <StateSpacePanel {...panelProps} />}
        {activeTab === "noiseless" && <NoiseProcessView />}
        {activeTab === "forced" && <ForcedUnforcedView />}
        {activeTab === "riccati" && <RiccatiView />}
        {activeTab === "obs" && <ObservabilityView />}
        {activeTab === "gain" && <GainInspectorPanel {...panelProps} />}
        {activeTab === "initial" && <InitialConditionsPanel {...panelProps} />}
        {activeTab === "convergence" && <ConvergenceRacePanel {...panelProps} />}
        {activeTab === "scenarios" && <ComparisonPanel {...panelProps} />}
      </div>
    </section>
  );
}
