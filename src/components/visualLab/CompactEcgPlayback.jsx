import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { KalmanPlaybackBar } from "../kalman/KalmanPlaybackBar.jsx";
import styles from "./visualLab.module.css";

/** Compact ECG + playback — collapsible, secondary to main comparison chart. */
export function CompactEcgPlayback() {
  const { generateECG, labUseSynthetic } = useContext(SimulationContext);
  if (!generateECG || labUseSynthetic) return null;

  return (
    <details className={styles.ecgCompact}>
      <summary>ECG waveform &amp; step playback</summary>
      <EcgUnfilter />
      <KalmanPlaybackBar />
    </details>
  );
}
