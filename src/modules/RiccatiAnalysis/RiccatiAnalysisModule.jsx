import { useMemo, useState, useEffect } from "react";
import { useLabKalman } from "../../hooks/useLabKalman.js";
import { ModuleShell } from "../../components/lab/ModuleShell.jsx";
import { TheoryCard } from "../../components/lab/TheoryCard.jsx";
import { EquationBlock } from "../../components/lab/EquationBlock.jsx";
import { ConvergenceIndicator } from "../../components/lab/ConvergenceIndicator.jsx";
import { CovarianceHeatmap } from "../../components/lab/CovarianceHeatmap.jsx";
import { CollapsibleTheory } from "../../components/lab/CollapsibleTheory.jsx";
import { LabLineChart } from "../../components/lab/LabLineChart.jsx";
import lab from "../../components/lab/lab.module.css";

export function RiccatiAnalysisModule() {
  const { hasData, pair, tripleQ, steadyIdx, times } = useLabKalman();
  const [heatIdx, setHeatIdx] = useState(0);
  const [animating, setAnimating] = useState(true);

  const Pchart = useMemo(() => {
    if (!hasData || !tripleQ.length) return [];
    const n = Math.min(times.length, tripleQ[0].result.P_trace.length, 300);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      q0: tripleQ[0].result.P_trace[i],
      q001: tripleQ[1].result.P_trace[i],
      q01: tripleQ[2].result.P_trace[i],
      k0: tripleQ[0].result.K_trace[i],
      det0: tripleQ[0].result.P_det_trace?.[i],
    }));
  }, [hasData, tripleQ, times]);

  const matrices = pair?.noiseless?.P_matrix_trace ?? [];
  const m = matrices[heatIdx] ?? matrices.at(-1) ?? { p00: 0, p01: 0, p10: 0, p11: 0 };

  useEffect(() => {
    if (!animating || matrices.length < 2) return;
    const id = setInterval(() => {
      setHeatIdx((i) => (i >= matrices.length - 1 ? 0 : i + 3));
    }, 120);
    return () => clearInterval(id);
  }, [animating, matrices.length]);

  if (!hasData) return <p className={lab.eq}>Load signal to analyze Riccati convergence.</p>;

  return (
    <ModuleShell
      title="Riccati Equation & Steady-State Covariance"
      objectives={[
        <li key="1">Understand discrete Riccati covariance recursion</li>,
        <li key="2">Watch Pₖ approach steady state P∞ (fixed point)</li>,
        <li key="3">Relate converged P to steady-state Kalman gain</li>,
      ]}
      theory={
        <CollapsibleTheory title="Discrete Riccati & steady state" defaultOpen>
          <TheoryCard title="Covariance recursion">
            <EquationBlock>
              {`Pₖ₊₁ = A Pₖ Aᵀ − A Pₖ Hᵀ (H Pₖ Hᵀ + R)⁻¹ H Pₖ Aᵀ + Q

Steady state: P∞ = f(P∞)  (algebraic Riccati equation)`}
            </EquationBlock>
          </TheoryCard>
          <TheoryCard title="Why P shrinks">
            <p>
              Each measurement update reduces uncertainty. With Q = 0, process inflation is absent —
              covariance often converges faster and Kₖ stabilizes.
            </p>
          </TheoryCard>
          <ConvergenceIndicator steadyIdx={steadyIdx} P_inf={pair?.P_inf_noiseless} />
        </CollapsibleTheory>
      }
      experiment={
        <div className={lab.playRow}>
          <button type="button" className={lab.navBtn} onClick={() => setAnimating((a) => !a)}>
            {animating ? "Pause" : "Play"} covariance heatmap
          </button>
          <span style={{ fontSize: "0.72rem" }}>Step k = {heatIdx}</span>
        </div>
      }
      visualization={
        <div className={lab.grid2}>
          <div>
            <p style={{ fontSize: "0.72rem", margin: "0 0 4px" }}>Pₖ matrix heatmap (Q = 0 run)</p>
            <CovarianceHeatmap p00={m.p00} p01={m.p01} p10={m.p10} p11={m.p11} />
          </div>
          <div className={lab.chart}>
            <LabLineChart
              data={Pchart}
              title="trace(Pₖ) — Q sweep"
              lines={[
                { key: "q0", name: "Q=0", color: "#1d7480" },
                { key: "q001", name: "Q=0.001", color: "#7f77dd" },
                { key: "q01", name: "Q=0.01", color: "#e24b4a" },
              ]}
            />
          </div>
          <div className={lab.chart}>
            <LabLineChart
              data={Pchart}
              title="Steady-state Kalman gain (Q = 0)"
              lines={[{ key: "k0", name: "‖Kₖ‖", color: "#378add" }]}
            />
          </div>
          <div className={lab.chart}>
            <LabLineChart
              data={Pchart}
              title="det(Pₖ) — Q = 0"
              lines={[{ key: "det0", name: "det P", color: "#1d7480" }]}
            />
          </div>
        </div>
      }
      takeaways="Riccati recursion governs filter confidence: when Q = 0, Pₖ often reaches P∞ quickly — watch the indicator and heatmap for fixed-point convergence."
    />
  );
}
