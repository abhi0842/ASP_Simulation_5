/**
 * Module1ECGLab.jsx — ECG Signal Lab
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as ECGService from '../../services/ECGService';
import styles from './modules.module.css';

export function Module1ECGLab() {
  const {
    time,
    setTime,
    ecgValues,
    setEcgValues,
    setEcgTime,
    setRawSamples,
    setCleanSignal,
    setGenerateECG,
    originalFs,
    setOriginalFs,
    advanceToNextModule,
    setPipelineData,
    ecgMetadata,
    setEcgMetadata,
    selectedEcgPreset,
    setSelectedEcgPreset,
  } = useContext(SimulationContext);

  const [presets] = useState(ECGService.getECGPresets());
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState({});
  const [segmentStart, setSegmentStart] = useState(0);
  const [segmentEnd, setSegmentEnd] = useState(100);

  const loadECGPreset = useCallback(async (presetId) => {
    setIsLoading(true);
    try {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) throw new Error('Preset not found');

      const base = import.meta.env.BASE_URL || '/';
      const path = (base.endsWith('/') ? base : base + '/') + preset.filename;

      const loaded = await ECGService.loadECGFromCSV(path, time);
      setEcgValues(loaded.values);
      setEcgTime(loaded.time);
      setCleanSignal(loaded.clean);
      setRawSamples(loaded.points);
      setOriginalFs(loaded.fs);
      setGenerateECG(true);
      setSelectedEcgPreset(presetId);

      const qualityMetrics = ECGService.analyzeSignalQuality(loaded.values);
      setQuality(qualityMetrics);

      const rPeaks = ECGService.detectRPeaks(loaded.values, loaded.fs);
      const hr = ECGService.calculateHeartRate(rPeaks, loaded.fs);

      setEcgMetadata({
        rPeaks,
        heartRate: hr,
        beatSegments: ECGService.segmentBeats(loaded.values, rPeaks, loaded.fs),
        signalQuality: qualityMetrics,
      });

      setPipelineData((prev) => ({
        ...prev,
        module1: {
          ecg: loaded.values,
          metadata: { rPeaks, heartRate: hr, quality: qualityMetrics },
        },
      }));
    } catch (error) {
      console.error('Failed to load ECG:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    presets,
    time,
    setEcgValues,
    setEcgTime,
    setCleanSignal,
    setRawSamples,
    setOriginalFs,
    setGenerateECG,
    setSelectedEcgPreset,
    setEcgMetadata,
    setPipelineData,
  ]);

  useEffect(() => {
    loadECGPreset(selectedEcgPreset || 'ecg200');
  }, [selectedEcgPreset, time, loadECGPreset]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const text = await file.text();
      const parsed = ECGService.parseECGCsv(text);
      let { values, clean, time: t, fs } = parsed;
      const durationSec = time;
      if (durationSec > 0 && t.length > 0) {
        const endTime = t[0] + durationSec;
        let endIdx = t.length;
        for (let i = 0; i < t.length; i++) {
          if (t[i] > endTime) {
            endIdx = i;
            break;
          }
        }
        values = values.slice(0, endIdx);
        clean = clean.slice(0, endIdx);
        t = t.slice(0, endIdx);
      }
      setEcgValues(values);
      setEcgTime(t);
      setCleanSignal(clean);
      setRawSamples(ECGService.toChartPoints(values, t));
      setOriginalFs(fs);
      setGenerateECG(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const rrIntervals =
    ecgMetadata.rPeaks?.length >= 2
      ? ecgMetadata.rPeaks.slice(1).map((p, i) => ((p - ecgMetadata.rPeaks[i]) / originalFs) * 1000)
      : [];

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>Module 1 — ECG Signal Lab</h3>

        <div className={styles.formGroup}>
          <label>ECG Dataset Preset</label>
          <select
            value={selectedEcgPreset || 'ecg200'}
            onChange={(e) => setSelectedEcgPreset(e.target.value)}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Upload ECG CSV (time_sec, ECG_I, ECG_I_filtered)</label>
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </div>

        <div className={styles.sliderGroup}>
          <label>Duration window: {time} s</label>
          <input
            type="range"
            min="1"
            max="30"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />
        </div>

        {isLoading && <p>Loading ECG data…</p>}

        {ecgValues.length > 0 && (
          <>
            <div className={styles.infoBox}>
              <h4>Signal Metadata</h4>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td>Sampling rate</td>
                    <td>{originalFs.toFixed(1)} Hz</td>
                  </tr>
                  <tr>
                    <td>Length</td>
                    <td>
                      {ecgValues.length} samples ({(ecgValues.length / originalFs).toFixed(2)} s)
                    </td>
                  </tr>
                  <tr>
                    <td>Heart rate (est.)</td>
                    <td>{Math.round(ecgMetadata.heartRate)} BPM</td>
                  </tr>
                  <tr>
                    <td>R-peaks</td>
                    <td>{ecgMetadata.rPeaks?.length || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.infoBox}>
              <h4>Signal Quality</h4>
              <table className={styles.infoTable}>
                <tbody>
                  <tr><td>Mean / Std</td><td>{quality.mean} / {quality.std}</td></tr>
                  <tr><td>Min / Max</td><td>{quality.min} / {quality.max}</td></tr>
                  <tr><td>RMS / Crest factor</td><td>{quality.rms} / {quality.peakFactor}</td></tr>
                </tbody>
              </table>
            </div>

            {rrIntervals.length > 0 && (
              <div className={styles.infoBox}>
                <h4>Beat-to-beat intervals (ms)</h4>
                <p className={styles.hint}>
                  Mean RR: {(rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length).toFixed(0)} ms
                </p>
              </div>
            )}

            <div className={styles.sliderGroup}>
              <label>Segment selection (% of signal): {segmentStart}% – {segmentEnd}%</label>
              <input
                type="range"
                min="0"
                max="90"
                value={segmentStart}
                onChange={(e) => setSegmentStart(Number(e.target.value))}
              />
              <input
                type="range"
                min="10"
                max="100"
                value={segmentEnd}
                onChange={(e) => setSegmentEnd(Number(e.target.value))}
              />
            </div>

            <div className={styles.educationalBox}>
              <h4>Learning objective</h4>
              <p>
                ECG morphology reflects autonomous cardiac electrical dynamics. Each beat is a
                transient state transition — the same abstraction used in unforced state-space models{' '}
                <code>x_{'{k+1}'} = A x_k + w_k</code> (no control input <code>B u_k</code>).
              </p>
            </div>
          </>
        )}
      </section>

      <section className={styles.navigationSection}>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={advanceToNextModule}
          disabled={ecgValues.length === 0}
        >
          Next: Biomedical Noise Lab →
        </button>
      </section>
    </div>
  );
}

export default Module1ECGLab;
