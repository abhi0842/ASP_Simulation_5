import { useContext, useMemo } from "react";
import { SimulationContext } from "../context/SimulationContext";
import { getAlignedKalmanSignals } from "../utils/signalAlign";
import { generateSyntheticLabSignal, forcedInputSeries } from "../utils/syntheticSignal";
import { buildFMatrix } from "../utils/kalman";

export function useLabSignals() {
  const {
    labUseSynthetic,
    syntheticParams,
    rawSamples,
    cleanSignal,
    noisySamples,
    originalFs,
    time,
    applyNoiseTrigger,
    forcedInputMode,
    forcedInputU,
    forcedAmplitude,
    forcedFrequency,
    kalmanParams,
  } = useContext(SimulationContext);

  const synthetic = useMemo(() => {
    const n = Math.min(800, Math.floor(syntheticParams.duration / syntheticParams.dt));
    return generateSyntheticLabSignal(n, syntheticParams.dt, {
      freq: syntheticParams.freq,
      measNoise: syntheticParams.measNoise,
    });
  }, [syntheticParams]);

  const ecgAligned = useMemo(
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

  const active = labUseSynthetic
    ? {
        truth: synthetic.truth,
        measurements: synthetic.measurements,
        times: synthetic.times,
        dt: synthetic.dt,
        fs: synthetic.fs,
        hasData: synthetic.truth.length > 2,
        source: "synthetic",
      }
    : ecgAligned.hasData
      ? {
          truth: ecgAligned.truth,
          measurements: ecgAligned.measurements,
          times: ecgAligned.times,
          dt: 1 / originalFs,
          fs: originalFs,
          hasData: ecgAligned.hasData,
          source: "ecg",
        }
      : {
          truth: synthetic.truth,
          measurements: synthetic.measurements,
          times: synthetic.times,
          dt: synthetic.dt,
          fs: synthetic.fs,
          hasData: synthetic.truth.length > 2,
          source: "synthetic-fallback",
        };

  const dt = active.dt;
  const F = useMemo(() => buildFMatrix(dt), [dt]);

  const uSeries = useMemo(() => {
    if (!active.hasData) return [];
    return forcedInputSeries(active.measurements.length, dt, {
      mode: forcedInputMode,
      amplitude: forcedAmplitude,
      frequency: forcedFrequency,
    });
  }, [
    active.hasData,
    active.measurements.length,
    dt,
    forcedInputMode,
    forcedAmplitude,
    forcedFrequency,
  ]);

  return {
    ...active,
    dt,
    F,
    kalmanParams,
    forcedInputU,
    forcedInputMode,
    forcedAmplitude,
    forcedFrequency,
    uSeries,
    labUseSynthetic,
  };
}
