// src/types/job.ts — 共用型別定義

/** 任務列表中的單一項目 */
export interface JobItem {
  id: number | string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | string;
  created_at?: string;
}

/** 任務參數 */
export interface JobParams {
  N: number | string;
  [key: string]: unknown; // 允許額外參數
}

/** 任務詳細資料 */
export interface JobDetail {
  id: number | string;
  title: string;
  job_type: string;
  status?: string;
  params: JobParams;
  history_data: HistoryDataPoint[];
  created_at?: string;
}

/** 收斂歷史資料點 */
export interface HistoryDataPoint {
  iteration: number;
  value: number;
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
  title: string;
  job_type: string;
  algorithm: string;
  params: Record<string, unknown>;
}
