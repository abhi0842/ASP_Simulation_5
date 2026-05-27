/**
 * NoiseService.js
 * Handles biomedical noise generation and spectral analysis
 */

/**
 * Get available noise types with descriptions
 */
export function getNoiseTypes() {
  return [
    { id: 'gaussian', label: 'Gaussian Noise', description: 'White Gaussian noise' },
    { id: 'baseline', label: 'Baseline Wander', description: 'Low-frequency wandering' },
    { id: 'powerline', label: 'Powerline Interference', description: '50/60 Hz interference' },
    { id: 'emg', label: 'Muscle Artifact (EMG)', description: 'High-frequency EMG noise' },
    { id: 'motion', label: 'Motion Artifact', description: 'Electrode motion artifact' },
  ];
}

/**
 * Add Gaussian white noise
 */
export function addGaussianNoise(signal, amplitude = 0.01) {
  return signal.map(v => v + amplitude * randn());
}

/**
 * Add baseline wander (low-frequency sinusoid)
 */
export function addBaselineWander(signal, fs, amplitude = 0.2, freq = 0.33) {
  return signal.map((v, i) =>
    v + amplitude * Math.sin(2 * Math.PI * freq * (i / fs))
  );
}

/**
 * Add powerline interference (50 or 60 Hz)
 */
export function addPowerlineNoise(signal, fs, amplitude = 0.05, freq = 50) {
  return signal.map((v, i) =>
    v + amplitude * Math.sin(2 * Math.PI * freq * (i / fs))
  );
}

/**
 * Add muscle artifact (EMG) - high frequency noise
 */
export function addMuscleNoise(signal, fs, amplitude = 0.02) {
  return signal.map((v, i) => {
    // High-frequency components
    const hfnoise = amplitude * (Math.random() * 2 - 1);
    const hf = 0.5 * Math.sin(2 * Math.PI * 100 * (i / fs)); // 100 Hz component
    return v + hfnoise + hf * 0.01;
  });
}

/**
 * Add motion artifact - sudden jumps and low-frequency components
 */
export function addMotionArtifact(signal, fs, amplitude = 0.1) {
  const noise = signal.map((v, i) => v);
  const motionLength = Math.floor(fs * 0.5); // Motion segments ~500ms
  
  for (let i = 0; i < signal.length; i++) {
    // Random motion events
    if (Math.random() < 0.001) {
      const duration = Math.floor(Math.random() * motionLength);
      for (let j = i; j < Math.min(i + duration, signal.length); j++) {
        noise[j] += amplitude * (Math.random() * 2 - 1) * Math.exp(-(((j - i) / duration) ** 2));
      }
    }
    // Low-frequency component from motion
    noise[i] += amplitude * 0.3 * Math.sin(2 * Math.PI * 0.2 * (i / fs));
  }
  
  return noise;
}

/**
 * Apply multiple noise sources based on configuration
 */
export function applyMultipleNoise(signal, fs, noiseConfig = {}) {
  let result = [...signal];

  if (noiseConfig.gaussian?.enabled) {
    result = addGaussianNoise(result, noiseConfig.gaussian.amplitude || 0.01);
  }
  if (noiseConfig.baseline?.enabled) {
    result = addBaselineWander(result, fs, noiseConfig.baseline.amplitude || 0.2);
  }
  if (noiseConfig.powerline?.enabled) {
    result = addPowerlineNoise(result, fs, noiseConfig.powerline.amplitude || 0.05);
  }
  if (noiseConfig.emg?.enabled) {
    result = addMuscleNoise(result, fs, noiseConfig.emg.amplitude || 0.02);
  }
  if (noiseConfig.motion?.enabled) {
    result = addMotionArtifact(result, fs, noiseConfig.motion.amplitude || 0.1);
  }

  return result;
}

/**
 * Calculate Signal-to-Noise Ratio
 */
export function calculateSNR(cleanSignal, noisySignal) {
  if (cleanSignal.length !== noisySignal.length) {
    throw new Error('Signals must have equal length');
  }

  // Assume cleanSignal is the reference
  const signalPower = cleanSignal.reduce((a, v) => a + v * v, 0) / cleanSignal.length;
  
  // Noise is the difference
  const noisePower = cleanSignal.reduce((a, v, i) => {
    const diff = v - noisySignal[i];
    return a + diff * diff;
  }, 0) / cleanSignal.length;

  if (noisePower === 0) return Infinity;
  const snrDb = 10 * Math.log10(signalPower / noisePower);
  
  return isFinite(snrDb) ? snrDb : 0;
}

