import { useCallback, useState } from 'react';
import { solveKnapsack } from '../services/solveService';
import type { KnapsackSolveRequest, KnapsackSolveResponse } from '../types/job';

interface UseSolveKnapsackReturn {
  solve: (payload: KnapsackSolveRequest) => Promise<KnapsackSolveResponse | null>;
  isSubmitting: boolean;
  error: string | null;
  result: KnapsackSolveResponse | null;
  reset: () => void;
}

function mapErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return '求解失敗，請稍後再試';
  const match = err.message.match(/^API\s(\d+):?/);
  const status = match ? Number(match[1]) : null;

  if (status === 400) return '輸入參數格式錯誤，請檢查 items、capacity、penalty。';
  if (status === 500) return '後端伺服器發生錯誤，請稍後再試。';
  return err.message || '求解失敗，請稍後再試';
}

export function useSolveKnapsack(): UseSolveKnapsackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KnapsackSolveResponse | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  const solve = useCallback(async (payload: KnapsackSolveRequest): Promise<KnapsackSolveResponse | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await solveKnapsack(payload);
      setResult(response);
      return response;
    } catch (err) {
      setResult(null);
      setError(mapErrorMessage(err));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { solve, isSubmitting, error, result, reset };
}
