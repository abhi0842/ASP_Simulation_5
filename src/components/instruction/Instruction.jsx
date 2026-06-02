import styles from "./instruction.module.css";

export const Instruction = () => {
  return (
    <div className={styles.box}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Kalman Filter Lab</h1>
          <p>
            <b>Unforced</b> (u=0) and <b>noiseless</b> (Q=0, w=0) state-space model with real ECG
            measurements z(k).
          </p>
        </div>
        <div className={styles.card}>
          <p className={styles.stepLabel}>Flow</p>
          <ol style={{ fontSize: "0.85rem", lineHeight: 1.55 }}>
            <li>Left: Generate ECG</li>
            <li>Right: Six investigations (unlock in order)</li>
            <li>Each tab compares baseline vs a changed assumption</li>
            <li>Use playback in investigations 1–2</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
