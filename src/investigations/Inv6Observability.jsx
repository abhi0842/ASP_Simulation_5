import { useMemo } from "react";
import { useInvestigationKalman } from "../hooks/useInvestigationKalman";
import { LabLineChart } from "../components/lab/LabLineChart";
import { EqBanner } from "./shared/EqBanner";
import { DynamicInsight } from "./shared/DynamicInsight";
import s from "./shared/invShared.module.css";

const INSIGHTS = {
  full: "All states are observable. Full reconstruction possible.",
  partial: "One state is hidden. Estimation of that state degrades.",
  unobservable: "System is unobservable. Kalman gain cannot correct what it cannot see.",
};

export function Inv6Observability({ onComplete }) {
  const { times, truth, measurements, obsFilter, rank, observable, observabilityLabMode, O, hasData } =
    useInvestigationKalman();

  const data = useMemo(() => {
    if (!obsFilter) return [];
    const n = Math.min(times.length, 300);
    return Array.from({ length: n }, (_, i) => {
      const st = obsFilter.xStates[i] ?? [0, 0];
      return {
        t: times[i],
        z: measurements[i],
        truth: truth[i],
        x1: st[0],
        x2: st[1],
        err1: Math.abs(st[0] - truth[i]),
        err2: Math.abs(st[1]),
      };
    });
  }, [obsFilter, times, truth, measurements]);

  if (!hasData) return <p className={s.metric}>Load ECG first.</p>;

  const hiddenStyle = observabilityLabMode === "partial";

  return (
    <div className={s.root}>
      <EqBanner>{"O = [ H ; H A ]     rank(O) = " + rank + " / 2"}</EqBanner>
      <DynamicInsight text={INSIGHTS[observabilityLabMode] ?? INSIGHTS.full} />
      <span className={observable ? s.rankOk : s.rankBad}>
        {observable ? "Observable" : "NOT observable"}
      </span>
      <p className={s.metric}>
        O = [ [{O[0][0].toFixed(2)}, {O[0][1].toFixed(2)}] ; [{O[1][0].toFixed(4)}, {O[1][1].toFixed(4)}] ]
      </p>
      <div className={s.chart}>
        <LabLineChart
          data={data}
          lines={[
            { key: "z", name: "ECG z", color: "#888780", dash: "4 4" },
            { key: "x1", name: "x̂₁ (position)", color: "#1d7480" },
            { key: "x2", name: "x̂₂ (velocity)", color: hiddenStyle ? "#ba7517" : "#7f77dd", dash: hiddenStyle ? "4 4" : undefined },
          ]}
        />
      </div>
      <div className={s.chart}>
        <LabLineChart
          data={data}
          lines={[
            { key: "err1", name: "Error x₁", color: "#1d7480" },
            { key: "err2", name: "Error x₂", color: "#e24b4a", dash: "4 4" },
          ]}
        />
      </div>
      <button type="button" className={s.completeBtn} onClick={onComplete}>Mark investigation complete →</button>
    </div>
  );
}
