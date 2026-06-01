import { useContext, useMemo } from "react";
import { SimulationContext } from "../context/SimulationContext";
import { useLabSignals } from "./useLabSignals";
import {
  runFilterForQ,
  runNoiselessVsNoisyPair,
  buildHForObservabilityLab,
  observabilityMatrix,
  observabilityRank,
  isObservable,
  detectSteadyState,
} from "../utils/educationalKalman";
import { forcedInputSeries } from "../utils/syntheticSignal";
import { buildFMatrix, solvePInfinity } from "../utils/kalman";
import { STEADY_THRESHOLD } from "../investigations/constants";

export function useInvestigationKalman() {
  const {
    kalmanParams,
    labQInject,
    observabilityLabMode,
    forcedAmplitude,
    forcedFrequency,
    forcedInputMode,
    forcedInputU,
  } = useContext(SimulationContext);

  const lab = useLabSignals();
  const { measurements, times, truth, dt, hasData, fs } = lab;

  const F = useMemo(() => buildFMatrix(dt), [dt]);
  const H = useMemo(() => buildHForObservabilityLab(observabilityLabMode), [observabilityLabMode]);

  const uSeries = useMemo(() => {
    if (!hasData) return [];
    return forcedInputSeries(measurements.length, dt, {
      mode: forcedInputMode,
      amplitude: forcedAmplitude,
      frequency: forcedFrequency,
    });
  }, [hasData, measurements.length, dt, forcedInputMode, forcedAmplitude, forcedFrequency]);

  const baseOpts = useMemo(
    () => ({ forcedMode: false, noiselessMode: true, H: [[1, 0]] }),
    []
  );

  const noiseless = useMemo(() => {
    if (!hasData) return null;
    return runFilterForQ(measurements, dt, kalmanParams, 0, baseOpts);
  }, [hasData, measurements, dt, kalmanParams, baseOpts]);

  const forced = useMemo(() => {
    if (!hasData) return null;
    return runFilterForQ(measurements, dt, kalmanParams, 0, {
      ...baseOpts,
      forcedMode: true,
      forcedUSeries: uSeries,
      forcedU: forcedInputU,
    });
  }, [hasData, measurements, dt, kalmanParams, baseOpts, uSeries, forcedInputU]);

  const qPair = useMemo(() => {
    if (!hasData) return null;
    const q = Math.max(0, Math.min(1, labQInject));
    return runNoiselessVsNoisyPair(measurements, dt, kalmanParams, q || 0.001, baseOpts);
  }, [hasData, measurements, dt, kalmanParams, labQInject, baseOpts]);

  const obsFilter = useMemo(() => {
    if (!hasData) return null;
    return runFilterForQ(measurements, dt, kalmanParams, 0, {
      ...baseOpts,
      H,
    });
  }, [hasData, measurements, dt, kalmanParams, baseOpts, H]);

  const P_inf = useMemo(() => {
    if (!hasData) return 0;
    return solvePInfinity(dt, 0, kalmanParams.R);
  }, [hasData, dt, kalmanParams.R]);

  const steadyIdx = useMemo(() => {
    if (!noiseless?.P_trace?.length) return -1;
    return detectSteadyState(noiseless.P_trace, P_inf, STEADY_THRESHOLD);
  }, [noiseless, P_inf]);

  const O = useMemo(() => observabilityMatrix(F, H), [F, H]);
  const rank = useMemo(() => observabilityRank(F, H), [F, H]);
  const observable = useMemo(() => isObservable(F, H), [F, H]);

  const rmsForcedDiff = useMemo(() => {
    if (!noiseless || !forced) return 0;
    const n = Math.min(noiseless.xFiltered.length, forced.xFiltered.length);
    if (n < 1) return 0;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const d = forced.xFiltered[i] - noiseless.xFiltered[i];
      s += d * d;
    }
    return Math.sqrt(s / n);
  }, [noiseless, forced]);

  return {
    ...lab,
    hasData,
    times,
    truth,
    measurements,
    dt,
    fs,
    F,
    H,
    O,
    rank,
    observable,
    noiseless,
    forced,
    qPair,
    obsFilter,
    P_inf,
    steadyIdx,
    uSeries,
    rmsForcedDiff,
    kalmanParams,
    labQInject,
    observabilityLabMode,
  };
}
