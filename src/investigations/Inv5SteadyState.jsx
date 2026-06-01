import { useMemo } from "react";
import { useInvestigationKalman } from "../hooks/useInvestigationKalman";
import { LabLineChart } from "../components/lab/LabLineChart";
import { EqBanner } from "./shared/EqBanner";
import { DynamicInsight } from "./shared/DynamicInsight";
import s from "./shared/invShared.module.css";

export function Inv5SteadyState({ onComplete }) {
  const { times, noiseless, P_inf, steadyIdx, hasData } = useInvestigationKalman();

  const data = useMemo(() => {
    if (!noiseless) return [];
    const n = times.length;
    return Array.from({ length: n }, (_, i) => {
      const Pk = noiseless.P_trace[i];
      const dist = P_inf > 0 ? Math.abs(Pk - P_inf) / P_inf : 0;
      const conv = Math.max(0, 100 * (1 - Math.min(dist, 1)));
      return {
        t: times[i],
        P: Pk,
        K: noiseless.K_trace[i],
        pInf: P_inf,
        dist,
        conv,
        marker: i === steadyIdx ? Pk : null,
      };
    });
  }, [noiseless, times, P_inf, steadyIdx]);

  const convPct = steadyIdx >= 0 ? 100 : data.length ? data[data.length - 1].conv : 0;
  const distNow = data.length ? data[data.length - 1].dist : 1;

  if (!hasData) return <p className={s.metric}>Load ECG first.</p>;

  return (
    <div className={s.root}>
      <EqBanner>{"P∞ = A P∞ Aᵀ − A P∞ Hᵀ (H P∞ Hᵀ + R)⁻¹ H P∞ Aᵀ   [Q = 0]"}</EqBanner>
      <DynamicInsight
        text={
          steadyIdx >= 0
            ? "Kalman gain has stabilized. The filter is no longer learning — it has reached its optimal steady state."
            : "Approaching steady state — watch Pₖ converge to P∞."
        }
      />
      <p className={s.metric}>
        Convergence: <strong>{convPct.toFixed(0)}%</strong> · Distance to P∞:{" "}
        <strong>{distNow.toFixed(4)}</strong>
        {steadyIdx >= 0 && <> · Reached at k = <strong>{steadyIdx}</strong></>}
      </p>
      <div className={s.chartTall}>
        <LabLineChart
          data={data}
          lines={[
            { key: "P", name: "Pₖ", color: "#1d7480" },
            { key: "pInf", name: "P∞", color: "#e24b4a", dash: "8 4" },
            { key: "K", name: "Kₖ", color: "#378add" },
          ]}
        />
      </div>
      <button type="button" className={s.completeBtn} onClick={onComplete}>Mark investigation complete →</button>
    </div>
  );
}
