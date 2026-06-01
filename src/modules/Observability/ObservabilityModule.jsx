import { useContext, useMemo } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { useLabKalman } from "../../hooks/useLabKalman.js";
import { ModuleShell } from "../../components/lab/ModuleShell.jsx";
import { TheoryCard } from "../../components/lab/TheoryCard.jsx";
import { EquationBlock } from "../../components/lab/EquationBlock.jsx";
import { MatrixDisplay } from "../../components/lab/MatrixDisplay.jsx";
import { ObservabilityBadge } from "../../components/lab/ObservabilityBadge.jsx";
import { ComparisonPanel } from "../../components/lab/ComparisonPanel.jsx";
import { CollapsibleTheory } from "../../components/lab/CollapsibleTheory.jsx";
import { LabLineChart } from "../../components/lab/LabLineChart.jsx";
import lab from "../../components/lab/lab.module.css";

export function ObservabilityModule() {
  const { setObservabilityMode, kalmanParams, setKalmanParams } = useContext(SimulationContext);
  const { hasData, F, H, observable, rank, times, truth, obsPair, O_matrix } = useLabKalman();

  const chartObs = useMemo(() => {
    if (!hasData || !obsPair) return [];
    const n = Math.min(250, times.length);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      truth: truth[i],
      est: obsPair.observable.xStates?.[i]?.[0] ?? obsPair.observable.xFiltered[i],
      slope: obsPair.observable.xStates?.[i]?.[1] ?? 0,
    }));
  }, [hasData, obsPair, times, truth]);

  const chartBad = useMemo(() => {
    if (!hasData || !obsPair) return [];
    const n = Math.min(250, times.length);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      truth: truth[i],
      est: obsPair.nonObservable.xStates?.[i]?.[0] ?? 0,
      slope: obsPair.nonObservable.xStates?.[i]?.[1] ?? 0,
    }));
  }, [hasData, obsPair, times, truth]);

  return (
    <ModuleShell
      title="Observability Analysis"
      objectives={[
        <li key="1">Build O = [H; HA] and compute rank</li>,
        <li key="2">Compare observable vs non-observable H side-by-side</li>,
        <li key="3">See failed reconstruction of hidden states</li>,
      ]}
      theory={
        <CollapsibleTheory title="Observability test" defaultOpen>
          <EquationBlock>O = [ H ; H A ] — rank(O) must equal n (here n = 2)</EquationBlock>
          <ObservabilityBadge observable={observable} rank={rank} n={2} />
          {!observable && (
            <div className={lab.warnBox} role="alert">
              System is NOT observable — rank(O) &lt; n. Some states cannot be estimated from zₖ
              alone.
            </div>
          )}
          <MatrixDisplay label="O matrix" matrix={O_matrix} />
          <MatrixDisplay label="A" matrix={F} />
          <MatrixDisplay label="H (active mode)" matrix={H} />
        </CollapsibleTheory>
      }
      experiment={
        <>
          <p style={{ fontSize: "0.78rem", marginBottom: 8 }}>
            Modify H (measurement model). A follows sampling interval dt = 1/fs from controls.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <button
              type="button"
              className={lab.navBtnActive}
              onClick={() => setObservabilityMode("observable")}
            >
              H = [1, 0] observable
            </button>
            <button
              type="button"
              className={lab.navBtn}
              onClick={() => setObservabilityMode("non-observable")}
            >
              H = [0, 1] rank deficient
            </button>
          </div>
          <label className={lab.sliderLabel}>
            Kalman sample rate (sets A[0,1] = dt): {kalmanParams.fsKalman} Hz
            <input
              type="range"
              min={100}
              max={500}
              step={50}
              value={kalmanParams.fsKalman}
              onChange={(e) =>
                setKalmanParams((p) => ({ ...p, fsKalman: Number(e.target.value) }))
              }
            />
          </label>
        </>
      }
      visualization={
        hasData && obsPair ? (
          <ComparisonPanel
            leftTitle="Observable: H = [1, 0]"
            rightTitle="Non-observable: H = [0, 1]"
            left={
              <div className={lab.chart}>
                <LabLineChart
                  data={chartObs}
                  lines={[
                    { key: "truth", name: "True position", color: "#888780", dash: "4 4" },
                    { key: "est", name: "x̂₁", color: "#1d7480" },
                    { key: "slope", name: "x̂₂ (hidden)", color: "#7f77dd", dash: "2 2" },
                  ]}
                />
              </div>
            }
            right={
              <div className={lab.chart}>
                <LabLineChart
                  data={chartBad}
                  lines={[
                    { key: "truth", name: "True position", color: "#888780", dash: "4 4" },
                    { key: "est", name: "x̂₁ drift", color: "#e24b4a" },
                    { key: "slope", name: "x̂₂", color: "#ba7517" },
                  ]}
                />
              </div>
            }
            footer="Kalman filtering requires observability to reconstruct all states from measurements over time."
          />
        ) : (
          <p>Load signal first.</p>
        )
      }
      takeaways={
        observable
          ? "Full-rank O: both states are inferable from the measurement sequence."
          : "Rank-deficient O: the filter cannot reliably estimate unmeasured states — estimates may diverge."
      }
    />
  );
}
