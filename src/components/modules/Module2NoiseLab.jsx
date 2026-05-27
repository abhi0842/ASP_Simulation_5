/**
 * Module2NoiseLab.jsx
 * Biomedical Noise Generation and Analysis
 */

import { useContext, useEffect, useState } from 'react';
import { SimulationContext } from '../../context/SimulationContext';
import * as NoiseService from '../../services/NoiseService';
import styles from './modules.module.css';

export function Module2NoiseLab() {
  const {
    ecgValues,
    originalFs,
    noiseConfig,
    setNoiseConfig,
    snrMetrics,
    advanceToNextModule,
  } = useContext(SimulationContext);

  const [noisePresets] = useState(NoiseService.getNoisePresets());
  const [selectedNoiseLevel, setSelectedNoiseLevel] = useState('mild');
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [psdData, setPsdData] = useState(null);

  useEffect(() => {
    if (!showSpectrum || ecgValues.length === 0) return;
    const psd = NoiseService.computePSD(ecgValues, originalFs);
    setPsdData(psd);
  }, [showSpectrum, ecgValues]);

  // Load preset
  const loadPreset = (presetId) => {
    const preset = noisePresets.find(p => p.id === presetId);
    if (preset) {
      setNoiseConfig(preset.config);
      setSelectedNoiseLevel(presetId);
    }
  };

  if (ecgValues.length === 0) {
    return (
      <div className={styles.moduleContainer}>
        <p className={styles.warning}>⚠️ Please complete Module 1 first to load ECG data.</p>
      </div>
    );
  }

  return (
    <div className={styles.moduleContainer}>
      <section className={styles.moduleSection}>
        <h3>Biomedical Noise Configuration</h3>

        <div className={styles.formGroup}>
          <label>Quick Presets:</label>
          <select value={selectedNoiseLevel} onChange={(e) => loadPreset(e.target.value)}>
            {noisePresets.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.noiseControls}>
          <div className={styles.noiseSlider}>
            <label>
              <input
                type="checkbox"
                checked={noiseConfig.gaussian?.enabled || false}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  gaussian: { ...prev.gaussian, enabled: e.target.checked },
                }))}
              />
              Gaussian Noise
            </label>
            {noiseConfig.gaussian?.enabled && (
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={noiseConfig.gaussian?.amplitude || 0.01}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  gaussian: { ...prev.gaussian, amplitude: parseFloat(e.target.value) },
                }))}
              />
            )}
            <span>{noiseConfig.gaussian?.amplitude?.toFixed(3)}</span>
          </div>

          <div className={styles.noiseSlider}>
            <label>
              <input
                type="checkbox"
                checked={noiseConfig.baseline?.enabled || false}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  baseline: { ...prev.baseline, enabled: e.target.checked },
                }))}
              />
              Baseline Wander
            </label>
            {noiseConfig.baseline?.enabled && (
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={noiseConfig.baseline?.amplitude || 0.2}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  baseline: { ...prev.baseline, amplitude: parseFloat(e.target.value) },
                }))}
              />
            )}
            <span>{noiseConfig.baseline?.amplitude?.toFixed(3)}</span>
          </div>

          <div className={styles.noiseSlider}>
            <label>
              <input
                type="checkbox"
                checked={noiseConfig.powerline?.enabled || false}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  powerline: { ...prev.powerline, enabled: e.target.checked },
                }))}
              />
              Powerline Interference (50/60 Hz)
            </label>
            {noiseConfig.powerline?.enabled && (
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={noiseConfig.powerline?.amplitude || 0.05}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  powerline: { ...prev.powerline, amplitude: parseFloat(e.target.value) },
                }))}
              />
            )}
            <span>{noiseConfig.powerline?.amplitude?.toFixed(3)}</span>
          </div>

          <div className={styles.noiseSlider}>
            <label>
              <input
                type="checkbox"
                checked={noiseConfig.emg?.enabled || false}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  emg: { ...prev.emg, enabled: e.target.checked },
                }))}
              />
              Muscle Artifact (EMG)
            </label>
            {noiseConfig.emg?.enabled && (
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.01"
                value={noiseConfig.emg?.amplitude || 0.02}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  emg: { ...prev.emg, amplitude: parseFloat(e.target.value) },
                }))}
              />
            )}
            <span>{noiseConfig.emg?.amplitude?.toFixed(3)}</span>
          </div>

          <div className={styles.noiseSlider}>
            <label>
              <input
                type="checkbox"
                checked={noiseConfig.motion?.enabled || false}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  motion: { ...prev.motion, enabled: e.target.checked },
                }))}
              />
              Motion Artifact
            </label>
            {noiseConfig.motion?.enabled && (
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.02"
                value={noiseConfig.motion?.amplitude || 0.1}
                onChange={(e) => setNoiseConfig(prev => ({
                  ...prev,
                  motion: { ...prev.motion, amplitude: parseFloat(e.target.value) },
                }))}
              />
            )}
            <span>{noiseConfig.motion?.amplitude?.toFixed(3)}</span>
          </div>
        </div>

        <div className={styles.infoBox}>
          <h4>SNR (live pipeline)</h4>
          <p>Before noise: <strong>{snrMetrics.before?.toFixed?.(1) ?? '—'} dB</strong></p>
          <p>After noise: <strong>{snrMetrics.after?.toFixed?.(1) ?? '—'} dB</strong></p>
          <p className={styles.hint}>Noise propagates automatically to Kalman filtering in Modules 4–8.</p>
        </div>

        <button type="button" className={styles.btn} onClick={() => setShowSpectrum(!showSpectrum)}>
          {showSpectrum ? 'Hide' : 'Show'} spectral preview
        </button>
        {psdData && showSpectrum && (
          <p className={styles.hint}>
            PSD computed ({psdData.frequencies.length} bins). See frequency panel →
          </p>
        )}

        <div className={styles.educationalBox}>
          <h4>📚 Biomedical Noise Sources</h4>
          <ul>
            <li><strong>Gaussian Noise:</strong> Thermal noise from electronic components</li>
            <li><strong>Baseline Wander:</strong> Low-frequency drift due to electrode movement</li>
            <li><strong>Powerline Interference:</strong> 50/60 Hz mains frequency coupling</li>
            <li><strong>EMG Artifact:</strong> High-frequency muscle activity interference</li>
            <li><strong>Motion Artifact:</strong> Sudden shifts from electrode motion</li>
          </ul>
          <p>
            <strong>Key Insight:</strong> Kalman filtering is designed to estimate the true signal 
            despite these corruptions. By tuning Q and R, we tell the filter how much to trust 
            our model versus our noisy measurements.
          </p>
        </div>
      </section>

      <section className={styles.navigationSection}>
        <button className={styles.nextBtn} onClick={advanceToNextModule}>
          Next: State-Space Engine →
        </button>
      </section>
    </div>
  );
}

export default Module2NoiseLab;
