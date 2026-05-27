/**
 * ModuleNavigation.jsx — guided 8-module experiment workflow
 */

import { useContext } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import styles from './modules.module.css';

const MODULES = [
  { num: 1, title: 'ECG Signal Lab', short: 'ECG' },
  { num: 2, title: 'Biomedical Noise Lab', short: 'Noise' },
  { num: 3, title: 'State-Space Discovery', short: 'SSM' },
  { num: 4, title: 'Kalman Filter Engine', short: 'KF' },
  { num: 5, title: 'Initial Conditions', short: 'x̂₀,P₀' },
  { num: 6, title: 'Stability & Prediction', short: 'λ,A' },
  { num: 7, title: 'AI Interpretation', short: 'AI' },
  { num: 8, title: 'Performance Report', short: 'Report' },
];

export function ModuleNavigation() {
  const { currentModule, goToModule, ecgValues, noisyEcg, kalmanFilterState } =
    useContext(SimulationContext);

  const pipelineStatus = [
    ecgValues.length > 0,
    noisyEcg.length > 0,
    true,
    kalmanFilterState?.xFiltered?.length > 0,
    kalmanFilterState?.xFiltered?.length > 0,
    true,
    kalmanFilterState?.xFiltered?.length > 0,
    kalmanFilterState?.xFiltered?.length > 0,
  ];

  return (
    <div className={styles.moduleNavigation}>
      <div className={styles.moduleBar}>
        {MODULES.map((module) => (
          <button
            key={module.num}
            type="button"
            className={`${styles.moduleBtn} ${currentModule === module.num ? styles.active : ''} ${pipelineStatus[module.num - 1] ? styles.ready : ''}`}
            onClick={() => goToModule(module.num)}
            title={module.title}
          >
            <span className={styles.moduleNum}>{module.num}</span>
            <span className={styles.moduleShort}>{module.short}</span>
          </button>
        ))}
      </div>
      <div className={styles.moduleTitle}>
        <h2>{MODULES[currentModule - 1]?.title}</h2>
        <p className={styles.moduleSubtitle}>
          Unforced dynamics · Noiseless/near-noiseless SSM · Initial condition effects
        </p>
      </div>
    </div>
  );
}

export default ModuleNavigation;
