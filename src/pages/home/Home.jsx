import styles from "./home.module.css";
import ModuleContainer from "../../components/modules/ModuleContainer";

export const Home = () => {
  return (
    <div className={styles.grandContainer}>
      <div className={styles.parentContainer}>
        <div className={styles.topContainer}>
          <header className={styles.header}>
            <h1>🧬 Kalman Filter Educational Laboratory</h1>
            <p>Unforced Dynamic Model with Noiseless State-Space ECG Analysis</p>
          </header>
        </div>

        {/* Main Module Content */}
        <div className={styles.middleContainer}>
          <ModuleContainer />
        </div>

        <div className={styles.footerContainer}>
          ©Copyright 2025 Virtual Labs, IIT Roorkee<br/>
          <small>Kalman Filter: Unforced Dynamics & Initial Condition Analysis (Topic 2B)</small>
        </div>
      </div>
    </div>
  );
};

