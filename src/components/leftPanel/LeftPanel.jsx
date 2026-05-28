import { useContext } from "react";
import styles from "./leftPanel.module.css";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { EcgNoisy } from "../graph/EcgNoisy.jsx";
import { SimulationContext } from "../../context/SimulationContext.jsx";
import { EcgUnfilteredPSD } from "../graph/EcgUnfilteredPSD.jsx";
import { KalmanLearningPanel } from "../kalman/KalmanLearningPanel.jsx";
import { KalmanPlaybackBar } from "../kalman/KalmanPlaybackBar.jsx";

/** Output panel — charts and playback only. */
export const LeftPanel = () => {
  const { generateECG, applyNoiseTrigger, applypsdTrigger } =
    useContext(SimulationContext);

  return (
    <div className={styles.leftPanelContainer}>
      <div className={styles.container}>
        {generateECG && <EcgUnfilter />}
        {generateECG && <KalmanPlaybackBar />}

        <div className={styles.ecgChartsBlock}>
          {applyNoiseTrigger && <EcgNoisy />}
          {applypsdTrigger && (
            <div className={styles.psdContainer}>
              <EcgUnfilteredPSD />
            </div>
          )}
        </div>
        {generateECG && <KalmanLearningPanel />}
      </div>
    </div>
  );
};
