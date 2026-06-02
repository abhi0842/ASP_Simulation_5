import { useContext, useMemo } from "react";
import { SimulationContext } from "../context/SimulationContext";
import { useInvestigationKalman } from "../hooks/useInvestigationKalman";
import { LabLineChart } from "../components/lab/LabLineChart";
import { EqBanner } from "./shared/EqBanner";
import { DynamicInsight } from "./shared/DynamicInsight";
import { InvPlayback } from "./shared/InvPlayback";
import s from "./shared/invShared.module.css";

export function Inv2ForcedComparison({ onComplete }) {
  const { playbackIndex } = useContext(SimulationContext);
  const { times, measurements, noiseless, forced, hasData, rmsForcedDiff } = useInvestigationKalman();
  const k = playbackIndex;

  const { left, right, diff } = useMemo(() => {
    if (!noiseless || !forced) return { left: [], right: [], diff: [] };
    const n = Math.min(k + 1, times.length);
    const left = [];
    const right = [];
    const diff = [];
    for (let i = 0; i < n; i++) {
      left.push({ t: times[i], z: measurements[i], est: noiseless.xFiltered[i], err: Math.abs(noiseless.xFiltered[i] - measurements[i]) });
      right.push({ t: times[i], z: measurements[i], est: forced.xFiltered[i], err: Math.abs(forced.xFiltered[i] - measurements[i]) });
      diff.push({ t: times[i], d: forced.xFiltered[i] - noiseless.xFiltered[i] });
    }
    return { left, right, diff };
  }, [noiseless, forced, times, measurements, k]);

  if (!hasData) return <p className={s.metric}>Load ECG first.</p>;

  return (
    <div className={s.root}>
      <EqBanner>{"Left:  x̂⁻ = A x̂(k−1)\nRight: x̂⁻ = A x̂(k−1) + B u(k)   [synthetic u(k)]"}</EqBanner>
      <DynamicInsight text="Forcing has shifted the prediction trajectory. The unforced system relies only on its own state history." />
      <InvPlayback maxSteps={times.length} />
      <div className={s.grid2}>
        <div>
          <p className={s.colTitle}>Unforced (u = 0)</p>
          <div className={s.chart}>
            <LabLineChart data={left} lines={[
              { key: "z", name: "ECG", color: "#888780", dash: "4 4" },
              { key: "est", name: "Estimate", color: "#1d7480" },
            ]} />
          </div>
        </div>
        <div>
          <p className={s.colTitle}>Forced (u ≠ 0)</p>
          <div className={s.chart}>
            <LabLineChart data={right} lines={[
              { key: "z", name: "ECG", color: "#888780", dash: "4 4" },
              { key: "est", name: "Estimate", color: "#e24b4a" },
            ]} />
          </div>
        </div>
      </div>
      <div className={s.chart}>
        <LabLineChart data={diff} lines={[{ key: "d", name: "Forced − Unforced", color: "#7f77dd" }]} />
      </div>
      <p className={s.metric}>RMS difference: <strong>{rmsForcedDiff.toFixed(5)}</strong></p>
      <button type="button" className={s.completeBtn} onClick={onComplete}>Mark investigation complete →</button>
    </div>
  );
}
