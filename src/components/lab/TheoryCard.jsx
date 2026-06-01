import styles from "./lab.module.css";

export function TheoryCard({ title, children }) {
  return (
    <div className={styles.section}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}
