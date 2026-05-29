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
  } = useContext(SimulationContext);

  const { R, fsKalman } = kalmanParams;

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

        <label className={styles.sliderBlock} title="Forced input u (for forced-system comparison panels)">
          <span className={styles.sliderHeader}>
            u — control input (for forced comparison)
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

      {/* ── STEP 3: Measurement noise ── */}
      <div className={styles.stepBlock}>
        <StepHeader
          number="3"
          title="Measurement Noise"
          subtitle="R controls how much the filter trusts measurements."
        />

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
    </div>
  );
}
