import { request } from './apiClient';
import type { KnapsackSolveRequest, KnapsackSolveResponse, CreateJobPayload } from '../types/job';

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

/** /api/jobs/solve 端點的後端原始回應（包含 ApiResponse 包裝）*/
interface SolveAndCreateRaw {
  job_id: string;
  energy: number;
  selected_items: { name: string; weight: number; value: number }[];
  total_value: number;
  total_weight: number;
  computation_time_ms: number;
  device: string;
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
    job_id:              '',
    // /solve 直接回傳物品物件，不是 index
    selected_items:      raw.interpretation.selected_items,
    total_value:         raw.interpretation.total_value,
    total_weight:        raw.interpretation.total_weight,
    energy:              raw.energy,
    computation_time_ms: raw.computation_time_ms,
  };
}

/**
 * 統一求解端點：POST /api/jobs/solve
 * 同步執行 AEQTS、建立 Job、儲存收斂歷史，一次呼叫回傳 job_id 與求解結果。
 */
export async function solveAndCreate(payload: CreateJobPayload): Promise<KnapsackSolveResponse> {
  const raw = await request<{ data: SolveAndCreateRaw }>('/api/jobs/solve', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const d = raw.data;
  return {
    job_id:              d.job_id,
    selected_items:      d.selected_items,
    total_value:         d.total_value,
    total_weight:        d.total_weight,
    energy:              d.energy,
    computation_time_ms: d.computation_time_ms,
    device:              d.device,
  };
}
