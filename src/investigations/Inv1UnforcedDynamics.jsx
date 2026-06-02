import { useContext, useMemo } from "react";
import { SimulationContext } from "../context/SimulationContext";
import { useInvestigationKalman } from "../hooks/useInvestigationKalman";
import { LabLineChart } from "../components/lab/LabLineChart";
import { EqBanner } from "./shared/EqBanner";
import { DynamicInsight } from "./shared/DynamicInsight";
import { InvPlayback } from "./shared/InvPlayback";
import s from "./shared/invShared.module.css";

export function Inv1UnforcedDynamics({ onComplete }) {
  const { playbackIndex } = useContext(SimulationContext);
  const { times, truth, measurements, noiseless, hasData } = useInvestigationKalman();
  const k = playbackIndex;

  const series = useMemo(() => {
    if (!noiseless || !hasData) return [];
    const n = Math.min(k + 1, times.length, noiseless.xStates.length);
    return Array.from({ length: n }, (_, i) => {
      const st = noiseless.xStates[i] ?? [0, 0];
      return {
        t: times[i],
        x1: st[0],
        x2: st[1],
        xpred: noiseless.xPred_trace[i],
        z: measurements[i],
        truth: truth[i],
      };
    });
  }, [noiseless, times, measurements, truth, k, hasData]);

  const phase = useMemo(() => {
    if (!noiseless?.xStates) return [];
    const n = Math.min(k + 1, noiseless.xStates.length);
    return Array.from({ length: n }, (_, i) => ({
      x1: noiseless.xStates[i][0],
      x2: noiseless.xStates[i][1],
    }));
  }, [noiseless, k]);

  if (!hasData) return <p className={s.metric}>Load ECG (Step 1) first.</p>;

  return (
    <div className={s.root}>
      <EqBanner>{"x̂⁻(k) = A · x̂(k−1)     [u(k) = 0]\nP⁻(k) = A P(k−1) Aᵀ   [Q = 0]"}</EqBanner>
      <DynamicInsight text="State evolution is generated entirely from the previous state. No external input exists." />
      <InvPlayback maxSteps={times.length} />
      <div className={s.chart}>
        <LabLineChart
          data={series}
          lines={[
            { key: "truth", name: "ECG z(k)", color: "#888780", dash: "4 4" },
            { key: "x1", name: "State x₁ (est.)", color: "#1d7480" },
            { key: "xpred", name: "Predicted x̂⁻", color: "#ba7517", dash: "4 4" },
          ]}
        />
      </div>
      <div className={s.chart}>
        <LabLineChart
          data={phase}
          xKey="x1"
          lines={[{ key: "x2", name: "x₂ vs x₁ path", color: "#378add" }]}
        />
      </div>
      <button type="button" className={s.completeBtn} onClick={onComplete}>
        Mark investigation complete →
      </button>
    </div>
  );
}
