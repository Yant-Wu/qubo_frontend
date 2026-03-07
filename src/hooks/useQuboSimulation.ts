// src/hooks/useQuboSimulation.ts — QUBO 模擬狀態管理 Hook

import { useState, useEffect, useCallback } from 'react';
import type { JobDetail, SimParams } from '../types/job';
import type { HistoryDataPoint } from '../types/job';

type SimPoint = HistoryDataPoint;

export interface UseQuboSimulationReturn {
  // 可編輯參數
  paramTimeout: string;
  setParamTimeout: (v: string) => void;
  paramInitTemp: string;
  setParamInitTemp: (v: string) => void;
  paramCoolingRate: string;
  setParamCoolingRate: (v: string) => void;

  // 模擬狀態
  simHistory: SimPoint[];
  isRunning: boolean;
  isCompleted: boolean;

  // 操作
  handleStart: () => void;
  handlePause: () => void;

  // 衍生計算值
  iterCount: number;

  bestObjective: string;
  tts: string;
  feasiblePct: string;
}

export function useQuboSimulation(
  jobId: string | number | null,
  detail: JobDetail | null,
  externalSimParams?: SimParams
): UseQuboSimulationReturn {
  const backendHistory = detail?.history_data ?? [];
  const backendStatus = detail?.status ?? 'pending';

  // ── 可編輯參數 ─────────────────────────────────────────────────
  const [paramTimeout, setParamTimeout] = useState<string>(externalSimParams?.timeout ?? '30');
  const [paramInitTemp, setParamInitTemp] = useState<string>(externalSimParams?.initTemp ?? '50');
  const [paramCoolingRate, setParamCoolingRate] = useState<string>(externalSimParams?.coolingRate ?? '1000');

  // ── 模擬狀態 ───────────────────────────────────────────────────
  const [simHistory, setSimHistory] = useState<SimPoint[]>(backendHistory);
  const [isRunning, setIsRunning] = useState<boolean>(backendStatus === 'running');
  const [isCompleted, setIsCompleted] = useState<boolean>(backendStatus === 'completed');

  // ── jobId/detail 切換時改以後端資料為準 ───────────────────────
  useEffect(() => {
    setParamTimeout(externalSimParams?.timeout ?? String(detail?.problem_data?.timeout_seconds ?? 30));
    // t_start 儲存 AEQTS 鄰域大小 N；t_end 儲存實際迭代次數
    const N       = detail?.t_start ?? 50;
    const numIter = detail?.t_end   ?? Math.max(1000, (detail?.n_variables ?? 0) * 100);
    setParamInitTemp(externalSimParams?.initTemp ?? String(Math.round(N)));
    setParamCoolingRate(externalSimParams?.coolingRate ?? String(Math.round(numIter)));
    setSimHistory(detail?.history_data ?? []);
    setIsRunning((detail?.status ?? '') === 'running');
    setIsCompleted((detail?.status ?? '') === 'completed');
  }, [jobId, detail, externalSimParams]);

  // ── 正式環境由後端執行，不在前端啟動本地模擬 ─────────────────
  const handleStart = useCallback(() => {}, []);

  // ── 正式環境暫不在前端控制暫停 ───────────────────────────────
  const handlePause = useCallback(() => {}, []);

  // ── 衍生計算值 ─────────────────────────────────────────────────
  // 目前從後端收到的最後一個迭代編號（history 將 iteration 儲存在 d.iteration）
  const lastIteration = simHistory.length > 0
    ? (simHistory[simHistory.length - 1].iteration ?? simHistory.length)
    : 0;

  const iterCount = lastIteration;  // 實際 AEQTS 迭代次數

  // 最佳目標値（越大越好，如背包總價値）
  const bestObjective =
    iterCount > 0
      ? Math.max(...simHistory.map((d) => d.value)).toFixed(4)
      : '—';

  // TTS = 後端實際計算時間
  const tts = detail?.computation_time_ms != null
    ? `${detail.computation_time_ms.toFixed(1)} ms`
    : '—';

  // Feasible % = 历史中 is_feasible=true 的比例（對有記錄可行性的 job 才顯示）
  const feasiblePct = (() => {
    if (iterCount === 0) return '—';
    const annotated = simHistory.filter((d) => d.is_feasible != null);
    if (annotated.length === 0) return '—';  // 舊資料無 is_feasible 欄位
    const feasibleCount = annotated.filter((d) => d.is_feasible === true).length;
    return ((feasibleCount / annotated.length) * 100).toFixed(1);
  })();

  return {
    paramTimeout, setParamTimeout,
    paramInitTemp, setParamInitTemp,
    paramCoolingRate, setParamCoolingRate,
    simHistory, isRunning, isCompleted,
    handleStart, handlePause,
    iterCount,
    bestObjective, tts, feasiblePct,
  };
}
