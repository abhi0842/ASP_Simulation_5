import { useContext, useEffect } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "./rightPanel.module.css";
import Swal from "sweetalert2";
import { KalmanControls } from "./KalmanControls.jsx";

export const RightPanel = () => {
  const {
    time,
    setTime,
    originalFs,
    setGenerateECG,
    setApplyNoiseTrigger,
    noise,
    setNoise,
    csvFilePath,
    prevPathRef,
    setCsvFilePath,
    generateECG,
    applyNoiseTrigger,
    noiselessMode,
    setApplypsdTrigger,
    setActiveLearningTab,
  } = useContext(SimulationContext);

  const runPsd = () => {
    if (!generateECG) {
      Swal.fire({ icon: "info", title: "Oops...", text: "Please generate ECG signal first!" });
      return;
    }
    if (!applyNoiseTrigger) {
      Swal.fire({
        icon: "info",
        title: "Add noise first",
        text: "Apply noise to the signal before computing PSD.",
      });
      return;
    }
    setApplypsdTrigger(true);
  };

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const assetPath = (name) => normalizedBase + name;

  const noiseTrigger = () => {
    if (!generateECG) {
      Swal.fire({ icon: "info", title: "Oops...", text: "Please generate ECG signal first!" });
      return;
    }
    if (!noise.baseline && !noise.powerline && !noise.emg) {
      Swal.fire({ icon: "info", title: "Oops...", text: "Please select at least one noise type!" });
      return;
    }
    setApplyNoiseTrigger(true);
  };

  useEffect(() => {
    if (prevPathRef.current !== csvFilePath) {
      setApplyNoiseTrigger(false);
      setApplypsdTrigger(false);
      prevPathRef.current = csvFilePath;
    }
  }, [csvFilePath, prevPathRef, setApplyNoiseTrigger, setApplypsdTrigger]);

  useEffect(() => {
    if (!noiselessMode) return;
    setApplyNoiseTrigger(false);
    setApplypsdTrigger(false);
  }, [noiselessMode, setApplyNoiseTrigger, setApplypsdTrigger]);

  return (
    <div className={styles.rightPanelContainer}>
      <div className={styles.right}>
        <h2 className={styles.rightPanelTitle}>Simulation Controls</h2>
        <p className={styles.infoLine} style={{ marginBottom: 8 }}>
          Topic: Unforced · Noiseless Q=0 · Follow steps 1→7, then open matching tabs →
        </p>

        <div className={styles.box}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>1</span>
            <div>
              <p className={styles.stepTitle}>Load ECG Signal</p>
              <p className={styles.stepSub}>Real ECG data for Kalman state estimation</p>
            </div>
          </div>

          <label className={styles.fieldLabel}>ECG Dataset</label>
          <select value={csvFilePath} onChange={(e) => setCsvFilePath(e.target.value)}>
            <option value={assetPath("ecg200.csv")}>ECG Dataset 1</option>
            <option value={assetPath("ecg300.csv")}>ECG Dataset 2</option>
            <option value={assetPath("ecg100.csv")}>ECG Dataset 3</option>
          </select>

          <label className={styles.fieldLabel}>
            Duration
            <span className={styles.fieldValue}>{time} seconds</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />

          <p className={styles.infoLine}>Sampling rate: {originalFs} Hz</p>

          <button
            type="button"
            className={generateECG ? styles.btnGenerated : styles.btnPrimary}
            onClick={() => {
              setGenerateECG(true);
              setActiveLearningTab("overview");
            }}
          >
            {generateECG ? "✓ ECG Signal Loaded" : "Generate ECG Signal"}
          </button>

          {generateECG && (
            <p className={styles.stepInsight}>
              ECG ready. Continue Steps 2–6 below, then explore the matching tabs in the output
              panel (right).
            </p>
          )}
        </div>

        {!noiselessMode && (
          <div className={styles.box}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadgeOptional}>opt</span>
              <div>
                <p className={styles.stepTitle}>Add Biomedical Noise</p>
                <p className={styles.stepSub}>Optional — creates noisy measurements zₖ</p>
              </div>
            </div>

            <label>
              <input
                type="checkbox"
                checked={noise.baseline}
                onChange={(e) => setNoise({ ...noise, baseline: e.target.checked })}
              />{" "}
              Baseline Wander
            </label>
            <label>
              <input
                type="checkbox"
                checked={noise.powerline}
                onChange={(e) => setNoise({ ...noise, powerline: e.target.checked })}
              />{" "}
              Powerline (50 Hz)
            </label>
            <label>
              <input
                type="checkbox"
                checked={noise.emg}
                onChange={(e) => setNoise({ ...noise, emg: e.target.checked })}
              />{" "}
              EMG Noise
            </label>

            <div className={styles.buttonContainer}>
              <button
                type="button"
                className={applyNoiseTrigger ? styles.btnGenerated : styles.btnSecondary}
                onClick={noiseTrigger}
              >
                {applyNoiseTrigger ? "✓ Noise Applied" : "Add Noise to Signal"}
              </button>
            </div>
          </div>
        )}

        <KalmanControls />

        {!noiselessMode && (
          <div className={styles.box}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadgeOptional}>opt</span>
              <div>
                <p className={styles.stepTitle}>PSD Analysis</p>
                <p className={styles.stepSub}>Spectrum of noisy ECG</p>
              </div>
            </div>
            <button type="button" className={styles.btnSecondary} onClick={runPsd}>
              Compute PSD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
