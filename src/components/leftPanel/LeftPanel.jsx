import { useContext } from "react";
import styles from "./leftPanel.module.css";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { EcgNoisy } from "../graph/EcgNoisy.jsx";
import { SimulationContext } from "../../context/SimulationContext.jsx";
import { EcgUnfilteredPSD } from "../graph/EcgUnfilteredPSD.jsx";
import { KalmanPlaybackBar } from "../kalman/KalmanPlaybackBar.jsx";
import { TopicLearningPanel } from "../kalman/TopicLearningPanel.jsx";

/** Output panel — ECG + playback + step-matched learning tabs (original flow). */
export const LeftPanel = () => {
  const { generateECG, applyNoiseTrigger, applypsdTrigger } =
    useContext(SimulationContext);

  return (
    <div className={styles.leftPanelContainer}>
      <div className={styles.container}>
        {generateECG && (
          <section className={styles.ecgStrip} aria-label="ECG signal">
            <EcgUnfilter />
            <KalmanPlaybackBar />
          </section>
        )}

        <div className={styles.ecgChartsBlock}>
          {generateECG && applyNoiseTrigger && <EcgNoisy />}
          {generateECG && applypsdTrigger && (
            <div className={styles.psdContainer}>
              <EcgUnfilteredPSD />
            </div>
          )}
        </div>

        <TopicLearningPanel />
      </div>
    </div>
  );
};
