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
  const [showForcedComparison, setShowForcedComparison] = useState(false);
  const [controlInput, setControlInput] = useState(0);
  const [BMatrix, setBMatrix] = useState([[0], [0.1]]);
  const [matrixInput, setMatrixInput] = useState({
    A: '1.0, 0.002; 0, 0.99',
    H: '1, 0',
    Q: '0.001, 0; 0, 0.0001',
    B: '0; 0.1',
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

        <div className={styles.toggleGroup}>
          <label>
            <input
              type="checkbox"
              checked={showForcedComparison}
              onChange={(e) => setShowForcedComparison(e.target.checked)}
            />
            ⚙️ <strong>FORCED DYNAMICS COMPARISON</strong> (Compare with control input)
          </label>
          <p className={styles.hint}>
            Topic 2B core: See how UNFORCED (u = 0) differs from FORCED (u ≠ 0)
          </p>
        </div>

        {showForcedComparison && (
          <div className={styles.comparisonBox}>
            <h4>🔬 Forced vs Unforced Experiment</h4>
            <p>
              <strong>Unforced model:</strong> <code>x_{'{'}k+1{'}'} = A x_k + w_k</code>
            </p>
            <p>
              <strong>Forced model:</strong> <code>x_{'{'}k+1{'}'} = A x_k + B u_k + w_k</code>
            </p>
            
            <div className={styles.formGroup}>
              <label>Control Input u_k (Fixed value for comparison):</label>
              <input
                type="number"
                step="0.01"
                value={controlInput}
                onChange={(e) => setControlInput(parseFloat(e.target.value))}
              />
              <p className={styles.hint}>Adjusts how much control affects state evolution</p>
            </div>

            <div className={styles.matrixInput}>
              <label>Matrix B (Control Input Coupling):</label>
              <textarea
                rows="2"
                value={matrixInput.B}
                onChange={(e) => {
                  setMatrixInput(prev => ({ ...prev, B: e.target.value }));
                  const parsed = StateSpaceService.parseMatrixFromString(e.target.value);
                  if (parsed) setBMatrix(parsed);
                }}
              />
              <p className={styles.hint}>How control input affects each state. Default: [0; 0.1] (affects slope only)</p>
            </div>

            <div className={styles.comparisonResult}>
              <p><strong>Learning insight:</strong></p>
              <p>
                When u_k = 0, the forced model becomes unforced: 
                <code>x_{'{'}k+1{'}'} = A x_k + w_k</code>
              </p>
              <p>
                This is exactly what your Kalman filter optimizes for when UNFORCED MODE is ON.
                By comparing forced vs unforced predictions, you understand why the "unforced" assumption matters.
              </p>
            </div>
          </div>
        )}

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

            {showForcedComparison && (
              <div className={styles.matrixInput}>
                <label>Matrix B (Control Input):</label>
                <textarea
                  rows="2"
                  value={matrixInput.B}
                  onChange={(e) => {
                    setMatrixInput(prev => ({ ...prev, B: e.target.value }));
                    const parsed = StateSpaceService.parseMatrixFromString(e.target.value);
                    if (parsed) setBMatrix(parsed);
                  }}
                />
                <p className={styles.hint}>Only used when Forced Dynamics is ON. Default: [0; 0.1]</p>
              </div>
            )}

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

        {showForcedComparison && stateSpaceMatrices.A && BMatrix && (
          <div className={styles.comparisonResult}>
            <h4>📊 Trajectory Comparison Visualization</h4>
            
            {(() => {
              const comparison = StateSpaceService.simulateForcedDynamics(
                stateSpaceMatrices.A,
                BMatrix,
                [1, 0],
                controlInput,
                10
              );
              
              const unforcedX0 = comparison.unforced.map(x => x[0]);
              const unforcedX1 = comparison.unforced.map(x => x[1]);
              const forcedX0 = comparison.forced.map(x => x[0]);
              const forcedX1 = comparison.forced.map(x => x[1]);
              
              return (
                <div>
                  <table className={styles.comparisonTable}>
                    <thead>
                      <tr>
                        <th>Step k</th>
                        <th>Unforced x₀</th>
                        <th>Forced x₀</th>
                        <th>Δx₀</th>
                        <th>Unforced x₁</th>
                        <th>Forced x₁</th>
                        <th>Δx₁</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unforcedX0.slice(0, 6).map((_, k) => (
                        <tr key={k}>
                          <td>{k}</td>
                          <td>{unforcedX0[k].toFixed(4)}</td>
                          <td>{forcedX0[k].toFixed(4)}</td>
                          <td style={{ color: Math.abs(forcedX0[k] - unforcedX0[k]) > 1e-4 ? '#d9534f' : '#999' }}>
                            {(forcedX0[k] - unforcedX0[k]).toFixed(4)}
                          </td>
                          <td>{unforcedX1[k].toFixed(4)}</td>
                          <td>{forcedX1[k].toFixed(4)}</td>
                          <td style={{ color: Math.abs(forcedX1[k] - unforcedX1[k]) > 1e-4 ? '#d9534f' : '#999' }}>
                            {(forcedX1[k] - unforcedX1[k]).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                    <strong>Interpretation:</strong> As steps progress, the forced system (with u_k = {controlInput}) 
                    diverges from the unforced system. The difference (Δx) shows how control input B u_k 
                    accumulates over time. When u_k = 0, the trajectories converge.
                  </p>
                </div>
              );
            })()}
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
