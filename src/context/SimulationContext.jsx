/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useRef, useState } from "react";

export const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  // ========== Module Navigation & Workflow ==========
  const [currentModule, setCurrentModule] = useState(1); // 1-8
  const [pipelineData, setPipelineData] = useState({
    module1: { ecg: [], metadata: {} },
    module2: { noisyEcg: [], noiseConfig: {} },
    module3: { matrices: { A: null, H: null, Q: null, R: 0.01 }, unforcedMode: true },
    module4: { kalmanResults: null, noiselessMode: true },
    module5: { initialConditions: { x0hat: 0, P0: [[1, 0], [0, 1]] } },
    module6: { stabilityAnalysis: null },
    module7: { comparativeAnalysis: null },
    module8: { metrics: {}, report: '' },
  });

  // ========== Pipeline signal arrays (canonical experiment data) ==========
  const [ecgValues, setEcgValues] = useState([]);
  const [ecgTime, setEcgTime] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // ========== Module 1: ECG Signal Lab ==========
  const [ecgDatasets, setEcgDatasets] = useState([]);
  const [selectedEcgPreset, setSelectedEcgPreset] = useState('ecg200');
  const [ecgMetadata, setEcgMetadata] = useState({
    rPeaks: [],
    heartRate: 0,
    beatSegments: [],
    signalQuality: {},
  });

  // ========== Module 2: Biomedical Noise Lab ==========
  const [noiseConfig, setNoiseConfig] = useState({
    gaussian: { enabled: true, amplitude: 0.01 },
    baseline: { enabled: false, amplitude: 0.2 },
    powerline: { enabled: false, amplitude: 0.05 },
    emg: { enabled: false, amplitude: 0.02 },
    motion: { enabled: false, amplitude: 0.1 },
  });
  const [noisyEcg, setNoisyEcg] = useState([]);
  const [snrMetrics, setSNRMetrics] = useState({ before: 0, after: 0 });

  // ========== Module 3: State-Space Discovery Engine ==========
  const [stateSpaceMatrices, setStateSpaceMatrices] = useState({
    A: [[1.0, 0.002], [0, 0.99]],
    H: [[1, 0]],
    Q: [[0.001, 0], [0, 0.0001]],
    R: 0.01,
  });
  const [unforcedMode, setUnforcedMode] = useState(true);
  // Topic 2B default: Noiseless state-space model (Q=0) is enabled.
  const [noiselessMode, setNoiselessMode] = useState(true);
  const [forcedInputU, setForcedInputU] = useState(0);
  const [systemAnalysis, setSystemAnalysis] = useState({
    eigenvalues: null,
    stability: null,
    observable: true,
  });

  // ========== Module 4: Kalman Filter Immersion Engine ==========
  const [kalmanFilterState, setKalmanFilterState] = useState({
    xFiltered: [],
    xPredicted: [],
    P_trace: [],
    P_predicted_trace: [],
    K_trace: [],
    innovations: [],
    converged: false,
  });
  const [filterStep, setFilterStep] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);

  // ========== Module 5: Initial Condition Dynamics Lab ==========
  const [initialConditions, setInitialConditions] = useState({
    x0hat: 0,
    P0_diag: 1.0,
  });
  const [comparisonRun, setComparisonRun] = useState(null);
  const [convergenceAnalysis, setConvergenceAnalysis] = useState(null);

  // ========== Module 6: Dynamic Stability & Prediction Lab ==========
  const [stabilityVisualization, setStabilityVisualization] = useState({
    eigenvalues: null,
    phasePortrait: [],
    predictionHorizon: 0,
  });

  // ========== Module 7: AI-Assisted Educational Interpretation ==========
  const [educationalInterpretation, setEducationalInterpretation] = useState({
    suggestions: [],
    explanations: {},
  });

  // ========== Module 8: Performance Analytics ==========
  const [performanceMetrics, setPerformanceMetrics] = useState({
    rmse: 0,
    mae: 0,
    snrImprovement: 0,
    convergenceTime: 0,
  });
  const [scientificReport, setScientificReport] = useState('');

  // ========== Legacy state (kept for backward compatibility) ==========
  const [time, setTime] = useState(5);
  const [originalFs, setOriginalFs] = useState(500);
  const [rawSamples, setRawSamples] = useState([]);
  const [noisySamples, setNoisySamples] = useState([]);
  const [cleanSignal, setCleanSignal] = useState([]);
  const [generateECG, setGenerateECG] = useState(false);
  const [applyNoiseTrigger, setApplyNoiseTrigger] = useState(false);
  const [applypsdTrigger, setApplypsdTrigger] = useState(false);
  const [noise, setNoise] = useState({
    baseline: false,
    powerline: false,
    emg: false,
  });
  const [csvFilePath, setCsvFilePath] = useState(() => {
    const base = import.meta.env.BASE_URL || "/";
    const normalizedBase = base.endsWith("/") ? base : base + "/";
    return normalizedBase + "ecg200.csv";
  });
  const prevPathRef = useRef(csvFilePath);
  const [showInstruction, setShowInstruction] = useState(false);
  const buttonRef = useRef(null);
  const [kalmanParams, setKalmanParams] = useState({
    x0hat: 0,
    P0_alpha: 1,
    Q_diag: 0.001,
    R: 0.01,
    fsKalman: 500,
  });
  const [lastKalmanSlider, setLastKalmanSlider] = useState("R");

  // Step-by-step playback on the output panel (slow-motion Kalman walkthrough)
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackPlaying, setPlaybackPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(20);

  const parseCsvECG = useCallback((text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return null;

    const header = lines[0].split(",").map((h) => h.trim());
    const timeIdx = header.findIndex((h) => h === "time_sec" || h.startsWith("time_sec"));
    const rawIdx = header.findIndex((h) => h === "ECG_I" || h.includes("ECG_I"));
    const cleanIdx = header.findIndex(
      (h) => h === "ECG_I_filtered" || h.includes("ECG_I_filtered")
    );

    const resolvedTimeIdx = timeIdx >= 0 ? timeIdx : 0;
    const resolvedRawIdx = rawIdx >= 0 ? rawIdx : 1;
    const resolvedCleanIdx = cleanIdx >= 0 ? cleanIdx : 2;

    const points = [];
    const clean = [];
    const times = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const t = Number.parseFloat(cols[resolvedTimeIdx]);
      const raw = Number.parseFloat(cols[resolvedRawIdx]);
      const ref = Number.parseFloat(cols[resolvedCleanIdx]);
      if (!Number.isFinite(t) || !Number.isFinite(raw) || !Number.isFinite(ref)) continue;
      points.push({ x: t, y: raw });
      clean.push(ref);
      times.push(t);
    }

    if (points.length < 2) return null;

    let dtSum = 0;
    let dtCount = 0;
    for (let i = 1; i < Math.min(times.length, 200); i++) {
      const dt = times[i] - times[i - 1];
      if (dt > 0 && Number.isFinite(dt)) {
        dtSum += dt;
        dtCount++;
      }
    }
    const fs = dtCount > 0 ? 1 / (dtSum / dtCount) : 500;

    return { points, clean, fs };
  }, []);

  const loadECGFromCsv = useCallback(async () => {
    try {
      setRawSamples([]);
      setNoisySamples([]);
      setCleanSignal([]);

      const res = await fetch(csvFilePath);
      if (!res.ok) throw new Error(`Failed to load ECG CSV: ${res.status}`);
      const text = await res.text();
      const parsed = parseCsvECG(text);
      if (!parsed) throw new Error("CSV parse failed (no usable rows).");

      setRawSamples(parsed.points);
      setCleanSignal(parsed.clean);
      setOriginalFs(parsed.fs);

      setApplyNoiseTrigger(false);
      setApplypsdTrigger(false);
    } catch {
      /* load failed — UI shows empty state */
    }
  }, [csvFilePath, parseCsvECG]);

  useEffect(() => {
    if (!generateECG) return;
    loadECGFromCsv();
    setPlaybackIndex(0);
    setPlaybackPlaying(false);
  }, [generateECG, loadECGFromCsv]);

  useEffect(() => {
    setPlaybackIndex(0);
    setPlaybackPlaying(false);
  }, [
    kalmanParams.x0hat,
    kalmanParams.P0_alpha,
    kalmanParams.R,
    kalmanParams.Q_diag,
    csvFilePath,
    time,
  ]);

  useEffect(() => {
    setKalmanParams((p) => ({ ...p, fsKalman: originalFs }));
  }, [originalFs]);

  useEffect(() => {
    setKalmanParams((p) => ({
      ...p,
      x0hat: initialConditions.x0hat,
      P0_alpha: initialConditions.P0_diag,
    }));
  }, [initialConditions.x0hat, initialConditions.P0_diag]);

  // ========== Pipeline helper functions ==========
  const advanceToNextModule = useCallback(() => {
    if (currentModule < 8) {
      setCurrentModule(currentModule + 1);
    }
  }, [currentModule]);

  const goToModule = useCallback((moduleNumber) => {
    if (moduleNumber >= 1 && moduleNumber <= 8) {
      setCurrentModule(moduleNumber);
    }
  }, []);

  const resetPipeline = useCallback(() => {
    setCurrentModule(1);
    setPipelineData({
      module1: { ecg: [], metadata: {} },
      module2: { noisyEcg: [], noiseConfig: {} },
      module3: { matrices: { A: null, H: null, Q: null, R: 0.01 }, unforcedMode: true },
      module4: { kalmanResults: null, noiselessMode: true },
      module5: { initialConditions: { x0hat: 0, P0: [[1, 0], [0, 1]] } },
      module6: { stabilityAnalysis: null },
      module7: { comparativeAnalysis: null },
      module8: { metrics: {}, report: '' },
    });
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        // ========== Module Navigation ==========
        currentModule,
        setCurrentModule,
        advanceToNextModule,
        goToModule,
        resetPipeline,
        pipelineData,
        setPipelineData,

        // ========== Pipeline signals ==========
        ecgValues,
        setEcgValues,
        ecgTime,
        setEcgTime,
        darkMode,
        setDarkMode,

        // ========== Module 1: ECG Signal Lab ==========
        ecgDatasets,
        setEcgDatasets,
        selectedEcgPreset,
        setSelectedEcgPreset,
        ecgMetadata,
        setEcgMetadata,

        // ========== Module 2: Biomedical Noise Lab ==========
        noiseConfig,
        setNoiseConfig,
        noisyEcg,
        setNoisyEcg,
        snrMetrics,
        setSNRMetrics,

        // ========== Module 3: State-Space Discovery Engine ==========
        stateSpaceMatrices,
        setStateSpaceMatrices,
        unforcedMode,
        setUnforcedMode,
        noiselessMode,
        setNoiselessMode,
        forcedInputU,
        setForcedInputU,
        systemAnalysis,
        setSystemAnalysis,

        // ========== Module 4: Kalman Filter Immersion Engine ==========
        kalmanFilterState,
        setKalmanFilterState,
        filterStep,
        setFilterStep,
        isFiltering,
        setIsFiltering,

        // ========== Module 5: Initial Condition Dynamics Lab ==========
        initialConditions,
        setInitialConditions,
        comparisonRun,
        setComparisonRun,
        convergenceAnalysis,
        setConvergenceAnalysis,

        // ========== Module 6: Dynamic Stability & Prediction Lab ==========
        stabilityVisualization,
        setStabilityVisualization,

        // ========== Module 7: AI-Assisted Educational Interpretation ==========
        educationalInterpretation,
        setEducationalInterpretation,

        // ========== Module 8: Performance Analytics ==========
        performanceMetrics,
        setPerformanceMetrics,
        scientificReport,
        setScientificReport,

        // ========== Legacy state (backward compatibility) ==========
        time,
        setTime,
        originalFs,
        setOriginalFs,
        rawSamples,
        setRawSamples,
        noisySamples,
        setNoisySamples,
        cleanSignal,
        setCleanSignal,
        generateECG,
        setGenerateECG,
        applyNoiseTrigger,
        setApplyNoiseTrigger,
        applypsdTrigger,
        setApplypsdTrigger,
        noise,
        setNoise,
        csvFilePath,
        setCsvFilePath,
        prevPathRef,
        showInstruction,
        setShowInstruction,
        buttonRef,
        kalmanParams,
        setKalmanParams,
        lastKalmanSlider,
        setLastKalmanSlider,
        playbackIndex,
        setPlaybackIndex,
        playbackPlaying,
        setPlaybackPlaying,
        playbackSpeed,
        setPlaybackSpeed,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
