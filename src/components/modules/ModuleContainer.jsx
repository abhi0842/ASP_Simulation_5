/**
 * ModuleContainer.jsx
 * Orchestrates all 8 modules and displays appropriate module based on current state
 */

import { useContext } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import ModuleNavigation from './ModuleNavigation';
import Module1ECGLab from './Module1ECGLab';
import Module2NoiseLab from './Module2NoiseLab';
import Module3StateSpace from './Module3StateSpace';
import Module4KalmanEngine from './Module4KalmanEngine';
import Module5InitialConditions from './Module5InitialConditions';
import Module6Stability from './Module6Stability';
import Module7Interpretation from './Module7Interpretation';
import Module8Analytics from './Module8Analytics';
import styles from './modules.module.css';

export function ModuleContainer() {
  const { currentModule } = useContext(SimulationContext);

  const renderModule = () => {
    switch (currentModule) {
      case 1:
        return <Module1ECGLab />;
      case 2:
        return <Module2NoiseLab />;
      case 3:
        return <Module3StateSpace />;
      case 4:
        return <Module4KalmanEngine />;
      case 5:
        return <Module5InitialConditions />;
      case 6:
        return <Module6Stability />;
      case 7:
        return <Module7Interpretation />;
      case 8:
        return <Module8Analytics />;
      default:
        return <Module1ECGLab />;
    }
  };

  return (
    <div className={styles.moduleSystem}>
      <ModuleNavigation />
      <div className={styles.moduleContent}>
        {renderModule()}
      </div>
    </div>
  );
}

export default ModuleContainer;
