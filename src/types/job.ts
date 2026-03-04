// src/types/job.ts — 共用型別定義

/** 任務列表中的單一項目 */
export interface JobItem {
  id: number | string;
  task_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | string;
  created_at?: string;
}

/** 任務詳細資料 */
export interface JobDetail {
  id: number | string;
  task_name: string;
  problem_type: string;
  n_variables: number;
  solver_backend: string;
  core_limit?: number;
  status?: string;
  problem_data?: {
    generation_method: 'random' | 'upload';
    seed?: number;
    filename?: string;
    timeout_seconds?: number;
  };
  history_data: HistoryDataPoint[];
  computation_time_ms?: number;  // 實際計算時間 (ms)
  t_start?: number;              // AEQTS 鄰域大小 N
  t_end?: number;                // AEQTS 迭代次數
  created_at?: string;
}

/** 收斂歷史資料點 */
export interface HistoryDataPoint {
  iteration: number;
  value: number;
  entropy?: number | null;       // AEQTS Q-bit entropy（0=完全收斂，1=最大不確定）
  is_feasible?: boolean | null;
  [key: string]: unknown;
}

/** API 回應包裝 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
}

/** 建立任務的請求 payload */
export interface CreateJobPayload {
  task_name: string;
  problem_type: string;
  n_variables: number;
  solver_backend: string;
  core_limit?: number;      // Neighbors (N)
  problem_data: {
    generation_method: 'random' | 'upload';
    seed?: number;
    filename?: string;
    num_iterations?: number;   // AEQTS 迭代次數
    timeout_seconds?: number;  // 執行時限（秒）
  };
}

/** AEQTS 求解參數（跨頁傳遞） */
export interface SimParams {
  timeout: string;      // 執行時限（秒）
  initTemp: string;     // 鄰域大小 N
  coolingRate: string;  // 迭代次數
}

/** QuboSetupPage 表單暫存（跨步驟保留，新任務時清空） */
export interface KnapsackItemInput {
  name: string;
  weight: string;
  value: string;
}

export interface QuboFormData {
  items: KnapsackItemInput[];
  capacity: string;
  penalty: string;
  penaltyTouched: boolean;
}

export const DEFAULT_QUBO_FORM: QuboFormData = {
  items: [{ name: 'item-1', weight: '1', value: '10' }],
  capacity: '10',
  penalty: '0',
  penaltyTouched: false,
};

export interface KnapsackItem {
  name: string;
  weight: number;
  value: number;
}

export interface KnapsackSolveRequest {
  items: KnapsackItem[];
  capacity: number;
  penalty: number;
  problem_type: string;
  problem_data?: Record<string, unknown>;
}

export interface KnapsackSolveResponse {
  selected_items: KnapsackItem[];
  total_value: number;
  total_weight: number;
  energy: number;
  computation_time_ms: number;
}

