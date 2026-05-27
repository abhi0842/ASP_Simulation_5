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
        <h3 className={styles.playbackTitle}>Playback</h3>
        <p className={styles.playbackStepLabel}>
          Sample {idx + 1}/{n} · t={t.toFixed(3)}s · z={fmt4(z)} · x̂⁻={fmt4(xPred)} · x̂={fmt4(xUpd)} · K={fmt4(K)} · P={fmt4(P)}
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

      <input
        className={styles.playbackSeek}
        type="range"
        min={0}
        max={Math.max(0, n - 1)}
        value={idx}
        onChange={(e) => {
          setPlaybackPlaying(false);
          setPlaybackIndex(Number(e.target.value));
        }}
      />

      <div className={styles.playbackProgress}>
        <div
          className={styles.playbackProgressFill}
          style={{ width: `${((idx + 1) / n) * 100}%` }}
        />
      </div>
    </section>
  );
}
