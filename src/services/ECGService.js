/**
 * ECGService.js
 * ECG loading, analysis, and physiological interpretation
 */

/**
 * Parse project CSV format: time_sec, ECG_I, ECG_I_filtered
 */
export function parseECGCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Invalid CSV format');
  }

  const header = lines[0].split(',').map((h) => h.trim());
  const timeIdx = header.findIndex((h) => h === 'time_sec' || h.startsWith('time_sec'));
  const rawIdx = header.findIndex((h) => h === 'ECG_I' || h.includes('ECG_I'));
  const cleanIdx = header.findIndex(
    (h) => h === 'ECG_I_filtered' || h.includes('ECG_I_filtered')
  );
  const dataIdx = header.indexOf('data');

  const resolvedTimeIdx = timeIdx >= 0 ? timeIdx : 0;
  const resolvedRawIdx = rawIdx >= 0 ? rawIdx : dataIdx >= 0 ? dataIdx : 1;
  const resolvedCleanIdx = cleanIdx >= 0 ? cleanIdx : resolvedRawIdx;

  const values = [];
  const clean = [];
  const time = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const t = Number.parseFloat(cols[resolvedTimeIdx]);
    const raw = Number.parseFloat(cols[resolvedRawIdx]);
    const ref = Number.parseFloat(cols[resolvedCleanIdx]);
    if (!Number.isFinite(raw)) continue;
    time.push(Number.isFinite(t) ? t : i / 500);
    values.push(raw);
    clean.push(Number.isFinite(ref) ? ref : raw);
  }

  if (values.length < 2) {
    throw new Error('CSV parse failed (no usable rows)');
  }

  let dtSum = 0;
  let dtCount = 0;
  for (let i = 1; i < Math.min(time.length, 200); i++) {
    const dt = time[i] - time[i - 1];
    if (dt > 0 && Number.isFinite(dt)) {
      dtSum += dt;
      dtCount++;
    }
  }
  const fs = dtCount > 0 ? 1 / (dtSum / dtCount) : 500;

  return { values, clean, time, fs };
}

/**
 * Load ECG from CSV path
 */
export async function loadECGFromCSV(csvPath, durationSec = null) {
  const response = await fetch(csvPath);
  if (!response.ok) {
    throw new Error(`Failed to load ECG CSV: ${response.status}`);
  }
  const text = await response.text();
  const parsed = parseECGCsv(text);

  let { values, clean, time, fs } = parsed;
  if (durationSec != null && durationSec > 0) {
    const endTime = time[0] + durationSec;
    let endIdx = time.length;
    for (let i = 0; i < time.length; i++) {
      if (time[i] > endTime) {
        endIdx = i;
        break;
      }
    }
    values = values.slice(0, endIdx);
    clean = clean.slice(0, endIdx);
    time = time.slice(0, endIdx);
  }

  return {
    values,
    clean,
    time,
    fs,
    points: toChartPoints(values, time),
    cleanPoints: toChartPoints(clean, time),
  };
}

export function toChartPoints(values, time = null) {
  return values.map((y, i) => ({
    x: time ? time[i] : i,
    y,
  }));
}

export function getECGPresets() {
  return [
    { id: 'ecg100', filename: 'ecg100.csv', label: 'ECG 100 — Normal Sinus Rhythm', fs: 500 },
    { id: 'ecg200', filename: 'ecg200.csv', label: 'ECG 200 — Mild Arrhythmia', fs: 500 },
    { id: 'ecg300', filename: 'ecg300.csv', label: 'ECG 300 — Complex Rhythm', fs: 500 },
  ];
}

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

  const minDistance = Math.floor(fs * 0.3);
  const filtered = [];
  for (let i = 0; i < peaks.length; i++) {
    if (filtered.length === 0 || peaks[i] - filtered[filtered.length - 1] > minDistance) {
      filtered.push(peaks[i]);
    }
  }

  return filtered;
}

export function calculateHeartRate(rPeakIndices, fs) {
  if (rPeakIndices.length < 2) return 0;

  const intervals = [];
  for (let i = 1; i < rPeakIndices.length; i++) {
    intervals.push(rPeakIndices[i] - rPeakIndices[i - 1]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return (fs * 60) / avgInterval;
}

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

export function analyzeSignalQuality(signal) {
  if (signal.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, rms: 0, peakFactor: 0 };
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

export function createTimeVector(signalLength, fs) {
  const time = [];
  for (let i = 0; i < signalLength; i++) {
    time.push(i / fs);
  }
  return time;
}

export function downsampleForDisplay(values, time, maxPoints = 2000) {
  if (values.length <= maxPoints) {
    return { values, time };
  }
  const step = Math.ceil(values.length / maxPoints);
  const vOut = [];
  const tOut = [];
  for (let i = 0; i < values.length; i += step) {
    vOut.push(values[i]);
    tOut.push(time[i] ?? i);
  }
  return { values: vOut, time: tOut };
}
