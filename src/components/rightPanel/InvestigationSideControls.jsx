import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { usePipelineSync } from "../../hooks/usePipelineSync";
import styles from "./rightPanel.module.css";
import inv from "../../investigations/shared/invShared.module.css";

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

export function InvestigationSideControls() {
  const {
    generateECG,
    activeInvestigation,
    kalmanParams,
    setKalmanParams,
    labQInject,
    setLabQInject,
    observabilityLabMode,
    setObservabilityLabMode,
    forcedAmplitude,
    setForcedAmplitude,
    forcedFrequency,
    setForcedFrequency,
    noiselessMode,
    setNoiselessMode,
  } = useContext(SimulationContext);

  usePipelineSync();

  if (!generateECG) {
    return (
      <div className={styles.box}>
        <StepHeader number="→" title="Investigation controls" subtitle="Generate ECG in Step 1 first" />
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <h3 className={styles.sectionHeading}>Active investigation controls</h3>

      {activeInvestigation === 1 && (
        <>
          <StepHeader number="2" title="Forced input u(k)" subtitle="Sinusoidal forcing for comparison panel" />
          <label className={inv.sliderRow}>
            <span>u amplitude</span>
            <span>{forcedAmplitude.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={forcedAmplitude}
            onChange={(e) => setForcedAmplitude(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <label className={inv.sliderRow}>
            <span>u frequency (Hz)</span>
            <span>{forcedFrequency.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={forcedFrequency}
            onChange={(e) => setForcedFrequency(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </>
      )}

      {activeInvestigation === 3 && (
        <>
          <StepHeader number="4" title="Inject process noise Q" subtitle="Baseline stays Q = 0 in left panel" />
          <label className={inv.sliderRow}>
            <span>Q (comparison)</span>
            <span>{labQInject.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={labQInject}
            onChange={(e) => setLabQInject(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </>
      )}

      {activeInvestigation === 4 && (
        <>
          <StepHeader number="5" title="Measurement noise R" subtitle="Affects steady-state P∞" />
          <label className={inv.sliderRow}>
            <span>R</span>
            <span>{kalmanParams.R.toFixed(4)}</span>
          </label>
          <input
            type="range"
            min={0.001}
            max={0.3}
            step={0.001}
            value={kalmanParams.R}
            onChange={(e) => setKalmanParams((p) => ({ ...p, R: Number(e.target.value) }))}
            style={{ width: "100%" }}
          />
        </>
      )}

      {activeInvestigation === 5 && (
        <>
          <StepHeader number="6" title="Observability mode" subtitle="H matrix for ECG measurement" />
          {[
            { id: "full", label: "Fully observable" },
            { id: "partial", label: "Partially observable" },
            { id: "unobservable", label: "Unobservable" },
          ].map((m) => (
            <label key={m.id} className={styles.toggleLabel} style={{ display: "block", marginBottom: 6 }}>
              <input
                type="radio"
                name="obsLab"
                checked={observabilityLabMode === m.id}
                onChange={() => setObservabilityLabMode(m.id)}
              />{" "}
              {m.label}
            </label>
          ))}
        </>
      )}

      {(activeInvestigation === 0 || activeInvestigation === 2) && (
        <>
          <StepHeader
            number="·"
            title="Topic locked"
            subtitle="u(k)=0, Q=0 for this investigation"
          />
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={noiselessMode} readOnly disabled />
            Noiseless process (Q = 0)
          </label>
          <p className={styles.infoLine}>Unforced dynamics — no control input</p>
        </>
      )}

      {activeInvestigation > 5 && null}
    </div>
  );
}
