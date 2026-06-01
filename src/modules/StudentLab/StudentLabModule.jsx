import { useContext, useState } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { ModuleShell } from "../../components/lab/ModuleShell.jsx";
import { TheoryCard } from "../../components/lab/TheoryCard.jsx";
import lab from "../../components/lab/lab.module.css";

const EXPERIMENTS = [
  {
    title: "Experiment 1 — Q = 0",
    action: (ctx) => {
      ctx.setNoiselessMode(true);
      ctx.setKalmanParams((p) => ({ ...p, Q_diag: 0 }));
    },
    observe: "Covariance Pₖ collapses quickly; ‖Kₖ‖ stabilizes.",
    hypothesis: "Without process noise, uncertainty only enters via R and P₀.",
    question: "At which step does P∞ indicator trigger?",
  },
  {
    title: "Experiment 2 — Increase Q",
    action: (ctx) => {
      ctx.setNoiselessMode(false);
      ctx.setKalmanParams((p) => ({ ...p, Q_diag: 0.01 }));
    },
    observe: "Slower covariance convergence and noisier state estimates.",
    hypothesis: "Larger Q prevents P from collapsing as fast.",
    question: "Compare trace(P) curves in module 4.",
  },
  {
    title: "Experiment 3 — Forced dynamics",
    action: (ctx) => {
      ctx.setUnforcedMode(false);
    },
    observe: "Open-loop forced trajectory diverges from unforced path.",
    hypothesis: "B uₖ shifts prediction before the measurement update.",
    question: "Does estimation error grow when u is large?",
  },
  {
    title: "Experiment 4 — Break observability",
    action: (ctx) => {
      ctx.setObservabilityMode("non-observable");
    },
    observe: "Warning: rank(O) &lt; 2; position estimate may drift.",
    hypothesis: "Measuring only slope cannot observe position.",
    question: "Which state is hidden from zₖ = H xₖ?",
  },
];

export function StudentLabModule() {
  const ctx = useContext(SimulationContext);
  const [notes, setNotes] = useState("");
  const [activeEx, setActiveEx] = useState(null);

  return (
    <ModuleShell
      title="Interactive Student Lab"
      objectives={[
        <li key="1">Run guided experiments on Q, forcing, and observability</li>,
        <li key="2">Write hypotheses before checking Riccati / Q-comparison modules</li>,
        <li key="3">Record observations below</li>,
      ]}
      theory={
        <TheoryCard title="Lab protocol">
          <ol className={lab.learnList}>
            <li>Read the hypothesis for an experiment.</li>
            <li>Click <strong>Run setup</strong>.</li>
            <li>Open the linked module (Q comparison, Riccati, or Observability).</li>
            <li>Answer the prediction question in your notes.</li>
          </ol>
        </TheoryCard>
      }
      experiment={
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {EXPERIMENTS.map((ex) => (
            <div
              key={ex.title}
              className={lab.section}
              style={{ borderColor: activeEx === ex.title ? "#378add" : undefined }}
            >
              <h4>{ex.title}</h4>
              <p>
                <strong>Hypothesis:</strong> {ex.hypothesis}
              </p>
              <button
                type="button"
                className={lab.navBtnActive}
                style={{ marginBottom: 6 }}
                onClick={() => {
                  ex.action(ctx);
                  setActiveEx(ex.title);
                }}
              >
                Run setup
              </button>
              <p>
                <strong>Observe:</strong> {ex.observe}
              </p>
              <p>
                <strong>Question:</strong> {ex.question}
              </p>
            </div>
          ))}
          <label>
            <strong>Observation notes</strong>
            <textarea
              className={lab.notesArea}
              placeholder="Record what you saw in Pₖ, Kₖ, and state plots…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
      }
      takeaways="Change one assumption at a time (Q, u, or H) and interpret the covariance/gain response — that is the control-systems view of Kalman filtering."
    />
  );
}
