import { ModuleShell } from "../../components/lab/ModuleShell.jsx";
import { TheoryCard } from "../../components/lab/TheoryCard.jsx";
import { EquationBlock } from "../../components/lab/EquationBlock.jsx";
import { CollapsibleTheory } from "../../components/lab/CollapsibleTheory.jsx";
import { SystemDiagram } from "../../components/lab/SystemDiagram.jsx";
import lab from "../../components/lab/lab.module.css";

const WILL_LEARN = [
  "Prediction vs correction (x̂⁻ then x̂)",
  "State estimation from noisy measurements",
  "Covariance convergence and Riccati recursion",
  "Observability of a 2-state system",
  "Steady-state Kalman gain K∞",
];

export function TopicIntroModule() {
  return (
    <ModuleShell
      title="Topic Introduction — Unforced & Noiseless Kalman Filtering"
      objectives={[
        <li key="1">Define unforced dynamics and noiseless process models (Q = 0)</li>,
        <li key="2">State the prediction and correction equations</li>,
        <li key="3">Explain why covariance convergence matters for filter confidence</li>,
        <li key="4">Preview observability and steady-state behavior</li>,
      ]}
      theory={
        <>
          <CollapsibleTheory title="Theory — Kalman filter basics" defaultOpen>
            <TheoryCard title="What is a Kalman Filter?">
              <p>
                A recursive Bayesian estimator: predict with the model, correct with
                measurements, weighted by Kalman gain Kₖ from covariance Pₖ.
              </p>
            </TheoryCard>
            <TheoryCard title="Unforced dynamic model">
              <EquationBlock>xₖ₊₁ = A xₖ</EquationBlock>
              <p>No control input uₖ — state evolves from internal dynamics only.</p>
            </TheoryCard>
            <TheoryCard title="Noiseless process model">
              <EquationBlock>
                {`zₖ = H xₖ + vₖ
Q = 0  →  no process noise injected in prediction`}
              </EquationBlock>
              <p>
                When Q = 0, uncertainty enters through initialization P₀ and
                measurement noise R — not through the state transition.
              </p>
            </TheoryCard>
          </CollapsibleTheory>

          <CollapsibleTheory title="Key assumptions (this lab)" defaultOpen={false}>
            <ul className={lab.learnList}>
              <li>Linear 2-state model (position + rate)</li>
              <li>Scalar measurement zₖ = H xₖ + vₖ</li>
              <li>Gaussian noise; Kalman filter is optimal</li>
              <li>Topic focus: unforced + Q = 0 comparison with forced / Q &gt; 0</li>
            </ul>
          </CollapsibleTheory>

          <div className={lab.section}>
            <h4>System diagram</h4>
            <SystemDiagram />
          </div>

          <div className={lab.section}>
            <h4>What students will learn</h4>
            <ul className={lab.learnList}>
              {WILL_LEARN.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <CollapsibleTheory title="Prediction & correction cycle" defaultOpen={false}>
            <EquationBlock>
              {`Prediction:   x̂ₖ⁻ = A x̂ₖ₋₁     Pₖ⁻ = A Pₖ₋₁ Aᵀ + Q
Update:       Kₖ = Pₖ⁻ Hᵀ (H Pₖ⁻ Hᵀ + R)⁻¹
              x̂ₖ = x̂ₖ⁻ + Kₖ (zₖ − H x̂ₖ⁻)
              Pₖ = (I − Kₖ H) Pₖ⁻`}
            </EquationBlock>
          </CollapsibleTheory>
        </>
      }
      experiment={
        <p>
          Load an ECG (Step 1, left) or enable synthetic signal, then open{" "}
          <strong>Forced vs Unforced</strong> and <strong>Q = 0 vs Q &gt; 0</strong>.
        </p>
      }
      visualization={
        <p className={lab.eq}>
          Use the module tabs above to run side-by-side comparisons. Theory drives each chart.
        </p>
      }
      takeaways="This virtual lab isolates estimation theory: unforced dynamics and Q = 0 reveal how A, H, R, and Riccati convergence shape the filter — not generic signal playback."
    />
  );
}
