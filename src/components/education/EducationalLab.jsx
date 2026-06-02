import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EducationCallout } from "./EducationCallout.jsx";
import { useEducationalKalman } from "../../hooks/useEducationalKalman.js";
import { estimationErrorSeries } from "../../utils/educationalKalman.js";
import styles from "./educational.module.css";

const MODULES = [
  { id: "m1", label: "1. Theory Foundations" },
  { id: "m2", label: "2. State Evolution" },
  { id: "m3", label: "3. Predict/Correct Cycle" },
  { id: "m4", label: "4. Q Comparison (Core)" },
  { id: "m5", label: "5. Riccati & Steady-State" },
  { id: "m6", label: "6. Observability Lab" },
];

function toXY(times, ys) {
  const n = Math.min(times.length, ys.length);
  return Array.from({ length: n }, (_, i) => ({ t: times[i], y: ys[i] }));
}

export function EducationalLab() {
  const [active, setActive] = useState("m4");
  const {
    aligned,
    filterResult,
    tripleQ,
    dt,
    times,
    truth,
    measurements,
    F,
    H_obs,
    observable,
    openLoop,
  } = useEducationalKalman();

  const hasData = aligned.hasData && times.length > 2;

  const openLoopData = useMemo(() => {
    if (!hasData) return [];
    const n = Math.min(openLoop.unforced.length, openLoop.forced.length, 300);
    return Array.from({ length: n }, (_, i) => ({
      k: i,
      unforced: openLoop.unforced[i],
      forced: openLoop.forced[i],
    }));
  }, [hasData, openLoop.unforced, openLoop.forced]);

  const cycleData = useMemo(() => {
    if (!hasData || !filterResult) return [];
    const n = Math.min(times.length, filterResult.xFiltered.length, 250);
    return Array.from({ length: n }, (_, i) => ({
      t: times[i],
      z: measurements[i],
      xpred: filterResult.xPred_trace?.[i],
      xhat: filterResult.xFiltered?.[i],
    }));
  }, [hasData, filterResult, times, measurements]);

  const qCompare = useMemo(() => {
    if (!hasData || tripleQ.length !== 3) return null;
    const n = Math.min(
      times.length,
      tripleQ[0].result.xFiltered.length,
      tripleQ[1].result.xFiltered.length,
      tripleQ[2].result.xFiltered.length,
      300
    );
    const err0 = estimationErrorSeries(tripleQ[0].result.xFiltered, truth);
    const err1 = estimationErrorSeries(tripleQ[1].result.xFiltered, truth);
    const err2 = estimationErrorSeries(tripleQ[2].result.xFiltered, truth);
    return {
      state: Array.from({ length: n }, (_, i) => ({
        t: times[i],
        truth: truth[i],
        q0: tripleQ[0].result.xFiltered[i],
        q001: tripleQ[1].result.xFiltered[i],
        q01: tripleQ[2].result.xFiltered[i],
      })),
      P: Array.from({ length: n }, (_, i) => ({
        t: times[i],
        q0: tripleQ[0].result.P_trace[i],
        q001: tripleQ[1].result.P_trace[i],
        q01: tripleQ[2].result.P_trace[i],
      })),
      K: Array.from({ length: n }, (_, i) => ({
        t: times[i],
        q0: tripleQ[0].result.K_trace[i],
        q001: tripleQ[1].result.K_trace[i],
        q01: tripleQ[2].result.K_trace[i],
      })),
      innov: Array.from({ length: n }, (_, i) => ({
        t: times[i],
        q0: Math.abs(tripleQ[0].result.innovations[i]),
        q001: Math.abs(tripleQ[1].result.innovations[i]),
        q01: Math.abs(tripleQ[2].result.innovations[i]),
      })),
      err: Array.from({ length: n }, (_, i) => ({
        t: times[i],
        q0: err0[i],
        q001: err1[i],
        q01: err2[i],
      })),
      Pinf: tripleQ.map((r) => ({ Q: r.Q, Pinf: r.P_inf })),
    };
  }, [hasData, tripleQ, times, truth]);

  if (!hasData) {
    return (
      <div className={styles.labRoot}>
        <p className={styles.eqBlock}>
          Load an ECG dataset in the controls panel to start the lab modules.
        </p>
      </div>
    );
  }

  return (
    <section className={styles.labRoot} aria-label="Educational Kalman lab">
      <nav className={styles.moduleNav} aria-label="Module navigation">
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={active === m.id ? styles.moduleBtnActive : styles.moduleBtn}
            onClick={() => setActive(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <motion.div
        className={styles.moduleBody}
        key={active}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {active === "m1" && (
          <>
            <h3 className={styles.moduleTitle}>Theory Foundations</h3>
            <div className={styles.eqBlock}>
              Unforced dynamics: x(k+1) = A x(k) + w(k) (no Bu(k)){"\n"}
              Measurement: z(k) = H x(k) + v(k){"\n"}
              Noiseless process model means Q = 0.
            </div>
            <div className={styles.matrixGrid}>
              <div className={styles.matrixCard}>
                <strong>A (F)</strong>
                <div className={styles.eqBlock}>
                  [{F[0][0].toFixed(3)} {F[0][1].toFixed(3)}]{"\n"}[
                  {F[1][0].toFixed(3)} {F[1][1].toFixed(3)}]
                </div>
              </div>
              <div className={styles.matrixCard}>
                <strong>H</strong>
                <div className={styles.eqBlock}>
                  [{H_obs[0][0]} {H_obs[0][1]}]
                </div>
              </div>
              <div className={styles.matrixCard}>
                <strong>dt</strong>
                <div className={styles.eqBlock}>{dt.toFixed(6)} s</div>
              </div>
            </div>
            <EducationCallout
              learn="How unforced and noiseless assumptions change filter behavior."
              idea="Removing Bu(k) and setting Q=0 simplifies prediction uncertainty."
              why="These assumptions isolate what the estimator can learn from measurements alone."
              connection="You will see covariance P(k) collapse faster when Q is smaller."
            />
          </>
        )}

        {active === "m2" && (
          <>
            <h3 className={styles.moduleTitle}>State Evolution Visualizer (Forced vs Unforced)</h3>
            <div className={styles.eqBlock}>
              Unforced: x(k+1)=A x(k){"\n"}Forced: x(k+1)=A x(k)+B u
            </div>
            <div className={`${styles.chartBox} ${styles.chartBoxTall}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={openLoopData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="k" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="unforced" stroke="#1d7480" dot={false} />
                  <Line type="monotone" dataKey="forced" stroke="#e24b4a" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <EducationCallout
              learn="What 'unforced' means and how forcing shifts predictions."
              idea="Bu(k) adds a known input term; removing it makes dynamics purely autonomous."
              why="It changes the predicted trajectory even before any measurement update."
              connection="The forced curve moves away from the unforced curve purely due to u."
            />
          </>
        )}

        {active === "m3" && (
          <>
            <h3 className={styles.moduleTitle}>Kalman Prediction and Correction Cycle</h3>
            <div className={styles.eqBlock}>
              Predict: x̂⁻ = A x̂,  P⁻ = A P Aᵀ{"\n"}
              Update: K = P⁻Hᵀ(HP⁻Hᵀ+R)⁻¹, x̂ = x̂⁻ + K(z − Hx̂⁻), P = (I−KH)P⁻
            </div>
            <div className={styles.chartGrid2}>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cycleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="z" name="Measurement z_k" stroke="#e24b4a" dot={false} />
                    <Line type="monotone" dataKey="xpred" name="Predicted x̂⁻" stroke="#ba7517" dot={false} />
                    <Line type="monotone" dataKey="xhat" name="Filtered x̂" stroke="#1d7480" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={toXY(times.slice(0, 250), filterResult?.innovations?.slice(0, 250) ?? [])}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="y" name="Innovation (z−Hx̂⁻)" stroke="#7f77dd" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <EducationCallout
              learn="How prediction and correction alternate each sample."
              idea="Innovation drives the correction; K adapts based on P and R."
              why="This is the core estimator loop used in real systems."
              connection="You can see x̂⁻ and x̂ diverge when measurements correct the model."
            />
          </>
        )}

        {active === "m4" && qCompare && (
          <>
            <h3 className={styles.moduleTitle}>Noiseless vs Noisy Comparison (Q sweep)</h3>
            <div className={styles.eqBlock}>
              Three runs: Q=0, Q=0.001, Q=0.01 (same measurements and R).
            </div>
            <div className={styles.chartGrid2}>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qCompare.state}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="truth" name="Truth" stroke="#888780" dot={false} />
                    <Line type="monotone" dataKey="q0" name="Q=0" stroke="#1d7480" dot={false} />
                    <Line type="monotone" dataKey="q001" name="Q=0.001" stroke="#7f77dd" dot={false} />
                    <Line type="monotone" dataKey="q01" name="Q=0.01" stroke="#e24b4a" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qCompare.P}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="q0" name="P(k) Q=0" stroke="#1d7480" dot={false} />
                    <Line type="monotone" dataKey="q001" name="P(k) Q=0.001" stroke="#7f77dd" dot={false} />
                    <Line type="monotone" dataKey="q01" name="P(k) Q=0.01" stroke="#e24b4a" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qCompare.K}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="q0" name="K(k) Q=0" stroke="#1d7480" dot={false} />
                    <Line type="monotone" dataKey="q001" name="K(k) Q=0.001" stroke="#7f77dd" dot={false} />
                    <Line type="monotone" dataKey="q01" name="K(k) Q=0.01" stroke="#e24b4a" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qCompare.err}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="q0" name="|error| Q=0" stroke="#1d7480" dot={false} />
                    <Line type="monotone" dataKey="q001" name="|error| Q=0.001" stroke="#7f77dd" dot={false} />
                    <Line type="monotone" dataKey="q01" name="|error| Q=0.01" stroke="#e24b4a" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <EducationCallout
              learn="How Q changes covariance decay, gain evolution, and error."
              idea="Smaller Q injects less uncertainty each prediction step, so P(k) shrinks faster."
              why="It explains why the 'noiseless' assumption is a special theoretical case."
              connection="Compare P(k) and K(k) curves across the three Q runs."
            />
          </>
        )}

        {active === "m5" && qCompare && (
          <>
            <h3 className={styles.moduleTitle}>Riccati Equation and Steady-State</h3>
            <div className={styles.eqBlock}>
              Riccati recursion governs covariance convergence. In steady-state, P(k) → P∞.
            </div>
            <div className={styles.metricRow}>
              {qCompare.Pinf.map((p) => (
                <span key={p.Q} className={styles.metricChip}>
                  P∞(Q={p.Q}) ≈ {Number(p.Pinf).toFixed(6)}
                </span>
              ))}
            </div>
            <EducationCallout
              learn="Why covariance converges and what P∞ means."
              idea="P∞ is the fixed point of the discrete Riccati recursion."
              why="It predicts long-run filter behavior (gain and uncertainty) without simulation."
              connection="The Q-sweep module shows P(k) approaching a Q-dependent steady level."
            />
          </>
        )}

        {active === "m6" && (
          <>
            <h3 className={styles.moduleTitle}>Observability Laboratory</h3>
            <div className={styles.eqBlock}>
              Observability determines whether the full state can be reconstructed from measurements: z(k)=H x(k).
            </div>
            <div className={styles.metricRow}>
              <span className={observable ? styles.badgeOn : styles.badgeOff}>
                {observable ? "Observable" : "Not observable"}
              </span>
              <span className={styles.metricChip}>
                Example H = [{H_obs[0][0]} {H_obs[0][1]}]
              </span>
            </div>
            <EducationCallout
              learn="Why observability matters in unforced systems."
              idea="If the observability matrix is rank-deficient, some state components cannot be inferred."
              why="Kalman filtering cannot estimate what the sensor never reveals."
              connection="In later work we can toggle H to show success vs failure cases."
            />
          </>
        )}
      </motion.div>
    </section>
  );
}
