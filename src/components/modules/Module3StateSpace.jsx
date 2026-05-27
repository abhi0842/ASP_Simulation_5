/**
 * Module3StateSpace.jsx
 * State-Space Discovery Engine with UNFORCED MODE
 */

import { useContext, useState, useEffect, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as StateSpaceService from '../../services/StateSpaceService';
import styles from './modules.module.css';

export function Module3StateSpace() {
  const {
    stateSpaceMatrices,
    setStateSpaceMatrices,
    unforcedMode,
    setUnforcedMode,
    noiselessMode,
    setNoiselessMode,
    systemAnalysis,
    setSystemAnalysis,
    advanceToNextModule,
    setPipelineData,
  } = useContext(SimulationContext);

  const [presets] = useState(StateSpaceService.getStateSpacePresets());
  const [selectedPreset, setSelectedPreset] = useState('ecg_stable');
  const [editMode, setEditMode] = useState(false);
  const [matrixInput, setMatrixInput] = useState({
    A: '1.0, 0.002; 0, 0.99',
    H: '1, 0',
    Q: '0.001, 0; 0, 0.0001',
  });

  // Load preset
  const loadPreset = useCallback((presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setStateSpaceMatrices({
        A: preset.A,
        H: preset.H,
        Q: preset.Q,
        R: preset.R,
      });
      setSelectedPreset(presetId);
    }
  }, [presets, setStateSpaceMatrices]);

  // Noiseless mode: set Q ≈ 0 when toggled (Topic 2B)
  useEffect(() => {
    if (!noiselessMode) return;
    const n = stateSpaceMatrices.A?.length ?? 2;
    const zeroQ = Array.from({ length: n }, () => Array(n).fill(0));
    setStateSpaceMatrices((prev) => ({
      ...prev,
      Q: zeroQ,
      R: Math.min(prev.R, 1e-5),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noiselessMode]);

  // Analyze system
  useEffect(() => {
    if (!stateSpaceMatrices.A || !stateSpaceMatrices.H) return;

    try {
      const eigenvalues = StateSpaceService.computeEigenvalues2x2(stateSpaceMatrices.A);
      const stability = StateSpaceService.checkStability(eigenvalues);
      const observable = StateSpaceService.isObservable(stateSpaceMatrices.H, stateSpaceMatrices.A);
      const description = StateSpaceService.getSystemDescription(
        stateSpaceMatrices.A,
        stateSpaceMatrices.H,
        stateSpaceMatrices.Q,
        stateSpaceMatrices.R
      );

      setSystemAnalysis({
        eigenvalues,
        stability,
        observable,
        description,
      });

      // Update pipeline
      setPipelineData(prev => ({
        ...prev,
        module3: {
          matrices: stateSpaceMatrices,
          unforcedMode,
          systemAnalysis: { eigenvalues, stability, observable },
        },
      }));
    } catch (error) {
      console.error('Error analyzing system:', error);
    }
  }, [stateSpaceMatrices, unforcedMode, setPipelineData, setSystemAnalysis]);

  const handleMatrixChange = (matrixName, value) => {
    const parsed = StateSpaceService.parseMatrixFromString(value);
    if (parsed) {
      setStateSpaceMatrices(prev => ({
        ...prev,
        [matrixName]: parsed,
      }));
    }
  };

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>State-Space System Discovery</h3>

        <div className={styles.formGroup}>
          <label>Preset Models:</label>
          <select value={selectedPreset} onChange={(e) => loadPreset(e.target.value)}>
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.toggleGroup}>
          <label>
            <input
              type="checkbox"
              checked={unforcedMode}
              onChange={(e) => setUnforcedMode(e.target.checked)}
            />
            🔄 <strong>UNFORCED MODE</strong> (No control input)
          </label>
          <p className={styles.hint}>
            In unforced mode, the system evolves autonomously: <code>x_{k+1} = A x_k + w_k</code>
          </p>
        </div>

        <div className={styles.toggleGroup}>
          <label>
            <input
              type="checkbox"
              checked={noiselessMode}
              onChange={(e) => setNoiselessMode(e.target.checked)}
            />
            🔇 <strong>NOISELESS MODE</strong> (Q ≈ 0)
          </label>
          <p className={styles.hint}>
            Topic 2B focus: Ideal system behavior with minimal process noise
          </p>
        </div>

        <button onClick={() => setEditMode(!editMode)} className={styles.editBtn}>
          {editMode ? 'Collapse Matrices' : 'Edit Matrices'}
        </button>

        {editMode && (
          <div className={styles.matrixEditor}>
            <div className={styles.matrixInput}>
              <label>Matrix A (State Transition):</label>
              <textarea
                rows="2"
                value={matrixInput.A}
                onChange={(e) => {
                  setMatrixInput(prev => ({ ...prev, A: e.target.value }));
                  handleMatrixChange('A', e.target.value);
                }}
              />
            </div>

            <div className={styles.matrixInput}>
              <label>Matrix H (Measurement):</label>
              <textarea
                rows="2"
                value={matrixInput.H}
                onChange={(e) => {
                  setMatrixInput(prev => ({ ...prev, H: e.target.value }));
                  handleMatrixChange('H', e.target.value);
                }}
              />
            </div>

            <div className={styles.matrixInput}>
              <label>Matrix Q (Process Noise):</label>
              <textarea
                rows="2"
                value={matrixInput.Q}
                onChange={(e) => {
                  setMatrixInput(prev => ({ ...prev, Q: e.target.value }));
                  handleMatrixChange('Q', e.target.value);
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Scalar R (Measurement Noise):</label>
              <input
                type="number"
                step="0.001"
                value={stateSpaceMatrices.R}
                onChange={(e) => setStateSpaceMatrices(prev => ({
                  ...prev,
                  R: parseFloat(e.target.value),
                }))}
              />
            </div>

            <p className={styles.hint}>
              Format: space or comma-separated values; semicolon for row breaks<br/>
              Example: <code>1, 0.1; 0.1, 2</code>
            </p>
          </div>
        )}

        {systemAnalysis && (
          <div className={styles.infoBox}>
            <h4>System Analysis</h4>
            <pre>{systemAnalysis.description}</pre>

            <div className={styles.stabilityIndicator}>
              {systemAnalysis.stability?.stable ? (
                <span className={styles.stable}>✓ Stable System</span>
              ) : systemAnalysis.stability?.marginal ? (
                <span className={styles.marginal}>⚠ Marginally Stable</span>
              ) : (
                <span className={styles.unstable}>✗ Unstable System</span>
              )}
            </div>

            <div className={styles.observabilityIndicator}>
              {systemAnalysis.observable ? (
                <span className={styles.observable}>✓ Observable</span>
              ) : (
                <span className={styles.notObservable}>✗ Not Observable</span>
              )}
            </div>
          </div>
        )}

        <div className={styles.educationalBox}>
          <h4>📚 State-Space Fundamentals</h4>
          <p>
            <strong>State Equation:</strong> <code>x_{k+1} = A x_k + w_k</code>
          </p>
          <p>
            The state vector <code>x</code> encodes the hidden physiological state of the heart. 
            Matrix <code>A</code> describes how this state evolves from one time step to the next.
          </p>
          <p>
            <strong>Measurement Equation:</strong> <code>z_k = H x_k + v_k</code>
          </p>
          <p>
            The ECG signal we observe is a linear combination of hidden states, corrupted by noise.
          </p>
          <p>
            <strong>UNFORCED DYNAMICS:</strong> No external control—the system evolves autonomously 
            based on physiological mechanisms alone.
          </p>
        </div>
      </section>

      <section className={styles.navigationSection}>
        <button className={styles.nextBtn} onClick={advanceToNextModule}>
          Next: Kalman Filter Engine →
        </button>
      </section>
    </div>
  );
}

export default Module3StateSpace;
