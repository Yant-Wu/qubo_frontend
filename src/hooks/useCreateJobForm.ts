// src/hooks/useCreateJobForm.ts — 建立任務表單狀態管理 Hook

import { useState } from 'react';
import type { CreateJobPayload } from '../types/job';

export const PROBLEM_TYPES = [
  { value: 'knapsack', label: '背包問題 (Knapsack)' },
  { value: 'max_cut',  label: '最大割問題 (Max-Cut)' },
  { value: 'custom',   label: '自訂問題 (Custom)' },
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

  // 衍生狀態
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
}): UseCreateJobFormReturn {
  const [taskName,     setTaskName]     = useState(initialValues?.taskName     ?? '');
  const [problemType,  setProblemType]  = useState(initialValues?.problemType  ?? 'knapsack');
  const [genMethod,    setGenMethod]    = useState<'random' | 'upload'>(initialValues?.genMethod ?? 'random');
  const [nVariables,   setNVariables]   = useState(initialValues?.nVariables   ?? '50');
  const [seed,         setSeed]         = useState(initialValues?.seed         ?? '42');

  const canSubmit = (isSubmitting: boolean) =>
    Boolean(taskName.trim()) && !isSubmitting;

  const buildPayload = (): CreateJobPayload => ({
    task_name:      taskName.trim(),
    problem_type:   problemType,
    n_variables:    Number(nVariables) || 50,
    solver_backend: 'simulated_annealing',  // 固定使用 AEQTS
    problem_data: {
      generation_method: genMethod,
      ...(genMethod === 'random' ? { seed: Number(seed) || 42 } : {}),
    },
  });

  return {
    taskName, setTaskName,
    problemType, setProblemType,
    genMethod, setGenMethod,
    nVariables, setNVariables,
    seed, setSeed,
    canSubmit,
    buildPayload,
  };
}
