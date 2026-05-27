import styles from "./instruction.module.css";

/**
 * "How to Use" panel — Topic 2B
 *
 * Learning objective:
 *   Understand how the unforced state-space model (x̂⁻ = Ax̂) combined with
 *   the noiseless assumption (Q = 0) makes the Kalman filter's prediction
 *   accuracy depend ENTIRELY on the initial conditions x̂₀ and P₀.
 */
export const Instruction = () => {
  return (
    <div className={styles.box}>
      <div className={styles.container}>

        {/* ── Title ── */}
        <div className={styles.card}>
          <h1>How to Use This Simulation</h1>
          <p>
            <b>Topic 2B:</b> Kalman Filter with an <b>Unforced Dynamic Model</b> and{" "}
            <b>Noiseless State-Space</b> using ECG signals.
          </p>
          <p>
            Follow the numbered steps on the right panel. Each step connects to
            a tab in the learning panel below the ECG charts.
          </p>
        </div>

        {/* ── Step 1 ── */}
        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 1 — Load ECG Signal</p>
          <p>
            Select an ECG dataset and click <b>Generate ECG Signal</b>. The raw
            ECG appears in the left panel. This is the ground truth the Kalman
            filter must track.
          </p>
        </div>

        {/* ── Optional noise ── */}
        <div className={styles.card}>
          <p className={styles.stepLabel}>Measurements are Kept Clean</p>
          <p>
            For Topic 2B, the focus is the <b>noiseless state-space model</b>.
            Therefore, measurement corruption (noise injection) is disabled.
            You still control the filter’s trust level using the <b>R</b>
            slider, and you can observe how prediction depends on <b>x̂₀</b>{' '}
            and <b>P₀</b>.
          </p>
        </div>

        {/* ── Step 2 ── */}
        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 2 — Set the Dynamic Model</p>
          <p>
            Topic 2B is locked to <b>Unforced Mode</b>: the system evolves as{" "}
            <code>x̂⁻ = A x̂</code> with no external control input. This models
            ECG as autonomous cardiac dynamics.
          </p>
          <p>
            Topic 2B is locked to <b>Noiseless Mode</b>: sets <b>Q = 0</b>{" "}
            (no process noise). Accuracy is now driven by how your initial
            guess <b>x̂₀</b> and uncertainty <b>P₀</b> shape the Kalman gain and
            the one-step-ahead prediction <b>x̂⁻</b>.
          </p>
          <p>
            Then open the <b>Step 2 — Unforced Model</b> tab to visualise the
            F matrix and the predict step.
          </p>
        </div>

        {/* ── Step 3 ── */}
        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 3 — Set Initial Conditions (key experiment)</p>
          <p>
            Slide <b>x̂₀</b> to change your initial amplitude guess. A colored
            dot shows how close you are to the true ECG value.
          </p>
          <p>
            Slide <b>P₀</b> to set how confident you are:
          </p>
          <ul>
            <li><b>Small P₀</b> — very confident in x̂₀. If x̂₀ is wrong, the filter ignores early measurements → high early RMSE.</li>
            <li><b>Large P₀</b> — uncertain about x̂₀. Filter trusts measurements quickly → fast self-correction.</li>
          </ul>
          <p>
            Open the <b>Step 3 — Initial Conditions ★</b> tab to see RMSE,
            covariance trace, and Kalman gain in real time.
          </p>
          <p>
            Open the <b>Step 3b — Convergence Race</b> tab to animate how
            three different P₀ values race toward steady state.
          </p>
        </div>

        {/* ── Step 4 ── */}
        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 4 — Noise Parameters (Q and R)</p>
          <p>
            In Noiseless Mode, Q is forced to 0 — the filter becomes purely
            driven by autonomous dynamics. You can still tune <b>R</b> to
            control how much the filter trusts the measurements. Open the
            <b>Step 4 — Gain Inspector</b> tab to see how
            the Kalman gain K_k decays from the P₀-determined starting value.
          </p>
        </div>

        {/* ── Step 5 ── */}
        <div className={styles.card}>
          <p className={styles.stepLabel}>Step 5 — Compare Scenarios</p>
          <p>
            Use the four preset buttons to quickly load different combinations
            of x̂₀ and P₀:
          </p>
          <ul>
            <li><b>✓ Accurate + Confident</b> — best case (low early RMSE)</li>
            <li><b>✗ Wrong + Confident</b> — worst case (filter is blind to its own error)</li>
            <li><b>↗ Wrong + Uncertain</b> — self-correcting (large P₀ saves it)</li>
            <li><b>∞ Diffuse Prior</b> — filter converges from scratch</li>
          </ul>
          <p>
            Open the <b>Step 5 — Scenario Comparison</b> tab to see all four
            filtered signals overlaid and their RMSE table.
          </p>
        </div>

        {/* ── What to observe ── */}
        <div className={styles.card}>
          <p className={styles.stepLabel}>What to observe</p>
          <ul>
            <li>In <b>noiseless mode</b>, the covariance P_k collapses to 0 almost immediately — predictions become deterministic, driven only by A and x̂₀.</li>
            <li>A wrong x̂₀ with small P₀ causes a visible error spike at the start of the filtered signal.</li>
            <li>A wrong x̂₀ with large P₀ is automatically corrected within a few ECG samples.</li>
            <li>Late RMSE is almost always the same regardless of x̂₀ — it is determined by Q and R, not initial conditions.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};
