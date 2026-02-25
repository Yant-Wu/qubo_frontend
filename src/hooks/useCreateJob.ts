// src/hooks/useCreateJob.ts — 管理建立任務的非同步狀態（單一職責：建立任務操作）
import { useState, useCallback } from 'react';
import { createJob } from '../services/jobService';
import type { JobDetail, CreateJobPayload } from '../types/job';

interface UseCreateJobReturn {
  create: (payload: CreateJobPayload) => Promise<JobDetail | null>;
  isSubmitting: boolean;
  error: string | null;
  reset: () => void;
}

export function useCreateJob(): UseCreateJobReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => setError(null), []);

  const create = useCallback(async (payload: CreateJobPayload): Promise<JobDetail | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createJob(payload);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '建立任務失敗';
      setError(msg);
      console.error('useCreateJob error:', msg);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { create, isSubmitting, error, reset };
}
