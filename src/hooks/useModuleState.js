/**
 * useModuleState.js
 * Custom hook for managing module-specific state and data pipeline
 */

import { useContext, useCallback } from 'react';
import { SimulationContext } from '../context/SimulationContext';

export function useModuleState() {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error('useModuleState must be used within SimulationProvider');
  }

  // Pipeline progression
  const moveToNextModule = useCallback(() => {
    context.advanceToNextModule();
  }, [context]);

  const jumpToModule = useCallback((moduleNum) => {
    context.goToModule(moduleNum);
  }, [context]);

  // Data accessors for common patterns
  const getECGFromPipeline = useCallback(() => {
    return context.pipelineData.module1.ecg || context.rawSamples || [];
  }, [context]);

  const getNoisyECGFromPipeline = useCallback(() => {
    return context.pipelineData.module2.noisyEcg || context.noisySamples || [];
  }, [context]);

  const updateModulePipeline = useCallback((moduleNumber, data) => {
    context.setPipelineData(prev => ({
      ...prev,
      [`module${moduleNumber}`]: {
        ...prev[`module${moduleNumber}`],
        ...data,
      },
    }));
  }, [context]);

  return {
    context,
    currentModule: context.currentModule,
    moveToNextModule,
    jumpToModule,
    getECGFromPipeline,
    getNoisyECGFromPipeline,
    updateModulePipeline,
  };
}

/**
 * Hook for Kalman filtering state management
 */
export function useKalmanState() {
  const context = useContext(SimulationContext);

  return {
    filterState: context.kalmanFilterState,
    setFilterState: context.setKalmanFilterState,
    filterStep: context.filterStep,
    setFilterStep: context.setFilterStep,
    isFiltering: context.isFiltering,
    setIsFiltering: context.setIsFiltering,
    initialConditions: context.initialConditions,
    setInitialConditions: context.setInitialConditions,
    noiselessMode: context.noiselessMode,
    setNoiselessMode: context.setNoiselessMode,
    stateSpaceMatrices: context.stateSpaceMatrices,
    setStateSpaceMatrices: context.setStateSpaceMatrices,
  };
}

/**
 * Hook for visualization data
 */
export function useVisualizationData() {
  const context = useContext(SimulationContext);

  return {
    ecgMetadata: context.ecgMetadata,
    setEcgMetadata: context.setEcgMetadata,
    snrMetrics: context.snrMetrics,
    setSNRMetrics: context.setSNRMetrics,
    stabilityVisualization: context.stabilityVisualization,
    setStabilityVisualization: context.setStabilityVisualization,
  };
}

/**
 * Hook for performance metrics
 */
export function usePerformanceMetrics() {
  const context = useContext(SimulationContext);

  return {
    metrics: context.performanceMetrics,
    setMetrics: context.setPerformanceMetrics,
    report: context.scientificReport,
    setReport: context.setScientificReport,
  };
}
