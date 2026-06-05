/**
 * Initial state from first ECG samples only. ECG does not drive propagation afterward.
 */

export function extractInitialStateFromECG(ecgValues) {
  if (!ecgValues?.length) {
    return {
      x0: [0, 0],
      initialSamples: [],
      summary: { amplitude: 0, slope: 0 },
    };
  }

  const amp = ecgValues[0];
  const slope = ecgValues.length >= 2 ? ecgValues[1] - ecgValues[0] : 0;

  const initialSamples = ecgValues.slice(0, Math.min(5, ecgValues.length)).map((value, index) => ({
    index,
    value,
  }));

  return {
    x0: [amp, slope],
    initialSamples,
    summary: { amplitude: amp, slope },
  };
}

export function buildExtractionNarrative(summary) {
  return [
    {
      step: 1,
      title: 'Read initial ECG samples',
      detail: 'The first samples describe the waveform at the starting instant only.',
    },
    {
      step: 2,
      title: 'Map amplitude → State 1',
      detail: `State 1 (amplitude) is taken as the first sample: x₁(0) = ${summary.amplitude.toFixed(6)}.`,
    },
    {
      step: 3,
      title: 'Map slope → State 2',
      detail: `State 2 (slope) is the step between the first two samples: x₂(0) = ECG[1] − ECG[0] = ${summary.slope.toFixed(6)}.`,
    },
    {
      step: 4,
      title: 'Assemble x(0)',
      detail: 'This vector seeds deterministic propagation x(k+1) = A x(k). The ECG is not used again.',
    },
  ];
}
