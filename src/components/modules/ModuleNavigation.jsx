/**
 * ModuleNavigation.jsx
 * Top-level navigation and module orchestration
 */

import { useContext } from 'react';
import { SimulationContext } from '../context/SimulationContext';
import styles from './modules.module.css';

export function ModuleNavigation() {
  const { currentModule, goToModule } = useContext(SimulationContext);

  const modules = [
    { num: 1, title: 'ECG Signal Lab', emoji: '📊' },
    { num: 2, title: 'Biomedical Noise Lab', emoji: '🔊' },
    { num: 3, title: 'State-Space Engine', emoji: '⚙️' },
    { num: 4, title: 'Kalman Filter', emoji: '🎯' },
    { num: 5, title: 'Initial Conditions', emoji: '🔍' },
    { num: 6, title: 'Stability Analysis', emoji: '📈' },
    { num: 7, title: 'AI Interpretation', emoji: '🤖' },
    { num: 8, title: 'Performance Report', emoji: '📋' },
  ];

  return (
    <div className={styles.moduleNavigation}>
      <div className={styles.moduleBar}>
        {modules.map((module) => (
          <button
            key={module.num}
            className={`${styles.moduleBtn} ${currentModule === module.num ? styles.active : ''}`}
            onClick={() => goToModule(module.num)}
            title={module.title}
          >
            <span className={styles.moduleEmoji}>{module.emoji}</span>
            <span className={styles.moduleNum}>{module.num}</span>
          </button>
        ))}
      </div>
      <div className={styles.moduleTitle}>
        <h2>{modules[currentModule - 1]?.title}</h2>
      </div>
    </div>
  );
}

export default ModuleNavigation;
