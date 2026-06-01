import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "./rightPanel.module.css";
import { InvestigationSideControls } from "./InvestigationSideControls.jsx";

export const RightPanel = () => {
  const {
    time,
    setTime,
    originalFs,
    setGenerateECG,
    csvFilePath,
    setCsvFilePath,
    generateECG,
    setActiveInvestigation,
    setPlaybackIndex,
    setPlaybackPlaying,
    setNoiselessMode,
    setUnforcedMode,
  } = useContext(SimulationContext);

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const assetPath = (name) => normalizedBase + name;

  return (
    <div className={styles.rightPanelContainer}>
      <div className={styles.right}>
        <h2 className={styles.rightPanelTitle}>Simulation Controls</h2>
        <p className={styles.infoLine} style={{ marginBottom: 8 }}>
          u(k)=0 · w(k)=0 · ECG as z(k) — complete investigations 1→6 →
        </p>

        <div className={styles.box}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>1</span>
            <div>
              <p className={styles.stepTitle}>Load ECG Signal</p>
              <p className={styles.stepSub}>Measurement z(k) for all investigations</p>
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
              setNoiselessMode(true);
              setUnforcedMode(true);
              setActiveInvestigation(0);
              setPlaybackIndex(0);
              setPlaybackPlaying(false);
            }}
          >
            {generateECG ? "✓ ECG Signal Loaded" : "Generate ECG Signal"}
          </button>

          {generateECG && (
            <p className={styles.stepInsight}>
              Open investigation tabs on the right. Complete each to unlock the next.
            </p>
          )}
        </div>

        <InvestigationSideControls />
      </div>
    </div>
  );
};
