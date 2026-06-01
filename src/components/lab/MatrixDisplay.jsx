import styles from "./lab.module.css";

export function MatrixDisplay({ label, matrix }) {
  if (!matrix) return null;
  const rows = Array.isArray(matrix[0]) ? matrix : [matrix];
  return (
    <div className={styles.section}>
      <h4>{label}</h4>
      <pre className={styles.eq}>
        {rows.map((row) => `[ ${row.map((v) => Number(v).toFixed(4)).join("  ")} ]`).join("\n")}
      </pre>
    </div>
  );
}
