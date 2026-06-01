import { useState } from "react";
import { TopicIntroModule } from "./TopicIntro/TopicIntroModule.jsx";
import { ForcedVsUnforcedModule } from "./ForcedVsUnforced/ForcedVsUnforcedModule.jsx";
import { NoiselessVsNoisyModule } from "./NoiselessVsNoisy/NoiselessVsNoisyModule.jsx";
import { RiccatiAnalysisModule } from "./RiccatiAnalysis/RiccatiAnalysisModule.jsx";
import { ObservabilityModule } from "./Observability/ObservabilityModule.jsx";
import { StudentLabModule } from "./StudentLab/StudentLabModule.jsx";
import styles from "../components/lab/lab.module.css";
import { LabDataNotice } from "../components/lab/LabDataNotice.jsx";

const MODULES = [
  { id: "intro", label: "1. Introduction", Component: TopicIntroModule },
  { id: "forced", label: "2. Forced vs Unforced", Component: ForcedVsUnforcedModule },
  { id: "noise", label: "3. Q=0 vs Q>0", Component: NoiselessVsNoisyModule },
  { id: "riccati", label: "4. Riccati / P∞", Component: RiccatiAnalysisModule },
  { id: "obs", label: "5. Observability", Component: ObservabilityModule },
  { id: "lab", label: "6. Student Lab", Component: StudentLabModule },
];

export function KalmanTopicLab() {
  const [active, setActive] = useState("intro");
  const mod = MODULES.find((m) => m.id === active) ?? MODULES[0];
  const Active = mod.Component;

  return (
    <section className={styles.shell} aria-label="Kalman topic virtual lab">
      <header style={{ marginBottom: 4 }}>
        <p className={styles.takeaway} style={{ margin: 0 }}>
          Virtual control-systems lab — unforced dynamics · noiseless Q = 0 · Riccati · observability
        </p>
      </header>
      <nav className={styles.nav} aria-label="Module navigation">
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={active === m.id ? styles.navBtnActive : styles.navBtn}
            onClick={() => setActive(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <LabDataNotice />
      <Active />
    </section>
  );
}
