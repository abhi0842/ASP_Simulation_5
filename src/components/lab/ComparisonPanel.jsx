import styles from "./lab.module.css";

export function ComparisonPanel({ leftTitle, rightTitle, left, right, footer }) {
  return (
    <div className={styles.compareWrap}>
      <div className={styles.compareCol}>
        <h5 className={styles.compareHead}>{leftTitle}</h5>
        {left}
      </div>
      <div className={styles.compareCol}>
        <h5 className={styles.compareHead}>{rightTitle}</h5>
        {right}
      </div>
      {footer && <p className={styles.compareFoot}>{footer}</p>}
    </div>
  );
}