/**
 * Compute SNR improvement (filtering effect)
 */
export function calculateSNRImprovement(noisySignal, cleanSignal, filteredSignal) {
  const snrNoisy = calculateSNR(cleanSignal, noisySignal);
  const snrFiltered = calculateSNR(cleanSignal, filteredSignal);
  return snrFiltered - snrNoisy;
}

/**
 * Simple FFT-based power spectral density
 * Returns frequency bins and power values
 */
export function computePSD(signal, fs, nfft = 1024) {
  const n = Math.min(signal.length, nfft);
  const padded = new Array(nfft).fill(0);
  padded.set(signal.slice(0, n));

  // Simple Cooley-Tukey FFT for power spectrum
  const fft = simpleFFT(padded);
  const power = fft.slice(0, Math.floor(nfft / 2)).map(c => 
    (c.real ** 2 + c.imag ** 2) / n
  );

  const freqs = [];
  for (let i = 0; i < power.length; i++) {
    freqs.push((i * fs) / nfft);
  }

  return { frequencies: freqs, power };
}

/**
 * Simple in-place FFT implementation (Cooley-Tukey)
 */
function simpleFFT(x) {
  const n = x.length;
  if (n <= 1) return x.map(v => ({ real: v, imag: 0 }));
  
  // Check if power of 2
  if (n & (n - 1) !== 0) {
    return naiveDFT(x);
  }

  const even = [];
  const odd = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) even.push(x[i]);
    else odd.push(x[i]);
  }

  const fftEven = simpleFFT(even);
  const fftOdd = simpleFFT(odd);

  const result = new Array(n);
  for (let k = 0; k < n / 2; k++) {
    const angle = (-2 * Math.PI * k) / n;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    
    const real = fftOdd[k].real * wr - fftOdd[k].imag * wi;
    const imag = fftOdd[k].real * wi + fftOdd[k].imag * wr;

    result[k] = {
      real: fftEven[k].real + real,
      imag: fftEven[k].imag + imag,
    };
    result[k + n / 2] = {
      real: fftEven[k].real - real,
      imag: fftEven[k].imag - imag,
    };
  }

  return result;
}

/**
 * Naive DFT for comparison and edge cases
 */
function naiveDFT(x) {
  const n = x.length;
  const result = [];
  
  for (let k = 0; k < n; k++) {
    let real = 0, imag = 0;
    for (let j = 0; j < n; j++) {
      const angle = (-2 * Math.PI * k * j) / n;
      real += x[j] * Math.cos(angle);
      imag += x[j] * Math.sin(angle);
    }
    result.push({ real, imag });
  }
  
  return result;
}

/**
 * Box-Cox like noise model configuration presets
 */
export function getNoisePresets() {
  return [
    {
      id: 'clean',
      label: 'Clean (Minimal Noise)',
      config: {
        gaussian: { enabled: true, amplitude: 0.005 },
        baseline: { enabled: false },
        powerline: { enabled: false },
        emg: { enabled: false },
        motion: { enabled: false },
      },
    },
    {
      id: 'mild',
      label: 'Mild Noise',
      config: {
        gaussian: { enabled: true, amplitude: 0.02 },
        baseline: { enabled: true, amplitude: 0.1 },
        powerline: { enabled: false },
        emg: { enabled: false },
        motion: { enabled: false },
      },
    },
    {
      id: 'moderate',
      label: 'Moderate Noise',
      config: {
        gaussian: { enabled: true, amplitude: 0.05 },
        baseline: { enabled: true, amplitude: 0.2 },
        powerline: { enabled: true, amplitude: 0.03 },
        emg: { enabled: true, amplitude: 0.01 },
        motion: { enabled: false },
      },
    },
    {
      id: 'severe',
      label: 'Severe Noise',
      config: {
        gaussian: { enabled: true, amplitude: 0.1 },
        baseline: { enabled: true, amplitude: 0.3 },
        powerline: { enabled: true, amplitude: 0.08 },
        emg: { enabled: true, amplitude: 0.03 },
        motion: { enabled: true, amplitude: 0.1 },
      },
    },
  ];
}

/**
 * Box-Muller transform for Gaussian random number generation
 */
function randn() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
