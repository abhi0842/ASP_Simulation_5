import { useContext } from "react";
import styles from "./leftPanel.module.css";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { SimulationContext } from "../../context/SimulationContext.jsx";
import { KalmanPlaybackBar } from "../kalman/KalmanPlaybackBar.jsx";
import { InvestigationPanel } from "../../investigations/InvestigationPanel.jsx";

/** Output panel — ECG, playback, six topic investigations (original step flow). */
export const LeftPanel = () => {
  const { generateECG } = useContext(SimulationContext);

  return (
    <div className={styles.leftPanelContainer}>
      <div className={styles.container}>
        {generateECG && (
          <section className={styles.ecgStrip} aria-label="ECG measurement">
            <EcgUnfilter />
            <KalmanPlaybackBar />
          </section>
        )}

        <InvestigationPanel />
      </div>
    </div>
  );
};
