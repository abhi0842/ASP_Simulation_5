import { useContext, useMemo } from "react";
import { SimulationContext } from "../context/SimulationContext";
import { getAlignedKalmanSignals } from "../utils/signalAlign";
import { runKalmanFilter, solvePInfinity } from "../utils/kalman";

export function useKalmanSignals(overrideParams = null) {
  const {
    rawSamples,
    cleanSignal,
    noisySamples,
    originalFs,
    time,
    applyNoiseTrigger,
    kalmanParams,
    noiselessMode,
    unforcedMode,
  } = useContext(SimulationContext);

  const params = overrideParams ?? kalmanParams;
  const dt = 1 / originalFs;

  const aligned = useMemo(
    () =>
      getAlignedKalmanSignals({
        rawSamples,
        cleanSignal,
        noisySamples,
        originalFs,
        time,
        applyNoiseTrigger,
      }),
    [
      rawSamples,
      cleanSignal,
      noisySamples,
      originalFs,
      time,
      applyNoiseTrigger,
    ]
  );

  const filterResult = useMemo(() => {
    if (!aligned.hasData) return null;

    // Topic 2B: noiseless state-space model → force Q=0.
    // Keep R as student's selected measurement-noise level.
    const effectiveQ = noiselessMode ? 0 : params.Q_diag;
    const effectiveR = params.R;

    const result = runKalmanFilter(
      aligned.measurements,
      dt,
      params.x0hat,
      params.P0_alpha,
      effectiveQ,
      effectiveR,
      { noiselessMode }
    );

    // Steady-state reference consistent with the effective Q/R used above.
    const P_inf = solvePInfinity(dt, effectiveQ, effectiveR);

    return { ...result, P_inf, dt };
  }, [aligned, dt, params, noiselessMode]);

  return { aligned, filterResult, params, dt, fs: originalFs, noiselessMode, unforcedMode };
}
