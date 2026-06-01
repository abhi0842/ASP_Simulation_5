import styles from "./lab.module.css";

export function CovarianceHeatmap({ p00 = 0, p01 = 0, p10 = 0, p11 = 0 }) {
  const cells = [
    { label: "P₀₀", v: p00 },
    { label: "P₀₁", v: p01 },
    { label: "P₁₀", v: p10 },
    { label: "P₁₁", v: p11 },
  ];
  const max = Math.max(...cells.map((c) => Math.abs(c.v)), 1e-9);
  return (
    <div className={styles.heat}>
      {cells.map((c) => (
        <div
          key={c.label}
          className={styles.heatCell}
          style={{
            background: `rgba(29, 116, 128, ${0.15 + 0.65 * (Math.abs(c.v) / max)})`,
          }}
        >
          {c.label}
          <br />
          {c.v.toFixed(4)}
        </div>
      ))}
    </div>
  );
}
