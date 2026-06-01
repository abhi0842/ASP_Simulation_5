import { useMemo, useState, useEffect } from "react";
import { useLabKalman } from "../../hooks/useLabKalman.js";
import { ModuleShell } from "../../components/lab/ModuleShell.jsx";
import { TheoryCard } from "../../components/lab/TheoryCard.jsx";
import { EquationBlock } from "../../components/lab/EquationBlock.jsx";
import { MatrixDisplay } from "../../components/lab/MatrixDisplay.jsx";
import { ComparisonPanel } from "../../components/lab/ComparisonPanel.jsx";
import { CollapsibleTheory } from "../../components/lab/CollapsibleTheory.jsx";
import { LabLineChart } from "../../components/lab/LabLineChart.jsx";
import { errorNormSeries } from "../../utils/educationalKalman";
import lab from "../../components/lab/lab.module.css";

export function ForcedVsUnforcedModule() {
  const { hasData, openLoop, times, truth, pair, unforcedMode, F } = useLabKalman();
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(300);

  const fullData = useMemo(() => {
    if (!hasData) return [];
    const n = Math.min(openLoop.unforced.length, openLoop.forced.length, times.length, 400);
    const est = pair?.noiseless?.xFiltered ?? [];
    return Array.from({ length: n }, (_, i) => ({
      t: times[i] ?? i,
      truth: truth[i],
      unforced: openLoop.unforced[i],
      forced: openLoop.forced[i],
      est: est[i],
      errU: Math.abs((openLoop.unforced[i] ?? 0) - (truth[i] ?? 0)),
      errF: Math.abs((openLoop.forced[i] ?? 0) - (truth[i] ?? 0)),
    }));
  }, [hasData, openLoop, times, truth, pair]);

  const errNorm = useMemo(() => {
    if (!pair?.noiseless?.xFiltered) return [];
    return errorNormSeries(pair.noiseless.xFiltered, truth);
  }, [pair, truth]);

  useEffect(() => {
    if (!playing || !fullData.length) return;
    const id = setInterval(() => {
      setFrame((f) => (f >= fullData.length - 1 ? 0 : f + 2));
    }, 80);
    return () => clearInterval(id);
  }, [playing, fullData.length]);

  const viewData = fullData.slice(0, Math.max(20, frame));

  if (!hasData) {
    return <p className={lab.eq}>Generate ECG or enable synthetic signal, then return here.</p>;
  }

  const leftChart = (
    <div className={lab.chart}>
      <LabLineChart
        data={viewData}
        lines={[
          { key: "truth", name: "True x₁", color: "#888780", dash: "4 4" },
          { key: "unforced", name: "A xₖ", color: "#1d7480" },
        ]}
      />
    </div>
  );

  const rightChart = (
    <div className={lab.chart}>
      <LabLineChart
        data={viewData}
        lines={[
          { key: "truth", name: "True x₁", color: "#888780", dash: "4 4" },
          { key: "forced", name: "A x + B u", color: "#e24b4a" },
        ]}
      />
    </div>
  );

  return (
    <ModuleShell
      title="Forced vs Unforced Dynamics"
      objectives={[
        <li key="1">Compare xₖ₊₁ = A xₖ vs xₖ₊₁ = A xₖ + B uₖ</li>,
        <li key="2">See prediction drift when forcing is applied</li>,
        <li key="3">Relate open-loop paths to Kalman estimation error</li>,
      ]}
      theory={
        <CollapsibleTheory title="Mathematical model" defaultOpen>
          <ComparisonPanel
            leftTitle="Unforced"
            rightTitle="Forced"
            left={
              <>
                <EquationBlock>xₖ₊₁ = A xₖ</EquationBlock>
                <p>Unforced systems evolve only from internal dynamics.</p>
              </>
            }
            right={
              <>
                <EquationBlock>xₖ₊₁ = A xₖ + B uₖ</EquationBlock>
                <p>Forced systems respond to external inputs.</p>
              </>
            }
          />
          <MatrixDisplay label="A matrix" matrix={F} />
          <MatrixDisplay label="B matrix" matrix={[1, 0]} />
          <p className={lab.takeaway}>
            This topic focuses on unforced systems to isolate estimator behavior from control effects.
          </p>
        </CollapsibleTheory>
      }
      experiment={
        <>
          <div className={lab.playRow}>
            <button type="button" className={lab.navBtn} onClick={() => setPlaying((p) => !p)}>
              {playing ? "Pause" : "Play"} trajectory comparison
            </button>
            <span style={{ fontSize: "0.72rem", color: "#666" }}>
              Filter: {unforcedMode ? "unforced" : "forced"} — adjust u in left controls
            </span>
          </div>
        </>
      }
      visualization={
        <>
          <ComparisonPanel
            leftTitle="LEFT: xₖ₊₁ = A xₖ"
            rightTitle="RIGHT: xₖ₊₁ = A xₖ + B uₖ"
            left={leftChart}
            right={rightChart}
          />
          <div className={lab.chart}>
            <LabLineChart
              data={viewData.map((d, i) => ({ ...d, errN: errNorm[i] }))}
              title="Open-loop error |x − x_true| (unforced vs forced)"
              lines={[
                { key: "errU", name: "Unforced error", color: "#1d7480" },
                { key: "errF", name: "Forced error", color: "#e24b4a" },
              ]}
            />
          </div>
        </>
      }
      takeaways="Removing uₖ isolates how the Kalman filter responds to dynamics and measurements alone — the pedagogical core of this noiseless unforced model."
    />
  );
}
