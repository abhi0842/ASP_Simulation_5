import styles from "./lab.module.css";

export function EquationBlock({ children }) {
  return <pre className={styles.eq}>{children}</pre>;
}
