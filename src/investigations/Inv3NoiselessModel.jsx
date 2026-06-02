import { useMemo } from "react";
import { useInvestigationKalman } from "../hooks/useInvestigationKalman";
import { LabLineChart } from "../components/lab/LabLineChart";
import { EqBanner } from "./shared/EqBanner";
import { DynamicInsight } from "./shared/DynamicInsight";
import s from "./shared/invShared.module.css";

export function Inv3NoiselessModel({ onComplete }) {
  const { times, truth, measurements, noiseless, hasData } = useInvestigationKalman();

  const data = useMemo(() => {
    if (!noiseless) return [];
    const n = Math.min(times.length, 350);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      truth: truth[i],
      z: measurements[i],
      pred: noiseless.xPred_trace[i],
      est: noiseless.xFiltered[i],
      P: noiseless.P_trace[i],
      K: noiseless.K_trace[i],
      err: Math.abs(noiseless.xFiltered[i] - truth[i]),
    }));
  }, [noiseless, times, truth, measurements]);

  if (!hasData) return <p className={s.metric}>Load ECG first.</p>;

  return (
    <div className={s.root}>
      <EqBanner>{"P⁻(k) = A P(k−1) Aᵀ   [Q = 0,  w(k) = 0]"}</EqBanner>
      <DynamicInsight text="Without process noise, covariance shrinks deterministically. The model trusts itself completely." />
      <div className={s.grid2}>
        <div className={s.chart}>
          <LabLineChart data={data} lines={[
            { key: "truth", name: "True", color: "#888780", dash: "4 4" },
            { key: "pred", name: "Predicted", color: "#ba7517", dash: "4 4" },
            { key: "est", name: "Estimated", color: "#1d7480" },
          ]} />
        </div>
        <div className={s.chart}>
          <LabLineChart data={data} lines={[
            { key: "P", name: "Pₖ", color: "#1d7480" },
            { key: "K", name: "Kₖ", color: "#378add" },
          ]} />
        </div>
      </div>
      <div className={s.chart}>
        <LabLineChart data={data} lines={[{ key: "err", name: "|error|", color: "#e24b4a" }]} />
      </div>
      <button type="button" className={s.completeBtn} onClick={onComplete}>Mark investigation complete →</button>
    </div>
  );
}
