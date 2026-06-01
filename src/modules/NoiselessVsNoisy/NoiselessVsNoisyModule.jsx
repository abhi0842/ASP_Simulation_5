import { useMemo } from "react";
import { useLabKalman } from "../../hooks/useLabKalman.js";
import { ModuleShell } from "../../components/lab/ModuleShell.jsx";
import { TheoryCard } from "../../components/lab/TheoryCard.jsx";
import { EquationBlock } from "../../components/lab/EquationBlock.jsx";
import { ComparisonPanel } from "../../components/lab/ComparisonPanel.jsx";
import { CollapsibleTheory } from "../../components/lab/CollapsibleTheory.jsx";
import { LabLineChart } from "../../components/lab/LabLineChart.jsx";
import { errorNormSeries } from "../../utils/educationalKalman";
import lab from "../../components/lab/lab.module.css";

export function NoiselessVsNoisyModule() {
  const { hasData, pair, times, truth, Q_compare } = useLabKalman();

  const charts = useMemo(() => {
    if (!hasData || !pair) return null;
    const n = Math.min(
      times.length,
      pair.noiseless.xFiltered.length,
      pair.noisy.xFiltered.length,
      300
    );
    const state = [];
    const P = [];
    const K = [];
    const err = [];
    for (let i = 0; i < n; i++) {
      state.push({
        t: times[i],
        truth: truth[i],
        q0: pair.noiseless.xFiltered[i],
        qn: pair.noisy.xFiltered[i],
      });
      P.push({
        t: times[i],
        q0: pair.noiseless.P_trace[i],
        qn: pair.noisy.P_trace[i],
        det0: pair.noiseless.P_det_trace?.[i] ?? 0,
        detn: pair.noisy.P_det_trace?.[i] ?? 0,
      });
      K.push({
        t: times[i],
        q0: pair.noiseless.K_trace[i],
        qn: pair.noisy.K_trace[i],
      });
      err.push({
        t: times[i],
        q0: Math.abs(pair.noiseless.xFiltered[i] - truth[i]),
        qn: Math.abs(pair.noisy.xFiltered[i] - truth[i]),
        norm0: errorNormSeries(pair.noiseless.xFiltered, truth)[i],
        normn: errorNormSeries(pair.noisy.xFiltered, truth)[i],
      });
    }
    return { state, P, K, err };
  }, [hasData, pair, times, truth]);

  if (!charts) {
    return <p className={lab.eq}>Load a signal, then compare Q = 0 vs Q &gt; 0 here.</p>;
  }

  return (
    <ModuleShell
      title="Noiseless vs Noisy Process Model"
      objectives={[
        <li key="1">Compare Q = 0 (noiseless) vs Q &gt; 0 side-by-side</li>,
        <li key="2">Track trace(Pₖ), det(Pₖ), and Kₖ convergence</li>,
        <li key="3">Relate process noise to estimation error norm</li>,
      ]}
      theory={
        <CollapsibleTheory title="Theory" defaultOpen>
          <TheoryCard title="Highlighted">
            <EquationBlock>
              When Q = 0, uncertainty enters only through measurements and initialization.
            </EquationBlock>
            <p>
              Q &gt; 0 injects uncertainty each prediction step — slower covariance collapse and
              different steady-state gain. Comparison Q = {Q_compare} (sliders on left panel).
            </p>
          </TheoryCard>
        </CollapsibleTheory>
      }
      experiment={
        <p>
          Toggle <strong>Noiseless process (Q = 0)</strong> or move the <strong>Q</strong> slider in
          simulation controls. Watch synchronized panels below.
        </p>
      }
      visualization={
        <>
          <ComparisonPanel
            leftTitle="LEFT: Q = 0 (noiseless)"
            rightTitle="RIGHT: Q &gt; 0 (noisy process)"
            left={
              <div className={lab.chart}>
                <LabLineChart
                  data={charts.state}
                  lines={[
                    { key: "truth", name: "Truth", color: "#888780", dash: "4 4" },
                    { key: "q0", name: "Estimate", color: "#1d7480" },
                  ]}
                />
              </div>
            }
            right={
              <div className={lab.chart}>
                <LabLineChart
                  data={charts.state}
                  lines={[
                    { key: "truth", name: "Truth", color: "#888780", dash: "4 4" },
                    { key: "qn", name: "Estimate", color: "#e24b4a" },
                  ]}
                />
              </div>
            }
          />
          <div className={lab.grid2}>
            <div className={lab.chart}>
              <LabLineChart
                data={charts.P}
                title="trace(Pₖ)"
                lines={[
                  { key: "q0", name: "Q=0", color: "#1d7480" },
                  { key: "qn", name: "Q>0", color: "#e24b4a" },
                ]}
              />
            </div>
            <div className={lab.chart}>
              <LabLineChart
                data={charts.P}
                title="det(Pₖ)"
                lines={[
                  { key: "det0", name: "det Q=0", color: "#1d7480" },
                  { key: "detn", name: "det Q>0", color: "#e24b4a" },
                ]}
              />
            </div>
            <div className={lab.chart}>
              <LabLineChart
                data={charts.K}
                title="Kalman gain ‖Kₖ‖"
                lines={[
                  { key: "q0", name: "Q=0", color: "#1d7480" },
                  { key: "qn", name: "Q>0", color: "#e24b4a" },
                ]}
              />
            </div>
            <div className={lab.chart}>
              <LabLineChart
                data={charts.err}
                title="Estimation error norm (RMS)"
                lines={[
                  { key: "norm0", name: "Q=0", color: "#1d7480" },
                  { key: "normn", name: "Q>0", color: "#e24b4a" },
                ]}
              />
            </div>
          </div>
        </>
      }
      takeaways="Noiseless models (Q = 0) often show faster covariance collapse and a distinct gain transient — the special case this topic emphasizes."
    />
  );
}
