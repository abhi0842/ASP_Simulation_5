import { useContext, useEffect } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import s from "./invShared.module.css";

/** Shared playback: Play, Pause, Step ±, Replay */
export function InvPlayback({ maxSteps }) {
  const {
    playbackIndex,
    setPlaybackIndex,
    playbackPlaying,
    setPlaybackPlaying,
  } = useContext(SimulationContext);

  const n = maxSteps ?? 0;
  const idx = Math.min(playbackIndex, Math.max(0, n - 1));

  useEffect(() => {
    if (!playbackPlaying || n < 1) return;
    if (idx >= n - 1) {
      setPlaybackPlaying(false);
      return;
    }
    const t = setTimeout(() => setPlaybackIndex((i) => Math.min(i + 1, n - 1)), 120);
    return () => clearTimeout(t);
  }, [playbackPlaying, idx, n, setPlaybackIndex, setPlaybackPlaying]);

  if (n < 1) return null;

  return (
    <div className={s.playbackRow}>
      <button type="button" className={s.playBtnPrimary} onClick={() => setPlaybackPlaying((p) => !p)}>
        {playbackPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        className={s.playBtn}
        onClick={() => setPlaybackIndex((i) => Math.max(0, i - 1))}
      >
        Step back
      </button>
      <button
        type="button"
        className={s.playBtn}
        onClick={() => setPlaybackIndex((i) => Math.min(n - 1, i + 1))}
      >
        Step forward
      </button>
      <button
        type="button"
        className={s.playBtn}
        onClick={() => {
          setPlaybackIndex(0);
          setPlaybackPlaying(true);
        }}
      >
        Replay
      </button>
      <span className={s.metric}>
        k = <strong>{idx}</strong> / {n - 1}
      </span>
    </div>
  );
}
