import styles from "./kalman.module.css";

const STEPS = [
  {
    id: "ic",
    title: "Initial conditions",
    body: "Set x̂₀ (guess) and P₀ (confidence). These are mandatory — the filter cannot start without them.",
    color: "#7F77DD",
  },
  {
    id: "pred",
    title: "Predict",
    body: "Unforced step: x̂⁻ = A x̂. Propagate state with no external input.",
    color: "#E8A838",
  },
  {
    id: "gain",
    title: "Gain",
    body: "K = P⁻/(P⁻+R). With Q=0, P collapses quickly; early K is set mainly by P₀.",
    color: "#9B59B6",
  },
  {
    id: "upd",
    title: "Update",
    body: "x̂ = x̂⁻ + K(z − x̂⁻). Blend prediction with the ECG measurement.",
    color: "#1d9e75",
  },
];

export function KalmanStepFlow() {
  return (
    <div className={styles.stepFlowRoot} aria-label="Kalman filter step flow">
      <h4 className={styles.stepFlowTitle}>One time-step at a glance</h4>
      <div className={styles.stepFlowRow}>
        {STEPS.map((step, i) => (
          <div key={step.id} className={styles.stepFlowItem}>
            <div
              className={styles.stepFlowCircle}
              style={{ borderColor: step.color, color: step.color }}
            >
              {i + 1}
            </div>
            <p className={styles.stepFlowItemTitle}>{step.title}</p>
            <p className={styles.stepFlowItemBody}>{step.body}</p>
            {i < STEPS.length - 1 && <span className={styles.stepFlowConnector} aria-hidden />}
          </div>
        ))}
      </div>
    </div>
  );
}
