/** Synthetic 2-state lab signals (position + velocity), H = [1 0] measures position. */

export function generateSyntheticLabSignal(n = 500, dt = 0.002, opts = {}) {
  const { freq = 1.2, measNoise = 0.02, x0 = [0.5, 0.1] } = opts;
  const truth = [];
  const measurements = [];
  const times = [];
  let x0s = x0[0];
  let x1s = x0[1];

  for (let k = 0; k < n; k++) {
    const t = k * dt;
    times.push(t);
    truth.push(x0s);
    const z = x0s + measNoise * (Math.random() * 2 - 1);
    measurements.push(z);
    const u = 0;
    x0s = x0s + dt * x1s;
    x1s = x1s + 0.02 * Math.sin(2 * Math.PI * freq * t);
  }

  return { truth, measurements, times, dt, fs: 1 / dt };
}

export function forcedInputSeries(n, dt, { mode = "constant", amplitude = 0.2, frequency = 0.5 } = {}) {
  return Array.from({ length: n }, (_, k) => {
    const t = k * dt;
    if (mode === "sinusoidal") {
      return amplitude * Math.sin(2 * Math.PI * frequency * t);
    }
    return amplitude;
  });
}
