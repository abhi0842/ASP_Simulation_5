import { useContext, useEffect } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { useKalmanSignals } from "../../hooks/useKalmanSignals";
import { fmt4 } from "../../utils/kalman";
import styles from "./kalman.module.css";

/**
 * Slow-motion step-through of the Kalman filter on the output panel.
 */
export function KalmanPlaybackBar() {
  const {
    generateECG,
    playbackIndex,
    setPlaybackIndex,
    playbackPlaying,
    setPlaybackPlaying,
    playbackSpeed,
    setPlaybackSpeed,
  } = useContext(SimulationContext);

  const { filterResult, aligned } = useKalmanSignals();
  const n = filterResult?.xFiltered?.length ?? 0;

  useEffect(() => {
    if (n > 0 && playbackIndex >= n) {
      setPlaybackIndex(n - 1);
    }
  }, [n, playbackIndex, setPlaybackIndex]);

  useEffect(() => {
    if (!playbackPlaying || n < 1) return;
    if (playbackIndex >= n - 1) {
      setPlaybackPlaying(false);
      return;
    }
    const delayMs = Math.max(40, 2200 - playbackSpeed * 20);
    const timer = setTimeout(() => {
      setPlaybackIndex((i) => Math.min(i + 1, n - 1));
    }, delayMs);
    return () => clearTimeout(timer);
  }, [
    playbackPlaying,
    playbackIndex,
    n,
    playbackSpeed,
    setPlaybackIndex,
    setPlaybackPlaying,
  ]);

  if (!generateECG || !filterResult || n < 1) return null;

  const idx = Math.min(playbackIndex, n - 1);
  const t = aligned.times[idx] ?? idx * (filterResult.dt ?? 0.002);
  const xPred = filterResult.xPred_trace?.[idx];
  const xUpd = filterResult.xFiltered?.[idx];
  const z = aligned.measurements[idx];
  const K = filterResult.K_trace?.[idx];
  const P = filterResult.P_trace?.[idx];

  return (
    <section className={styles.playbackBar} aria-label="Kalman filter slow-motion playback">
      <div className={styles.playbackHeader}>
        <h3 className={styles.playbackTitle}>Slow-Motion Filter Walkthrough</h3>
        <p className={styles.playbackSub}>
          Watch each sample: predict with the unforced model, then correct with the measurement.
        </p>
      </div>

      <div className={styles.playbackControls}>
        <button
          type="button"
          className={styles.playbackBtn}
          onClick={() => setPlaybackPlaying(!playbackPlaying)}
        >
          {playbackPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className={styles.playbackBtnSecondary}
          onClick={() => setPlaybackIndex((i) => Math.min(i + 1, n - 1))}
          disabled={idx >= n - 1}
        >
          Next step
        </button>
        <button
          type="button"
          className={styles.playbackBtnSecondary}
          onClick={() => {
            setPlaybackIndex(0);
            setPlaybackPlaying(false);
          }}
        >
          Reset
        </button>
        <label className={styles.playbackSpeedLabel}>
          Speed
          <input
            type="range"
            min={1}
            max={100}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          />
          <span>{playbackSpeed < 30 ? "Slow" : playbackSpeed < 70 ? "Medium" : "Fast"}</span>
        </label>
      </div>

      <div className={styles.playbackProgress}>
        <div
          className={styles.playbackProgressFill}
          style={{ width: `${((idx + 1) / n) * 100}%` }}
        />
      </div>
      <p className={styles.playbackStepLabel}>
        Sample {idx + 1} / {n} · t = {t.toFixed(3)} s
      </p>

      <div className={styles.playbackStepCards}>
        <div className={styles.playbackStepCard}>
          <span className={styles.playbackStepNum}>1</span>
          <div>
            <strong>Predict (unforced)</strong>
            <p>x̂⁻ = A x̂ · value = {fmt4(xPred)} mV</p>
          </div>
        </div>
        <div className={styles.playbackStepCard}>
          <span className={styles.playbackStepNum}>2</span>
          <div>
            <strong>Measure</strong>
            <p>z = {fmt4(z)} mV</p>
          </div>
        </div>
        <div className={styles.playbackStepCard}>
          <span className={styles.playbackStepNum}>3</span>
          <div>
            <strong>Update</strong>
            <p>
              K = {fmt4(K)} · P = {fmt4(P)} · x̂ = {fmt4(xUpd)} mV
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
