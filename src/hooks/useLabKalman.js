import { useContext, useMemo } from "react";
import { SimulationContext } from "../context/SimulationContext";
import { useLabSignals } from "./useLabSignals";
import {
  runNoiselessVsNoisyPair,
  runTripleQComparison,
  runObservabilityPair,
  buildHMatrix,
  isObservable,
  observabilityRank,
  observabilityMatrix,
  simulateOpenLoop,
  detectSteadyState,
  errorNormSeries,
} from "../utils/educationalKalman";
import { buildFMatrix } from "../utils/kalman";

export function useLabKalman() {
  const {
    unforcedMode,
    noiselessMode,
    kalmanParams,
    observabilityMode,
  } = useContext(SimulationContext);

  const lab = useLabSignals();
  const {
    truth,
    measurements,
    times,
    dt,
    hasData,
    uSeries,
    forcedInputU,
  } = lab;

  const F = buildFMatrix(dt);
  const H = useMemo(
    () => buildHMatrix(observabilityMode !== "non-observable"),
    [observabilityMode]
  );

  const filterOptions = useMemo(
    () => ({
      forcedMode: !unforcedMode,
      forcedUSeries: unforcedMode ? null : uSeries,
      forcedU: forcedInputU,
      H,
      noiselessMode,
    }),
    [unforcedMode, uSeries, forcedInputU, H, noiselessMode]
  );

  const Q_active = noiselessMode ? 0 : kalmanParams.Q_diag;
  const Q_compare = kalmanParams.Q_diag > 0 ? kalmanParams.Q_diag : 0.001;

  const pair = useMemo(() => {
    if (!hasData) return null;
    return runNoiselessVsNoisyPair(
      measurements,
      dt,
      kalmanParams,
      Q_compare,
      filterOptions
    );
  }, [hasData, measurements, dt, kalmanParams, Q_compare, filterOptions]);

  const tripleQ = useMemo(() => {
    if (!hasData) return [];
    return runTripleQComparison(measurements, dt, kalmanParams, filterOptions);
  }, [hasData, measurements, dt, kalmanParams, filterOptions]);

  const openLoop = useMemo(() => {
    if (!truth.length) return { unforced: [], forced: [] };
    const x0 = [truth[0], 0];
    const steps = Math.min(truth.length - 1, 400);
    return {
      unforced: simulateOpenLoop(x0, steps, dt, { forced: false }),
      forced: simulateOpenLoop(x0, steps, dt, { forced: true, uSeries }),
    };
  }, [truth, dt, uSeries]);

  const rank = useMemo(() => observabilityRank(F, H), [F, H]);
  const observable = useMemo(() => isObservable(F, H), [F, H]);

  const steadyIdx = useMemo(() => {
    if (!pair) return -1;
    return detectSteadyState(
      pair.noiseless.P_trace,
      pair.P_inf_noiseless,
      0.08
    );
  }, [pair]);

  const obsPair = useMemo(() => {
    if (!hasData) return null;
    return runObservabilityPair(measurements, dt, kalmanParams, filterOptions);
  }, [hasData, measurements, dt, kalmanParams, filterOptions]);

  const O_matrix = useMemo(() => observabilityMatrix(F, H), [F, H]);

  return {
    ...lab,
    F,
    H,
    hasData,
    pair,
    tripleQ,
    openLoop,
    rank,
    observable,
    steadyIdx,
    obsPair,
    O_matrix,
    Q_active,
    Q_compare,
    unforcedMode,
    noiselessMode,
    kalmanParams,
    observabilityMode,
  };
}
