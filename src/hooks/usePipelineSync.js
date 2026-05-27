/**
 * usePipelineSync.js
 * Keeps the experiment pipeline connected using the original legacy state:
 * rawSamples / cleanSignal / noisySamples → Kalman filter state
 *
 * Unforced dynamic model: x_{k+1} = A x_k  (no B u term)
 * Noiseless mode:         Q = 0, R → very small
 */

import { useContext, useEffect } from 'react';
import { SimulationContext } from '../context/SimulationContext';
import * as KalmanService from '../services/KalmanService';

function createDiagonalP(n, diag) {
  const P = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = diag;
    P.push(row);
  }
  return P;
}

export function usePipelineSync() {
  const {
    generateECG,
    rawSamples,       // [{x, y}] — original ECG points
    noisySamples,     // [{x, y}] — noisy ECG points (may be empty)
    applyNoiseTrigger,
    stateSpaceMatrices,
    noiselessMode,
    unforcedMode,
    initialConditions,
    setKalmanFilterState,
    setPipelineData,
  } = useContext(SimulationContext);

  useEffect(() => {
    // Need at least raw signal and a valid A matrix
    if (!generateECG || rawSamples.length === 0 || !stateSpaceMatrices?.A) return;

    // Use noisy samples if noise has been applied, otherwise use raw
    const sourcePoints =
      applyNoiseTrigger && noisySamples.length > 0 ? noisySamples : rawSamples;

    // Extract scalar measurement array from {x, y} points
    const measurements = sourcePoints.map((p) => p.y);

    if (measurements.length === 0) return;

    const n = stateSpaceMatrices.A.length;
    const P0 = createDiagonalP(n, initialConditions.P0_diag ?? 1.0);
    const x0hat = new Array(n).fill(0);
    x0hat[0] = initialConditions.x0hat ?? 0;

    // Apply noiseless overrides on top of configured matrices
    let Q = stateSpaceMatrices.Q;
    let R = stateSpaceMatrices.R;
    if (noiselessMode) {
      Q = Q.map((row) => row.map(() => 0));
    }

    try {
      const results = KalmanService.kalmanFilter(
        measurements,
        stateSpaceMatrices.A,
        stateSpaceMatrices.H,
        Q,
        R,
        x0hat,
        P0,
        { noiselessMode, includeTraces: true }
      );

      setKalmanFilterState(results);

      setPipelineData((prev) => ({
        ...prev,
        module3: {
          matrices: stateSpaceMatrices,
          unforcedMode,
          noiselessMode,
        },
        module4: { kalmanResults: results, noiselessMode },
        module5: { initialConditions },
      }));
    } catch {
      /* invalid matrices during live edit — silently skip */
    }
  }, [
    generateECG,
    rawSamples,
    noisySamples,
    applyNoiseTrigger,
    stateSpaceMatrices,
    noiselessMode,
    unforcedMode,
    initialConditions,
    setKalmanFilterState,
    setPipelineData,
  ]);
}
