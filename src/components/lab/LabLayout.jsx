/**
 * LabLayout — main virtual laboratory shell (modules + visualizations)
 */

import { useContext } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import ModuleContainer from '../modules/ModuleContainer';
import { ModuleVisualizationPanel } from '../charts/ModuleVisualizationPanel';
import styles from './labLayout.module.css';

export function LabLayout() {
  const { darkMode } = useContext(SimulationContext);

  return (
    <div className={`${styles.lab} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.workflowBanner}>
        <span>Pipeline:</span>
        <strong>ECG</strong> → <strong>Noise</strong> → <strong>State-Space</strong> →{' '}
        <strong>Kalman</strong> → <strong>Initial Conditions</strong> → <strong>Stability</strong> →{' '}
        <strong>Interpretation</strong> → <strong>Report</strong>
      </div>
      <div className={styles.grid}>
        <div className={styles.controlsColumn}>
          <ModuleContainer />
        </div>
        <div className={styles.vizColumn}>
          <ModuleVisualizationPanel />
        </div>
      </div>
    </div>
  );
}

export default LabLayout;
