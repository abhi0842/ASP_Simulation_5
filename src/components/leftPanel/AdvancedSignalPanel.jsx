import { useContext, useState } from "react";
import { SimulationContext } from "../../context/SimulationContext.jsx";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { EcgNoisy } from "../graph/EcgNoisy.jsx";
import { EcgUnfilteredPSD } from "../graph/EcgUnfilteredPSD.jsx";
import { KalmanPlaybackBar } from "../kalman/KalmanPlaybackBar.jsx";
import styles from "./leftPanel.module.css";

/** Optional ECG / noise / playback — collapsed by default so the lab stays theory-first. */
export function AdvancedSignalPanel() {
  const { generateECG, applyNoiseTrigger, applypsdTrigger, labUseSynthetic } =
    useContext(SimulationContext);
  const [open, setOpen] = useState(false);

  if (labUseSynthetic || !generateECG) return null;

  return (
    <details
      className={styles.advancedPanel}
      open={open}
      onToggle={(e) => setOpen(e.target.open)}
    >
      <summary className={styles.advancedSummary}>
        Advanced — ECG signal &amp; playback (optional)
      </summary>
      <div className={styles.ecgStrip}>
        <EcgUnfilter />
        <KalmanPlaybackBar />
      </div>
      <div className={styles.ecgChartsBlock}>
        {applyNoiseTrigger && <EcgNoisy />}
        {applypsdTrigger && (
          <div className={styles.psdContainer}>
            <EcgUnfilteredPSD />
          </div>
        )}
      </div>
    </details>
  );
}
