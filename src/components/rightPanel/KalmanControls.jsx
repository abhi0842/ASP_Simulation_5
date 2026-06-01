import { useContext, useEffect } from "react";
import { usePipelineSync } from "../../hooks/usePipelineSync";
import { SimulationContext } from "../../context/SimulationContext";
import { estimateRFromNoise } from "../../utils/kalmanScenarios";
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
    kalmanParams,
    setKalmanParams,
    setLastKalmanSlider,
    unforcedMode,
    noiselessMode,
    setUnforcedMode,
    setNoiselessMode,
    forcedInputU,
    setForcedInputU,
    forcedInputMode,
    setForcedInputMode,
    forcedAmplitude,
    setForcedAmplitude,
    forcedFrequency,
    setForcedFrequency,
  } = useContext(SimulationContext);

  const { R, fsKalman, Q_diag } = kalmanParams;

  // Sync pipeline whenever relevant state changes
  usePipelineSync();

  const update = (patch) => setKalmanParams((p) => ({ ...p, ...patch }));

  // Auto-estimate R when noise type changes
  useEffect(() => {
    if (!applyNoiseTrigger) return;
    const estimated = estimateRFromNoise(noise);
    setKalmanParams((p) => ({ ...p, R: estimated }));
  }, [applyNoiseTrigger, noise, setKalmanParams]);

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

  return (
    <div className={styles.box}>
      <h3 className={styles.sectionHeading}>Model Assumptions</h3>

      {/* ── STEP 2: Confirm the dynamic model ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="2"
          title="Set the Dynamic Model"
          subtitle="Choose unforced vs forced dynamics (for comparison panels)."
        />

        <div className={styles.modelToggleRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={unforcedMode}
              className={styles.toggleCheck}
              onChange={(e) => setUnforcedMode(e.target.checked)}
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
              className={styles.toggleCheck}
              onChange={(e) => setNoiselessMode(e.target.checked)}
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

        <label className={styles.fieldLabel}>Forced input uₖ shape</label>
        <select value={forcedInputMode} onChange={(e) => setForcedInputMode(e.target.value)}>
          <option value="constant">Constant</option>
          <option value="sinusoidal">Sinusoidal</option>
        </select>

        <label className={styles.sliderBlock} title="Constant u (when mode is constant)">
          <span className={styles.sliderHeader}>
            u — constant control
            <span className={styles.valueBadge}>{forcedInputU.toFixed(2)}</span>
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min={-1}
            max={1}
            step={0.01}
            value={forcedInputU}
            onChange={(e) => setForcedInputU(Number(e.target.value))}
          />
        </label>

        <label className={styles.sliderBlock}>
          <span className={styles.sliderHeader}>
            u amplitude (sinusoidal)
            <span className={styles.valueBadge}>{forcedAmplitude.toFixed(2)}</span>
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min={0}
            max={0.5}
            step={0.01}
            value={forcedAmplitude}
            onChange={(e) => setForcedAmplitude(Number(e.target.value))}
          />
        </label>

        <label className={styles.sliderBlock}>
          <span className={styles.sliderHeader}>
            u frequency (Hz)
            <span className={styles.valueBadge}>{forcedFrequency.toFixed(1)}</span>
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min={0.1}
            max={3}
            step={0.1}
            value={forcedFrequency}
            onChange={(e) => setForcedFrequency(Number(e.target.value))}
          />
        </label>

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

      {/* ── STEP 3: Process & measurement noise ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="3"
          title="Process & Measurement Noise"
          subtitle="Q and R — compare noiseless (Q = 0) vs noisy process in lab modules."
        />

        <label
          className={styles.sliderBlock}
          style={{ opacity: noiselessMode ? 0.5 : 1 }}
          title="Process noise Q (disabled when noiseless mode is on)"
        >
          <span className={styles.sliderHeader}>
            Q — process noise
            <span className={styles.valueBadge}>{noiselessMode ? "0" : Q_diag.toFixed(4)}</span>
          </span>
          <input
            type="range"
            className={styles.rangeSlider}
            min="0.0001"
            max="0.05"
            step="0.0001"
            value={noiselessMode ? 0.0001 : Q_diag}
            disabled={noiselessMode}
            onChange={(e) => {
              setLastKalmanSlider("Q");
              update({ Q_diag: Number(e.target.value) });
            }}
          />
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
        </label>
      </div>

      {/* ── STEP 4: Observability (H matrix) ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="4"
          title="Observability (H matrix)"
          subtitle="Open Observability tab → compare H = [1,0] vs H = [0,1]"
        />
        <ObservabilityStepControls />
      </div>
    </div>
  );
}

function ObservabilityStepControls() {
  const { observabilityMode, setObservabilityMode } = useContext(SimulationContext);
  return (
    <>
      <label className={styles.toggleLabel}>
        <input
          type="radio"
          name="obsH"
          checked={observabilityMode === "observable"}
          onChange={() => setObservabilityMode("observable")}
        />
        H = [1, 0] — measure position (observable)
      </label>
      <label className={styles.toggleLabel}>
        <input
          type="radio"
          name="obsH"
          checked={observabilityMode === "non-observable"}
          onChange={() => setObservabilityMode("non-observable")}
        />
        H = [0, 1] — slope only (not observable)
      </label>
    </>
  );
}
