// src/hooks/useJobDetail.ts — 管理單一任務詳情狀態
import { useState, useEffect, useCallback } from 'react';
import { fetchJobDetail } from '../services/jobService';
import type { JobDetail } from '../types/job';

interface UseJobDetailReturn {
  detail: JobDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobDetail(activeId: string | number | null): UseJobDetailReturn {
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (activeId == null) {
      setDetail(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJobDetail(activeId);
      setDetail(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `無法取得任務 ${activeId} 的詳情`;
      setError(msg);
      console.error('useJobDetail error:', msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  return { detail, isLoading, error, refetch: load };
}
