import styles from "./instruction.module.css";

export const Instruction = () => {
  return (
    <div className={styles.box}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>How to Use This Simulation</h1>
          <p>
            <b>Topic:</b> Kalman Filter with an <b>Unforced Dynamic Model</b> and{" "}
            <b>Noiseless State-Space Model</b> (Q = 0).
          </p>
          <p>
            Follow numbered steps on the <b>input panel (left)</b>. Each step maps to a tab in the{" "}
            <b>output panel (right)</b>.
          </p>
        </div>

        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 1 — Load ECG</p>
          <p>Generate ECG, then use playback to step through predict → correct.</p>
        </div>

        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 2 — Unforced model</p>
          <p>
            Keep <b>Unforced</b> and <b>Noiseless (Q=0)</b> on. Open <b>Unforced</b> tab — see{" "}
            x̂⁻ = A x̂.
          </p>
        </div>

        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 3 — Q and R</p>
          <p>
            Toggle noiseless off and increase Q. Open <b>Q=0 vs Q&gt;0</b> tab — watch Pₖ and
            estimates diverge.
          </p>
        </div>

        <div className={styles.card}>
          <p className={styles.stepLabel}>Steps 4–6 — Topic experiments</p>
          <ul>
            <li><b>Forced vs Unforced</b> — external input uₖ</li>
            <li><b>Riccati / P∞</b> — covariance convergence</li>
            <li><b>Observability</b> — H matrix and rank test</li>
          </ul>
        </div>

        <div className={styles.card}>
          <p className={styles.stepLabel}>Advanced tabs</p>
          <p>
            Initial conditions, convergence race, and scenario comparison — explore how x̂₀ and P₀
            affect early samples (especially visible when Q = 0).
          </p>
        </div>
      </div>
    </div>
  );
};
