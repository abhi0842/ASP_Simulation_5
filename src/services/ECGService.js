/**
 * ECGService.js
 * Handles ECG signal processing, loading, analysis, and physiological interpretation
 */

/**
 * Load ECG data from CSV file
 */
export async function loadECGFromCSV(csvPath) {
  try {
    const response = await fetch(csvPath);
    const text = await response.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    if (lines.length < 2) {
      throw new Error('Invalid CSV format');
    }

    const header = lines[0].split(",").map(h => h.trim());
    const dataIdx = header.indexOf("data");
    if (dataIdx === -1) {
      throw new Error('CSV must contain "data" column');
    }

    const samples = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      const val = parseFloat(parts[dataIdx]);
      if (!isNaN(val)) {
        samples.push(val);
      }
    }
    return samples;
  } catch (error) {
    console.error('Failed to load ECG CSV:', error);
    throw error;
  }
}

/**
 * Get ECG dataset presets (filename, description)
 */
export function getECGPresets() {
  return [
    { id: 'ecg100', filename: 'ecg100.csv', label: 'ECG 100 - Normal Sinus Rhythm', fs: 500 },
    { id: 'ecg200', filename: 'ecg200.csv', label: 'ECG 200 - Mild Arrhythmia', fs: 500 },
    { id: 'ecg300', filename: 'ecg300.csv', label: 'ECG 300 - Complex Rhythm', fs: 500 },
  ];
}

/**
 * Detect R-peaks using simple peak detection
 * Returns array of indices where R-peaks occur
 */
export function detectRPeaks(signal, fs, threshold = 0.5) {
  const peaks = [];
  const smoothed = smoothSignal(signal, Math.floor(fs * 0.05));
  
  const maxVal = Math.max(...smoothed);
  const minVal = Math.min(...smoothed);
  const range = maxVal - minVal;
  const peakThreshold = minVal + range * threshold;

  for (let i = 1; i < smoothed.length - 1; i++) {
    if (
      smoothed[i] > smoothed[i - 1] &&
      smoothed[i] > smoothed[i + 1] &&
      smoothed[i] > peakThreshold
    ) {
      peaks.push(i);
    }
  }

  // Filter peaks too close together
  const minDistance = Math.floor(fs * 0.3); // At least 300ms apart
  const filtered = [];
  for (let i = 0; i < peaks.length; i++) {
    if (filtered.length === 0 || peaks[i] - filtered[filtered.length - 1] > minDistance) {
      filtered.push(peaks[i]);
    }
  }

  return filtered;
}

/**
 * Calculate heart rate from R-peak intervals (BPM)
 */
export function calculateHeartRate(rPeakIndices, fs) {
  if (rPeakIndices.length < 2) return 0;
  
  const intervals = [];
  for (let i = 1; i < rPeakIndices.length; i++) {
    intervals.push(rPeakIndices[i] - rPeakIndices[i - 1]);
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = (fs * 60) / avgInterval;
  
  return bpm;
}

/**
 * Segment ECG into individual beats
 */
export function segmentBeats(signal, rPeakIndices, fs, beforeMs = 200, afterMs = 600) {
  const before = Math.floor((beforeMs / 1000) * fs);
  const after = Math.floor((afterMs / 1000) * fs);
  
  const beats = [];
  for (const peakIdx of rPeakIndices) {
    const start = Math.max(0, peakIdx - before);
    const end = Math.min(signal.length, peakIdx + after);
    beats.push({
      data: signal.slice(start, end),
      peakIdx,
      startIdx: start,
      endIdx: end,
    });
  }
  return beats;
}

/**
 * Simple signal smoothing (moving average)
 */
export function smoothSignal(signal, windowSize) {
  if (windowSize < 1 || signal.length === 0) return signal;
  
  const smoothed = new Array(signal.length);
  const half = Math.floor(windowSize / 2);

  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(signal.length, i + half + 1);
    const window = signal.slice(start, end);
    smoothed[i] = window.reduce((a, b) => a + b, 0) / window.length;
  }
  
  return smoothed;
}

/**
 * Compute basic ECG quality metrics
 */
export function analyzeSignalQuality(signal) {
  if (signal.length === 0) {
    return {
      mean: 0,
      std: 0,
      min: 0,
      max: 0,
      rms: 0,
      peakFactor: 0,
    };
  }

  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const variance = signal.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / signal.length;
  const std = Math.sqrt(variance);
  const min = Math.min(...signal);
  const max = Math.max(...signal);
  const rms = Math.sqrt(signal.reduce((a, v) => a + v * v, 0) / signal.length);
  const peakFactor = Math.max(Math.abs(min), Math.abs(max)) / (rms || 1);

  return {
    mean: Number(mean.toFixed(4)),
    std: Number(std.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    rms: Number(rms.toFixed(4)),
    peakFactor: Number(peakFactor.toFixed(4)),
  };
}

/**
 * Extract time vector for signal
 */
export function createTimeVector(signalLength, fs) {
  const time = [];
  for (let i = 0; i < signalLength; i++) {
    time.push(i / fs);
  }
  return time;
}
