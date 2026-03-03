import { request } from './apiClient';
import type { KnapsackSolveRequest, KnapsackSolveResponse } from '../types/job';

/** /api/solve/knapsack 端點的原始回應結構（無 ApiResponse 包裝）*/
interface RawSolveResponse {
  status: 'success' | 'error';
  solution: number[];
  energy: number;
  interpretation: {
    selected_items: { name: string; weight: number; value: number }[];
    total_value: number;
    total_weight: number;
  };
  computation_time_ms: number;
}

export async function solveKnapsack(payload: KnapsackSolveRequest): Promise<KnapsackSolveResponse> {
  // 呼叫 /api/solve/knapsack（dimod CQM 端點），直接回傳 RawSolveResponse，無 ApiResponse 包裝
  const raw = await request<RawSolveResponse>('/api/solve/knapsack', {
    method: 'POST',
    body: JSON.stringify({
      items:    payload.items,
      capacity: payload.capacity,
      penalty:  payload.penalty,
    }),
  });

  if (raw.status !== 'success') {
    throw new Error('求解失敗');
  }

  return {
    // /solve 直接回傳物品物件，不是 index
    selected_items:      raw.interpretation.selected_items,
    total_value:         raw.interpretation.total_value,
    total_weight:        raw.interpretation.total_weight,
    energy:              raw.energy,
    computation_time_ms: raw.computation_time_ms,
  };
}
