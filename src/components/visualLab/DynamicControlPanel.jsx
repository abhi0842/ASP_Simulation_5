import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { usePipelineSync } from "../../hooks/usePipelineSync";
import { buildFMatrix } from "../../utils/kalman";
import { buildBMatrix } from "../../utils/educationalKalman";
import { MatrixDisplay } from "../lab/MatrixDisplay.jsx";
import styles from "./visualLab.module.css";
import rp from "../rightPanel/rightPanel.module.css";

function Slider({ label, value, min, max, step, onChange, disabled }) {
  return (
    <div className={styles.sliderRow}>
      <label>
        <span>{label}</span>
        <span>{typeof value === "number" ? value.toFixed(4) : value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function SignalControls() {
  const {
    time,
    setTime,
    originalFs,
    setGenerateECG,
    generateECG,
    csvFilePath,
    setCsvFilePath,
    noise,
    setNoise,
    setApplyNoiseTrigger,
    applyNoiseTrigger,
    kalmanParams,
    setKalmanParams,
  } = useContext(SimulationContext);

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const assetPath = (name) => normalizedBase + name;

  return (
    <div className={styles.controlGroup}>
      <h3>Load ECG signal</h3>
      <label className={rp.fieldLabel}>Dataset</label>
      <select value={csvFilePath} onChange={(e) => setCsvFilePath(e.target.value)}>
        <option value={assetPath("ecg200.csv")}>ECG Dataset 1</option>
        <option value={assetPath("ecg300.csv")}>ECG Dataset 2</option>
        <option value={assetPath("ecg100.csv")}>ECG Dataset 3</option>
      </select>
      <Slider label="Duration (s)" value={time} min={1} max={30} step={1} onChange={setTime} />
      <p className={styles.hint}>Sample rate: {originalFs} Hz</p>
      <button
        type="button"
        className={generateECG ? rp.btnGenerated : styles.btnPrimary}
        onClick={() => setGenerateECG(true)}
      >
        {generateECG ? "✓ Signal ready" : "Generate ECG"}
      </button>
      <details style={{ marginTop: 8 }}>
        <summary className={styles.hint} style={{ cursor: "pointer", fontWeight: 600 }}>
          Add measurement noise
        </summary>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={noise.baseline}
            onChange={(e) => setNoise({ ...noise, baseline: e.target.checked })}
          />
          Baseline wander
        </label>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={noise.emg}
            onChange={(e) => setNoise({ ...noise, emg: e.target.checked })}
          />
          EMG noise
        </label>
        <button type="button" className={styles.btnSecondary} onClick={() => setApplyNoiseTrigger(true)}>
          Apply noise
        </button>
        {applyNoiseTrigger && <p className={styles.hint}>Noise applied to measurements</p>}
      </details>
      <Slider
        label="R — trust in measurements"
        value={kalmanParams.R}
        min={0.001}
        max={0.3}
        step={0.001}
        onChange={(v) => setKalmanParams((p) => ({ ...p, R: v }))}
      />
    </div>
  );
}

function ForcedControls() {
  const {
    unforcedMode,
    setUnforcedMode,
    forcedInputMode,
    setForcedInputMode,
    forcedAmplitude,
    setForcedAmplitude,
    forcedFrequency,
    setForcedFrequency,
    forcedInputU,
    setForcedInputU,
    kalmanParams,
  } = useContext(SimulationContext);
  const dt = 1 / kalmanParams.fsKalman;
  const F = buildFMatrix(dt);
  const B = buildBMatrix();

  return (
    <div className={styles.controlGroup}>
      <h3>Dynamics</h3>
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={!unforcedMode}
          onChange={(e) => setUnforcedMode(!e.target.checked)}
        />
        Apply external input uₖ
      </label>
      <select value={forcedInputMode} onChange={(e) => setForcedInputMode(e.target.value)}>
        <option value="sinusoidal">Sinusoidal u</option>
        <option value="constant">Constant u</option>
      </select>
      <Slider label="u amplitude" value={forcedAmplitude} min={0} max={0.5} step={0.01} onChange={setForcedAmplitude} />
      <Slider label="u frequency (Hz)" value={forcedFrequency} min={0.1} max={3} step={0.1} onChange={setForcedFrequency} />
      {forcedInputMode === "constant" && (
        <Slider label="u constant" value={forcedInputU} min={-1} max={1} step={0.05} onChange={setForcedInputU} />
      )}
      <MatrixDisplay label="A" matrix={F} />
      <MatrixDisplay label="B" matrix={B} />
    </div>
  );
}

function NoiseControls() {
  const { noiselessMode, setNoiselessMode, kalmanParams, setKalmanParams } = useContext(SimulationContext);
  const update = (patch) => setKalmanParams((p) => ({ ...p, ...patch }));

  return (
    <div className={styles.controlGroup}>
      <h3>Process & measurement noise</h3>
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={noiselessMode}
          onChange={(e) => setNoiselessMode(e.target.checked)}
        />
        Noiseless process (Q = 0)
      </label>
      <Slider
        label="Q — process noise"
        value={noiselessMode ? 0 : kalmanParams.Q_diag}
        min={0.0001}
        max={0.05}
        step={0.0001}
        disabled={noiselessMode}
        onChange={(v) => update({ Q_diag: v })}
      />
      <Slider label="R — measurement noise" value={kalmanParams.R} min={0.001} max={0.5} step={0.001} onChange={(v) => update({ R: v })} />
    </div>
  );
}

function RiccatiControls() {
  const { noiselessMode, setNoiselessMode, kalmanParams, setKalmanParams } = useContext(SimulationContext);
  return (
    <div className={styles.controlGroup}>
      <h3>Covariance settings</h3>
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={noiselessMode}
          onChange={(e) => setNoiselessMode(e.target.checked)}
        />
        Q = 0 (faster convergence)
      </label>
      <Slider
        label="R"
        value={kalmanParams.R}
        min={0.001}
        max={0.2}
        step={0.001}
        onChange={(v) => setKalmanParams((p) => ({ ...p, R: v }))}
      />
      <p className={styles.hint}>Watch Pₖ shrink and Kₖ stabilize in the graphs →</p>
    </div>
  );
}

function ObsControls() {
  const { setObservabilityMode, observabilityMode, kalmanParams, setKalmanParams } =
    useContext(SimulationContext);
  return (
    <div className={styles.controlGroup}>
      <h3>Measurement model H</h3>
      <button
        type="button"
        className={observabilityMode === "observable" ? styles.btnPrimary : styles.btnSecondary}
        onClick={() => setObservabilityMode("observable")}
      >
        Observable (H = [1,0])
      </button>
      <button
        type="button"
        className={observabilityMode === "non-observable" ? styles.btnPrimary : styles.btnSecondary}
        style={{ marginTop: 6 }}
        onClick={() => setObservabilityMode("non-observable")}
      >
        Not observable (H = [0,1])
      </button>
      <Slider
        label="Sample rate (sets A)"
        value={kalmanParams.fsKalman}
        min={100}
        max={500}
        step={50}
        onChange={(v) => setKalmanParams((p) => ({ ...p, fsKalman: v }))}
      />
    </div>
  );
}

export function DynamicControlPanel() {
  const { activeConcept } = useContext(SimulationContext);
  usePipelineSync();

  const panels = {
    signal: <SignalControls />,
    forced: <ForcedControls />,
    noise: <NoiseControls />,
    riccati: <RiccatiControls />,
    obs: <ObsControls />,
  };

  const titles = {
    signal: "Step 1: Load & filter ECG",
    forced: "Control input uₖ",
    noise: "Q and R",
    riccati: "Covariance tuning",
    obs: "Observability",
  };

  return (
    <div className={styles.controlShell}>
      <h2 className={rp.rightPanelTitle} style={{ margin: 0 }}>
        Controls
      </h2>
      <p className={styles.hint}>{titles[activeConcept]}</p>
      {panels[activeConcept]}
    </div>
  );
}
