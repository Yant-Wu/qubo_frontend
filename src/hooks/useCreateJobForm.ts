// src/hooks/useCreateJobForm.ts — 建立任務表單狀態管理 Hook

import { useState } from 'react';
import type { CreateJobPayload } from '../types/job';

export const PROBLEM_TYPES = [
  { value: 'knapsack', label: '背包問題 (Knapsack)' },
  { value: 'max_cut',  label: '最大割問題 (Max-Cut)' },
  { value: 'custom',   label: '自訂問題 (Custom)' },
] as const;

export const SOLVER_BACKENDS = [
  { value: 'exact',               label: '傳統精確解 (Exact Solver)',               showCores: false, showQPU: false },
  { value: 'simulated_annealing', label: '模擬退火 (Simulated Annealing CPU/GPU)',  showCores: false, showQPU: false },
  { value: 'quantum_annealing',   label: '量子退火 (Quantum Annealing D-Wave)',     showCores: false, showQPU: true  },
] as const;

export interface UseCreateJobFormReturn {
  // 表單欄位
  taskName: string;
  setTaskName: (v: string) => void;
  problemType: string;
  setProblemType: (v: string) => void;
  genMethod: 'random' | 'upload';
  setGenMethod: (v: 'random' | 'upload') => void;
  nVariables: string;
  setNVariables: (v: string) => void;
  seed: string;
  setSeed: (v: string) => void;
  solver: string;
  setSolver: (v: string) => void;
  coreLimit: string;
  setCoreLimit: (v: string) => void;
  qpuQuota: string;
  setQpuQuota: (v: string) => void;

  // 衍生狀態
  selectedSolver: typeof SOLVER_BACKENDS[number];
  coreValid: boolean;
  canSubmit: (isSubmitting: boolean) => boolean;

  // Payload 組裝
  buildPayload: () => CreateJobPayload;
}

export function useCreateJobForm(initialValues?: {
  taskName?: string;
  problemType?: string;
  genMethod?: 'random' | 'upload';
  nVariables?: string;
  seed?: string;
  solver?: string;
  coreLimit?: string;
}): UseCreateJobFormReturn {
  const [taskName,     setTaskName]     = useState(initialValues?.taskName     ?? '');
  const [problemType,  setProblemType]  = useState(initialValues?.problemType  ?? 'knapsack');
  const [genMethod,    setGenMethod]    = useState<'random' | 'upload'>(initialValues?.genMethod ?? 'random');
  const [nVariables,   setNVariables]   = useState(initialValues?.nVariables   ?? '50');
  const [seed,         setSeed]         = useState(initialValues?.seed         ?? '42');
  const [solver,       setSolver]       = useState(initialValues?.solver       ?? 'simulated_annealing');
  const [coreLimit,    setCoreLimit]    = useState(initialValues?.coreLimit    ?? '100');
  const [qpuQuota,     setQpuQuota]     = useState('1000');

  const selectedSolver =
    SOLVER_BACKENDS.find((s) => s.value === solver) ?? SOLVER_BACKENDS[1];

  const coreValid = !selectedSolver.showCores || Number(coreLimit) >= 100;

  const canSubmit = (isSubmitting: boolean) =>
    Boolean(taskName.trim()) && coreValid && !isSubmitting;

  const buildPayload = (): CreateJobPayload => ({
    task_name:      taskName.trim(),
    problem_type:   problemType,
    n_variables:    Number(nVariables) || 50,
    solver_backend: solver,
    problem_data: {
      generation_method: genMethod,
      ...(genMethod === 'random' ? { seed: Number(seed) || 42 } : {}),
    },
    ...(selectedSolver.showCores ? { core_limit: Number(coreLimit) || 100  } : {}),
    ...(selectedSolver.showQPU   ? { core_limit: Number(qpuQuota)  || 1000 } : {}),
  });

  return {
    taskName, setTaskName,
    problemType, setProblemType,
    genMethod, setGenMethod,
    nVariables, setNVariables,
    seed, setSeed,
    solver, setSolver,
    coreLimit, setCoreLimit,
    qpuQuota, setQpuQuota,
    selectedSolver,
    coreValid,
    canSubmit,
    buildPayload,
  };
}
