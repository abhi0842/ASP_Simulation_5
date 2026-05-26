/**
 * Module1ECGLab.jsx
 * ECG Signal Exploration and Physiological Understanding
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as ECGService from '../../services/ECGService';
import styles from './modules.module.css';

export function Module1ECGLab() {
  const {
    rawSamples,
    setRawSamples,
    csvFilePath,
    setCsvFilePath,
    originalFs,
    setOriginalFs,
    advanceToNextModule,
    pipelineData,
    setPipelineData,
    ecgMetadata,
    setEcgMetadata,
  } = useContext(SimulationContext);

  const [presets] = useState(ECGService.getECGPresets());
  const [selectedPreset, setSelectedPreset] = useState('ecg200');
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState({});

  // Load ECG from preset
  const loadECGPreset = useCallback(async (presetId) => {
    setIsLoading(true);
    try {
      const preset = presets.find(p => p.id === presetId);
      if (!preset) throw new Error('Preset not found');

      const base = import.meta.env.BASE_URL || '/';
      const path = base.endsWith('/') ? base : base + '/';
      const fullPath = path + preset.filename;

      const samples = await ECGService.loadECGFromCSV(fullPath);
      setRawSamples(samples);
      setOriginalFs(preset.fs);
      setSelectedPreset(presetId);

      // Analyze quality
      const qualityMetrics = ECGService.analyzeSignalQuality(samples);
      setQuality(qualityMetrics);

      // Detect R-peaks
      const rPeaks = ECGService.detectRPeaks(samples, preset.fs);
      const hr = ECGService.calculateHeartRate(rPeaks, preset.fs);

      setEcgMetadata({
        rPeaks,
        heartRate: hr,
        beatSegments: ECGService.segmentBeats(samples, rPeaks, preset.fs),
        signalQuality: qualityMetrics,
      });

      // Update pipeline
      setPipelineData(prev => ({
        ...prev,
        module1: {
          ecg: samples,
          metadata: { rPeaks, heartRate: hr, quality: qualityMetrics },
        },
      }));
    } catch (error) {
      console.error('Failed to load ECG:', error);
    } finally {
      setIsLoading(false);
    }
  }, [presets, setRawSamples, setOriginalFs, setEcgMetadata, setPipelineData]);

  // Load on mount or when preset changes
  useEffect(() => {
    loadECGPreset(selectedPreset);
  }, [selectedPreset, loadECGPreset]);

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>ECG Dataset Selection</h3>

        <div className={styles.formGroup}>
          <label>Select ECG Dataset:</label>
          <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
            {presets.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p>Loading ECG data...</p>}

        {rawSamples.length > 0 && (
          <>
            <div className={styles.infoBox}>
              <h4>Signal Metadata</h4>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td>Sampling Rate (fs):</td>
                    <td>{originalFs} Hz</td>
                  </tr>
                  <tr>
                    <td>Signal Length:</td>
                    <td>{rawSamples.length} samples ({(rawSamples.length / originalFs).toFixed(2)} sec)</td>
                  </tr>
                  <tr>
                    <td>Heart Rate (estimated):</td>
                    <td>{Math.round(ecgMetadata.heartRate)} BPM</td>
                  </tr>
                  <tr>
                    <td>R-peaks detected:</td>
                    <td>{ecgMetadata.rPeaks?.length || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.infoBox}>
              <h4>Signal Quality Analysis</h4>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td>Mean Value:</td>
                    <td>{quality.mean?.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Std Deviation:</td>
                    <td>{quality.std?.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Min / Max:</td>
                    <td>[{quality.min?.toFixed(4)}, {quality.max?.toFixed(4)}]</td>
                  </tr>
                  <tr>
                    <td>RMS Value:</td>
                    <td>{quality.rms?.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Peak Factor:</td>
                    <td>{quality.peakFactor?.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.educationalBox}>
              <h4>📚 Learning Objective</h4>
              <p>
                ECG signals represent the electrical activity of the heart. Each heartbeat produces a characteristic 
                waveform (P-QRS-T complex). The ECG signal exhibits:
              </p>
              <ul>
                <li><strong>Periodicity:</strong> Repeating patterns at heart rate frequency</li>
                <li><strong>Physiological dynamics:</strong> Heart rate variability, morphology changes</li>
                <li><strong>Noise vulnerability:</strong> Susceptibility to various noise sources</li>
              </ul>
              <p>
                The signal is fundamentally a <strong>dynamic system output</strong>—it evolves according to 
                physiological state transitions. This is why <strong>state-space modeling and Kalman filtering</strong> 
                are powerful tools for ECG analysis.
              </p>
            </div>
          </>
        )}
      </section>

      <section className={styles.navigationSection}>
        <button className={styles.nextBtn} onClick={advanceToNextModule} disabled={rawSamples.length === 0}>
          Next: Biomedical Noise Lab →
        </button>
      </section>
    </div>
  );
}

export default Module1ECGLab;
