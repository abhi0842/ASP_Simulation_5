import { useContext } from "react";
import styles from "./topPanel.module.css";
import { SimulationContext } from "../../context/SimulationContext.jsx";

export const TopPanel = () => {
  const { showInstruction, setShowInstruction, buttonRef } =
    useContext(SimulationContext);

  const toggleInstruction = () => {
    setShowInstruction(!showInstruction);
  };

  return (
    <div className={styles.Container}>
      <div className={styles.panelContainer}>
        <div className={styles.titleBlock}>
          <h1 className={styles.mainTitle}>
            Kalman Filter — Unforced Dynamic Model &amp; Noiseless State-Space
          </h1>
          <p className={styles.subtitle}>
            Topic 2B · ECG Signal Estimation · x&#x302;<sub>k+1</sub> = A x&#x302;<sub>k</sub> &nbsp;|&nbsp; Q = 0 &nbsp;|&nbsp; Study how x&#x302;&#8320; and P&#8320; shape prediction accuracy
          </p>
        </div>
        <div className={styles.buttonContainer}>
          <button
            ref={buttonRef}
            className={styles.panelButton}
            onClick={toggleInstruction}
            type="button"
          >
            <span className={styles.buttonIcon}>ℹ️</span>
            How to Use
          </button>
        </div>
      </div>
    </div>
  );
};
