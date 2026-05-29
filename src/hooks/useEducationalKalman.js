import { useContext, useMemo } from "react";
import { SimulationContext } from "../context/SimulationContext";
import { useKalmanSignals } from "./useKalmanSignals";
import {
  runTripleQComparison,
  buildHMatrix,
  isObservable,
  simulateOpenLoop,
} from "../utils/educationalKalman";
import { buildFMatrix } from "../utils/kalman";

export function useEducationalKalman() {
  const { kalmanParams, forcedInputU, unforcedMode, noiselessMode } =
    useContext(SimulationContext);
  const { aligned, filterResult, dt } = useKalmanSignals();

  const measurements = aligned.measurements;
  const truth = aligned.truth;
  const times = aligned.times;

  const tripleQ = useMemo(() => {
    if (!measurements.length) return [];
    return runTripleQComparison(measurements, dt, kalmanParams);
  }, [measurements, dt, kalmanParams]);

  const F = useMemo(() => buildFMatrix(dt), [dt]);
  const H_obs = useMemo(() => buildHMatrix(true), []);
  const observable = useMemo(() => isObservable(F, H_obs), [F, H_obs]);

  const openLoop = useMemo(() => {
    if (!truth.length) return { unforced: [], forced: [] };
    const x0 = [truth[0], 0];
    const steps = Math.min(truth.length - 1, 500);
    return {
      unforced: simulateOpenLoop(x0, steps, dt, { forced: false }),
      forced: simulateOpenLoop(x0, steps, dt, {
        forced: true,
        u: forcedInputU,
      }),
    };
  }, [truth, dt, forcedInputU]);

  return {
    aligned,
    filterResult,
    tripleQ,
    dt,
    times,
    truth,
    measurements,
    F,
    H_obs,
    observable,
    openLoop,
    unforcedMode,
    noiselessMode,
    kalmanParams,
    forcedInputU,
  };
}
