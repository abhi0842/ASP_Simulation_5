import { useMemo } from "react";
import { useInvestigationKalman } from "../hooks/useInvestigationKalman";
import { LabLineChart } from "../components/lab/LabLineChart";
import { EqBanner } from "./shared/EqBanner";
import { DynamicInsight } from "./shared/DynamicInsight";
import s from "./shared/invShared.module.css";

function insightForQ(q) {
  if (q <= 0) return "Noiseless. Covariance is stable.";
  if (q <= 0.01) return "Small noise introduced. Gain begins adapting.";
  if (q <= 0.1) return "Process noise is dominating. Covariance grows.";
  return "Model no longer trusts itself. Filter relies on measurements heavily.";
}

export function Inv4ProcessNoise({ onComplete }) {
  const { times, qPair, hasData, labQInject } = useInvestigationKalman();

  const { left, right, diff } = useMemo(() => {
    if (!qPair) return { left: [], right: [], diff: [] };
    const n = Math.min(times.length, 300);
    const left = [];
    const right = [];
    const diff = [];
    for (let i = 0; i < n; i++) {
      left.push({ t: times[i], est: qPair.noiseless.xFiltered[i], P: qPair.noiseless.P_trace[i], K: qPair.noiseless.K_trace[i] });
      right.push({ t: times[i], est: qPair.noisy.xFiltered[i], P: qPair.noisy.P_trace[i], K: qPair.noisy.K_trace[i] });
      diff.push({ t: times[i], d: qPair.noisy.xFiltered[i] - qPair.noiseless.xFiltered[i] });
    }
    return { left, right, diff };
  }, [qPair, times]);

  if (!hasData) return <p className={s.metric}>Load ECG first.</p>;

  return (
    <div className={s.root}>
      <EqBanner>{"Baseline: Q = 0  |  Comparison: Q = slider value"}</EqBanner>
      <DynamicInsight text={insightForQ(labQInject)} />
      <div className={s.grid2}>
        <div>
          <p className={s.colTitle}>Q = 0</p>
          <div className={s.chart}>
            <LabLineChart data={left} lines={[
              { key: "est", name: "State", color: "#1d7480" },
              { key: "P", name: "Pₖ", color: "#7f77dd", dash: "4 4" },
            ]} />
          </div>
        </div>
        <div>
          <p className={s.colTitle}>Q = {labQInject.toFixed(2)}</p>
          <div className={s.chart}>
            <LabLineChart data={right} lines={[
              { key: "est", name: "State", color: "#e24b4a" },
              { key: "P", name: "Pₖ", color: "#ba7517", dash: "4 4" },
            ]} />
          </div>
        </div>
      </div>
      <div className={s.chart}>
        <LabLineChart data={diff} lines={[{ key: "d", name: "Trajectory difference", color: "#7f77dd" }]} />
      </div>
      <div className={s.grid2}>
        <div className={s.chart}>
          <LabLineChart data={left} lines={[{ key: "K", name: "K (Q=0)", color: "#1d7480" }]} />
        </div>
        <div className={s.chart}>
          <LabLineChart data={right} lines={[{ key: "K", name: "K (Q>0)", color: "#e24b4a" }]} />
        </div>
      </div>
      <button type="button" className={s.completeBtn} onClick={onComplete}>Mark investigation complete →</button>
    </div>
  );
}
