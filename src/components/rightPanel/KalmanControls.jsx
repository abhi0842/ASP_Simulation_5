import { useContext, useEffect, useMemo, useState } from "react";
import { usePipelineSync } from "../../hooks/usePipelineSync";
import { SimulationContext } from "../../context/SimulationContext";
import {
  p0ConfidenceLabel,
  x0ColorIndicator,
} from "../../utils/kalman";
import { alphaToSlider, sliderToAlpha } from "../../utils/kalmanSliderUtils";
import {
  getScenarioPreset,
  SCENARIO_MESSAGES,
  estimateRFromNoise,
} from "../../utils/kalmanScenarios";
import styles from "./rightPanel.module.css";

const FS_OPTIONS = [100, 250, 500];

/* ──────────────────────────────────────────
   Small helper: a numbered step header
────────────────────────────────────────── */
function StepHeader({ number, title, subtitle }) {
  return (
    <div className={styles.stepHeader}>
      <span className={styles.stepBadge}>{number}</span>
      <div>
        <p className={styles.stepTitle}>{title}</p>
        {subtitle && <p className={styles.stepSub}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main controls
────────────────────────────────────────── */
export function KalmanControls() {
  const {
    generateECG,
    applyNoiseTrigger,
    noise,
    cleanSignal,
    rawSamples,
    kalmanParams,
    setKalmanParams,
    setLastKalmanSlider,
    unforcedMode,
    noiselessMode,
    initialConditions,
    setInitialConditions,
  } = useContext(SimulationContext);

  const [activeScenario, setActiveScenario] = useState(null);
  const { x0hat, P0_alpha, Q_diag, R, fsKalman } = kalmanParams;

  // Sync pipeline whenever relevant state changes
  usePipelineSync();

  // Keep kalmanParams in sync with initialConditions
  useEffect(() => {
    setInitialConditions((prev) => ({
      ...prev,
      x0hat: kalmanParams.x0hat,
      P0_diag: kalmanParams.P0_alpha,
    }));
  }, [kalmanParams.x0hat, kalmanParams.P0_alpha, setInitialConditions]);

  const trueFirstSample = useMemo(() => {
    if (cleanSignal.length) return cleanSignal[0];
    if (rawSamples.length) return rawSamples[0].y;
    return 0;
  }, [cleanSignal, rawSamples]);

  const update = (patch) => setKalmanParams((p) => ({ ...p, ...patch }));

  // Auto-estimate R when noise type changes
  useEffect(() => {
    if (!applyNoiseTrigger) return;
    const estimated = estimateRFromNoise(noise);
    setKalmanParams((p) => ({ ...p, R: estimated }));
  }, [applyNoiseTrigger, noise, setKalmanParams]);

  const applyScenario = (key) => {
    const preset = getScenarioPreset(key, trueFirstSample);
    if (!preset) return;
    setKalmanParams((p) => ({ ...p, ...preset }));
    setActiveScenario(key);
  };

  if (!generateECG) {
    return (
      <div className={styles.box}>
        <div className={styles.stepHeader}>
          <span className={styles.stepBadge}>→</span>
          <div>
            <p className={styles.stepTitle}>Kalman Filter Controls</p>
            <p className={styles.stepSub}>Generate an ECG signal first (Step 1 above)</p>
          </div>
        </div>
      </div>
    );
  }

  const scenarioMsg = activeScenario ? SCENARIO_MESSAGES[activeScenario] : null;

  return (
    <div className={styles.box}>
      <h3 className={styles.sectionHeading}>Kalman Filter — Step-by-Step Setup</h3>

      {/* ── STEP 2: Confirm the dynamic model ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="2"
          title="Set the Dynamic Model"
          subtitle="This simulation uses an UNFORCED model: x̂⁻ = A x̂ (no external control input)"
        />

        <div className={styles.modelToggleRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={unforcedMode}
              disabled
              className={styles.toggleCheck}
            />
            <span className={styles.toggleText}>
              Unforced Mode
              <code className={styles.toggleFormula}> x̂⁻ = A x̂</code>
            </span>
            <span className={unforcedMode ? styles.modelBadgeOn : styles.modelBadgeOff}>
              {unforcedMode ? "ON" : "OFF"}
            </span>
          </label>

          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={noiselessMode}
              disabled
              className={styles.toggleCheck}
            />
            <span className={styles.toggleText}>
              Noiseless Mode
              <code className={styles.toggleFormula}> Q = 0</code>
            </span>
            <span className={noiselessMode ? styles.modelBadgeOn : styles.modelBadgeOff}>
              {noiselessMode ? "ON" : "OFF"}
            </span>
          </label>
        </div>

        {/* Inline explanation of what the current model means */}
        <div className={styles.modelExplainBox}>
          {unforcedMode && noiselessMode && (
            <p className={styles.modelExplainText}>
              <strong>Full Topic 2B mode active.</strong> The filter predicts
              using only <code>A</code> with zero process noise. Prediction
              accuracy depends entirely on how close x̂₀ and P₀ are to reality.
            </p>
          )}
          {unforcedMode && !noiselessMode && (
            <p className={styles.modelExplainText}>
              Unforced dynamics active — no control input. Process noise Q
              still allows the model to adapt. Enable Noiseless Mode to see
              the pure initial-condition effect.
            </p>
          )}
          {!unforcedMode && (
            <p className={styles.modelExplainText} style={{ color: "#b05000" }}>
              Unforced mode is off. For Topic 2B, keep it ON so predictions
              use only <code>x̂⁻ = A x̂</code>.
            </p>
          )}
        </div>

        <label className={styles.sliderBlock}>
          <span className={styles.sliderHeader}>
            F-matrix sampling rate
            <span className={styles.valueBadge}>dt = {(1 / fsKalman).toFixed(4)} s</span>
          </span>
          <select
            value={fsKalman}
            onChange={(e) => update({ fsKalman: Number(e.target.value) })}
          >
            {FS_OPTIONS.map((hz) => (
              <option key={hz} value={hz}>
                {hz} Hz
              </option>
            ))}
          </select>
          <p className={styles.sliderSubtext}>
            A = [[1, dt], [0, 1]] — amplitude + slope state
          </p>
        </label>
      </div>

      {/* ── STEP 3: Set initial conditions ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="3"
          title="Set Initial Conditions (x̂₀ and P₀)"
          subtitle="These are your best guess before seeing any ECG data. Try different values — watch the charts respond."
        />

        <label
          className={styles.sliderBlock}
          title="Your initial guess of the ECG amplitude before seeing any data"
        >
          <span className={styles.sliderHeader}>
            x̂₀ — initial state guess
            <span className={styles.valueBadge}>{x0hat.toFixed(2)} mV</span>
            <span
              className={styles.colorDot}
              style={{ background: x0ColorIndicator(x0hat, trueFirstSample) }}
              title={
                Math.abs(x0hat - trueFirstSample) < 0.1
                  ? "Close to true value — fast convergence"
                  : Math.abs(x0hat - trueFirstSample) < 0.5
                  ? "Moderate offset — some transient"
                  : "Far from true value — slow start"
              }
            />
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min="-1.5"
            max="1.5"
            step="0.01"
            value={x0hat}
            onChange={(e) => update({ x0hat: Number(e.target.value) })}
          />
          <p className={styles.sliderSubtext}>
            {Math.abs(x0hat - trueFirstSample) < 0.1
              ? "Accurate guess → filter starts well"
              : Math.abs(x0hat - trueFirstSample) < 0.5
              ? "Moderate offset → short transient in filtered signal"
              : "Large offset → noticeable error at the start of filtering"}
          </p>
        </label>

        <label
          className={styles.sliderBlock}
          title="How certain are you about your initial guess? Small P₀ = very confident. Large P₀ = very uncertain."
        >
          <span className={styles.sliderHeader}>
            P₀ — initial uncertainty (αI)
            <span className={styles.valueBadge}>{P0_alpha.toFixed(4)}</span>
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min="0"
            max="100"
            step="0.1"
            value={alphaToSlider(P0_alpha)}
            onChange={(e) =>
              update({ P0_alpha: sliderToAlpha(e.target.value) })
            }
          />
          <p className={styles.sliderSubtext}>{p0ConfidenceLabel(P0_alpha)}</p>
        </label>

        <p className={styles.stepInsight}>
          <strong>Key insight:</strong> Large P₀ → filter trusts measurements
          quickly (fast recovery from bad x̂₀). Small P₀ → filter trusts its
          own prediction (slow recovery if x̂₀ is wrong).
        </p>
      </div>

      {/* ── STEP 4: Noise tuning (only relevant when noiseless is OFF) ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="4"
          title="Noise Parameters (Q and R)"
          subtitle={
            noiselessMode
              ? "Noiseless mode: Q is forced to 0. You can still tune R."
              : "Tune how much the filter trusts the model vs the measurements."
          }
        />

        <label
          className={styles.sliderBlock}
          style={{ opacity: noiselessMode ? 0.4 : 1 }}
          title="Process noise Q: how much the true signal changes unexpectedly each step"
        >
          <span className={styles.sliderHeader}>
            Q — process noise
            <span className={styles.valueBadge}>
              {noiselessMode ? "0 (forced)" : Q_diag.toFixed(4)}
            </span>
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min="0.0001"
            max="0.1"
            step="0.0001"
            value={Q_diag}
            disabled={noiselessMode}
            onChange={(e) => {
              setLastKalmanSlider("Q");
              update({ Q_diag: Number(e.target.value) });
            }}
          />
          <p className={styles.sliderSubtext}>
            {noiselessMode
              ? "Q = 0 → model is assumed perfectly predictable"
              : "Higher Q → filter expects more signal variation → trusts measurements more"}
          </p>
        </label>

        <label
          className={styles.sliderBlock}
          style={{ opacity: 1 }}
          title="Measurement noise R: how noisy is the ECG sensor?"
        >
          <span className={styles.sliderHeader}>
            R — measurement noise
            <span className={styles.valueBadge}>
              {R.toFixed(4)}
            </span>
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min="0.001"
            max="1"
            step="0.001"
            value={R}
            disabled={false}
            onChange={(e) => {
              setLastKalmanSlider("R");
              update({ R: Number(e.target.value) });
            }}
          />
          <p className={styles.sliderSubtext}>
            Higher R → filter trusts measurements less → more prediction error early,
            but smoother updates later.
          </p>
        </label>
      </div>

      {/* ── STEP 5: Scenario presets ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="5"
          title="Try Pre-set Scenarios"
          subtitle="Load a scenario to instantly see how different initial conditions affect the filtered signal in the charts below."
        />

        <div className={styles.scenarioGrid}>
          <button
            type="button"
            className={activeScenario === "A" ? styles.scenarioBtnActive : styles.scenarioBtn}
            onClick={() => applyScenario("A")}
            title="x̂₀ close to true signal, P₀ small"
          >
            <span className={styles.scenarioIcon}>✓</span>
            <span>Accurate + Confident</span>
          </button>
          <button
            type="button"
            className={activeScenario === "B" ? styles.scenarioBtnActive : styles.scenarioBtn}
            onClick={() => applyScenario("B")}
            title="x̂₀ far from true signal, P₀ small — dangerous combination"
          >
            <span className={styles.scenarioIcon}>✗</span>
            <span>Wrong + Confident</span>
          </button>
          <button
            type="button"
            className={activeScenario === "C" ? styles.scenarioBtnActive : styles.scenarioBtn}
            onClick={() => applyScenario("C")}
            title="x̂₀ far from true signal, P₀ large — filter corrects itself"
          >
            <span className={styles.scenarioIcon}>↗</span>
            <span>Wrong + Uncertain</span>
          </button>
          <button
            type="button"
            className={activeScenario === "D" ? styles.scenarioBtnActive : styles.scenarioBtn}
            onClick={() => applyScenario("D")}
            title="P₀ very large — maximally diffuse prior"
          >
            <span className={styles.scenarioIcon}>∞</span>
            <span>Diffuse Prior</span>
          </button>
        </div>

        {scenarioMsg && (
          <p
            className={`${styles.scenarioNote} ${styles[`scenario_${scenarioMsg.tone}`]}`}
          >
            {scenarioMsg.text}
          </p>
        )}

        <p className={styles.stepInsight}>
          After loading a scenario, check the <strong>Initial Conditions ★</strong> tab
          (below) for RMSE and covariance charts.
        </p>
      </div>
    </div>
  );
}
