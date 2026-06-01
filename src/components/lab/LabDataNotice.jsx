import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { useLabSignals } from "../../hooks/useLabSignals";
import lab from "./lab.module.css";

export function LabDataNotice() {
  const { generateECG, labUseSynthetic } = useContext(SimulationContext);
  const { hasData, source } = useLabSignals();

  if (hasData) {
    return (
      <p className={lab.takeaway} style={{ marginBottom: 8 }}>
        Active signal: <b>{source === "synthetic" ? "synthetic 2-state lab" : "ECG measurements"}</b>
      </p>
    );
  }

  return (
    <div className={lab.section} style={{ marginBottom: 8 }}>
      <p className={lab.takeaway}>
        {!labUseSynthetic && !generateECG
          ? "Generate an ECG signal in Step 1 (left controls), or enable synthetic lab signal."
          : "Loading signal… adjust duration or regenerate ECG if charts stay empty."}
      </p>
    </div>
  );
}
