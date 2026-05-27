import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "./kalman.module.css";

/**
 * Visual summary of Topic 2B: unforced dynamic model + noiseless state-space,
 * and why initial conditions (x̂₀, P₀) are required.
 */
export function TopicConceptDiagram() {
  const { unforcedMode, noiselessMode, kalmanParams } = useContext(SimulationContext);
  const { x0hat, P0_alpha } = kalmanParams;

  return (
    <section className={styles.conceptRoot} aria-label="Topic concept overview">
      <h2 className={styles.conceptMainTitle}>
        Kalman Filter — Unforced Dynamic Model &amp; Noiseless State-Space
      </h2>
      <p className={styles.conceptLead}>
        This simulation isolates how your <strong>starting guess</strong> and{" "}
        <strong>starting confidence</strong> shape prediction before the filter has
        seen enough data.
      </p>

      <div className={styles.conceptGrid}>
        <article className={styles.conceptCard}>
          <h3>Unforced model</h3>
          <div className={styles.conceptEquation}>x̂⁻<sub>k+1</sub> = A x̂<sub>k</sub></div>
          <p>No control input <em>u</em>. The ECG evolves only by its own dynamics (matrix A).</p>
          <span className={unforcedMode ? styles.conceptBadgeOn : styles.conceptBadgeOff}>
            {unforcedMode ? "Active" : "Off"}
          </span>
        </article>

        <article className={styles.conceptCard}>
          <h3>Noiseless state-space</h3>
          <div className={styles.conceptEquation}>Q = 0</div>
          <p>
            No process noise in the model. Uncertainty enters only through P₀ and
            measurement trust R — so early steps are dominated by initial conditions.
          </p>
          <span className={noiselessMode ? styles.conceptBadgeOn : styles.conceptBadgeOff}>
            {noiselessMode ? "Q = 0 locked" : "Off"}
          </span>
        </article>

        <article className={`${styles.conceptCard} ${styles.conceptCardHighlight}`}>
          <h3>Why initial conditions?</h3>
          <p>
            Before any measurement arrives, the filter only knows x̂₀ and P₀. They set
            the first Kalman gain K₁ = P₀/(P₀+R) and the first prediction x̂⁻.
          </p>
          <ul className={styles.conceptList}>
            <li>
              <strong>x̂₀</strong> = {x0hat.toFixed(3)} mV — your amplitude guess at t=0
            </li>
            <li>
              <strong>P₀</strong> = {P0_alpha.toFixed(3)} — how much you trust that guess
            </li>
          </ul>
          <p className={styles.conceptYes}>
            Yes — initial conditions are <strong>required</strong> here: without them the
            filter has no starting state or covariance.
          </p>
        </article>
      </div>

      <div className={styles.conceptFlow}>
        <span className={styles.conceptFlowNode}>x̂₀, P₀</span>
        <span className={styles.conceptFlowArrow}>→</span>
        <span className={styles.conceptFlowNode}>Predict x̂⁻ = Ax̂</span>
        <span className={styles.conceptFlowArrow}>→</span>
        <span className={styles.conceptFlowNode}>Gain K = P/(P+R)</span>
        <span className={styles.conceptFlowArrow}>→</span>
        <span className={styles.conceptFlowNode}>Update x̂</span>
      </div>
    </section>
  );
}
