import { useContext } from "react";
import styles from "./leftPanel.module.css";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { EcgNoisy } from "../graph/EcgNoisy.jsx";
import { SimulationContext } from "../../context/SimulationContext.jsx";
import { EcgUnfilteredPSD } from "../graph/EcgUnfilteredPSD.jsx";
import { KalmanLearningPanel } from "../kalman/KalmanLearningPanel.jsx";
import { TopicConceptDiagram } from "../kalman/TopicConceptDiagram.jsx";
import { KalmanPlaybackBar } from "../kalman/KalmanPlaybackBar.jsx";
import { KalmanStepFlow } from "../kalman/KalmanStepFlow.jsx";

/** Output panel — graphs, slow-motion playback, and learning tabs (right side). */
export const LeftPanel = () => {
  const { generateECG, applyNoiseTrigger, applypsdTrigger } =
    useContext(SimulationContext);

  return (
    <div className={styles.leftPanelContainer}>
      <div className={styles.container}>
        <header className={styles.outputHeader}>
          <h2 className={styles.outputTitle}>Output — Graphs &amp; Visualizations</h2>
          <p className={styles.outputSub}>
            ECG traces, Kalman results, and slow-motion playback. Use the input panel on the left to change parameters.
          </p>
        </header>

        <TopicConceptDiagram />
        {generateECG && <KalmanStepFlow />}
        {generateECG && <KalmanPlaybackBar />}

        <div className={styles.ecgChartsBlock}>
          {applypsdTrigger && (
            <div className={styles.psdContainer}>
              <EcgUnfilteredPSD />
            </div>
          )}
          {generateECG && <EcgUnfilter />}
          {applyNoiseTrigger && <EcgNoisy />}
        </div>
        {generateECG && <KalmanLearningPanel />}
      </div>
    </div>
  );
};
