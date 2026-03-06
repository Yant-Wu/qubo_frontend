// src/components/QuboMonitorPanel.tsx — 監控儀錶板：歷史任務狀態跟蹤
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Play } from 'lucide-react';
import type { JobDetail, SimParams } from '../types/job';
import type { KnapsackSolveResponse } from '../types/job';
import { useQuboSimulation } from '../hooks/useQuboSimulation';
import EnergyConvergenceChart from './EnergyConvergenceChart';
import EntropyChart from './EntropyChart';
import QMatrixHeatmap from './QMatrixHeatmap';

type ChartTab = 'convergence' | 'entropy' | 'heatmap';

interface Props {
  jobId: string | number | null;
  detail: JobDetail | null;
  isLoading?: boolean;
  loadError?: string | null;
  simParams?: SimParams;
  isSolving?: boolean;
  solveResult?: KnapsackSolveResponse | null;
  onStop: () => void;
  onReuseSettings?: () => void;
}

// ── 閃爍數傀元件 ─────────────────────────────────────────────────
function FlickerValue({ value, large = false }: { value: string; large?: boolean }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      if (value !== '—') {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 350);
        return () => clearTimeout(t);
      }
    }
  }, [value]);
  return (
    <span
      className={[
        'font-mono transition-all duration-150 leading-none',
        large ? 'text-2xl font-bold' : 'text-base font-semibold',
        flash ? 'text-white drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]' : 'text-emerald-300',
      ].join(' ')}
    >
      {value}
    </span>
  );
}

// ── 主元件 ──────────────────────────────────────────────────────────
export default function QuboMonitorPanel({ jobId, detail, isLoading = false, loadError, simParams, isSolving = false, solveResult, onStop, onReuseSettings }: Props) {
  const {
    paramTimeout, paramInitTemp, paramCoolingRate,
    simHistory,
    isRunning, isCompleted,
    handlePause,
    numReads: _numReads, iterCount, progress: _progress,
    bestObjective, tts, feasiblePct,
  } = useQuboSimulation(jobId, detail, simParams);

  // 優先使用 jobDetail 裡儲存的結果（刷新後也存在），其次才用 solveResult這次小時的記憶
  const pd = detail?.problem_data;
  const displaySelected: Array<{ name: string; weight: number; value: number }> =
    (pd?.selected_items && pd.selected_items.length > 0)
      ? pd.selected_items
      : (solveResult?.selected_items ?? []);
  const displayTotalValue  = pd?.total_value  ?? solveResult?.total_value;
  const displayTotalWeight = pd?.total_weight ?? solveResult?.total_weight;
  const displayTimeMs = solveResult?.computation_time_ms ?? detail?.computation_time_ms;

  const [activeTab, setActiveTab] = useState<ChartTab>('convergence');

  // ── 載入中 / 錯誤狀態（優先顯示，避免黑屏） ───────────────────
  if (isLoading && detail === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">載入任務資料中…</p>
        </div>
      </div>
    );
  }

  if (loadError && detail === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-3 max-w-sm px-6">
          <p className="text-rose-400 text-sm font-semibold">無法載入任務</p>
          <p className="text-gray-500 text-xs">{loadError}</p>
          <button
            onClick={onStop}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
          >
            ← 返回首頁
          </button>
        </div>
      </div>
    );
  }

  // ── Status ──────────────────────────────────────────────────────
  const backendStatus = detail?.status;
  const statusLabel = backendStatus ?? (isRunning ? 'running' : isCompleted ? 'completed' : 'idle');
  const statusColor = statusLabel === 'running'
    ? 'bg-emerald-900/40 text-emerald-400'
    : statusLabel === 'completed'
    ? 'bg-indigo-900/40 text-indigo-300'
    : 'bg-gray-800/60 text-gray-500';
  const dotColor = statusLabel === 'running'
    ? 'bg-emerald-400 animate-pulse'
    : statusLabel === 'completed'
    ? 'bg-indigo-400'
    : 'bg-gray-600';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── 主體：左側 + 右側圖表 ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── 左側面板 ─────────────────────────────────────────────── */}
        <aside className="w-60 flex-shrink-0 flex flex-col gap-3 p-4 border-r border-gray-800/60 bg-gray-900/40 overflow-y-auto">

          {/* 求解參數（只讀） */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              此次參數紀錄
            </p>
            {/* ── 任務基本資訊 ── */}
            <ReadRow label="Task Name"     value={detail?.task_name ?? '—'} />
            <ReadRow label="Problem Type"  value={detail?.problem_type ?? '—'} />
            <ReadRow
              label="Generation"
              value={
                detail?.problem_type === 'custom'
                  ? `custom (${detail?.n_variables ?? '?'}×${detail?.n_variables ?? '?'})`
                  : (detail?.problem_data?.generation_method ?? '—')
              }
            />
            {detail?.problem_data?.generation_method === 'random' && detail?.problem_data?.seed !== undefined && (
              <ReadRow label="Seed" value={String(detail.problem_data.seed)} />
            )}
            {/* ── 分隔線 ── */}
            <div className="border-t border-gray-700/40 my-1" />
            {/* ── 求解參數 ── */}
            <ReadRow label="Variables"     value={String(detail?.n_variables ?? '—')} />
            <ReadRow label="Timeout"       value={paramTimeout ? `${paramTimeout} s` : '—'} />
            <ReadRow label="Neighbors (N)" value={paramInitTemp} />
            <ReadRow label="Iterations"    value={paramCoolingRate} />
            {/* ── GPU/CPU 裝置桜── */}
            {detail?.compute_device && (
              <>
                <div className="border-t border-gray-700/40 my-1" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-500">Compute</span>
                  {detail.compute_device === 'gpu' || detail.compute_device === 'cuda' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                                    bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                      ⚡ GPU
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                                    bg-gray-700/50 text-gray-400 border border-gray-600/50">
                      ■ CPU
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 最佳化指標（大字 + 閃爍） */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-3 space-y-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              最佳化結果
            </p>
            <MetricBlock label="Best Objective">
              <FlickerValue value={bestObjective} large />
            </MetricBlock>
            <MetricBlock label="TTS">
              <FlickerValue value={tts} large />
            </MetricBlock>
            <MetricBlock label="Feasible Solutions">
              <FlickerValue value={feasiblePct !== '—' ? `${feasiblePct} %` : '—'} large />
            </MetricBlock>
            {solveResult && (
              <>
                <div className="border-t border-gray-700/40 pt-1 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Total Value</span>
                    <span className="font-mono text-emerald-300 font-semibold">{displayTotalValue ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Total Weight</span>
                    <span className="font-mono text-indigo-300 font-semibold">{displayTotalWeight ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Time</span>
                    <span className="font-mono text-gray-300">{displayTimeMs != null ? `${displayTimeMs} ms` : '—'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 選中物品清單 */}
          {displaySelected.length > 0 && (
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Selected Items ({displaySelected.length})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {displaySelected.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-gray-900/60 border border-gray-700/30 px-2.5 py-1.5">
                    <span className="text-[11px] text-gray-100 font-medium truncate flex-1">{item.name}</span>
                    <span className="text-[10px] text-gray-500 shrink-0">w:<span className="text-indigo-300 font-mono ml-0.5">{item.weight}</span></span>
                    <span className="text-[10px] text-gray-500 shrink-0">v:<span className="text-emerald-300 font-mono ml-0.5">{item.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1" />

          {statusLabel === 'running' && (
            <div className="text-center text-[11px] text-emerald-300 font-medium py-1">後端運算中…</div>
          )}
          {statusLabel === 'completed' && (
            <div className="text-center text-[11px] text-indigo-300 font-medium py-1">✓ 後端回傳完成</div>
          )}
          {statusLabel !== 'running' && statusLabel !== 'completed' && (
            <div className="text-center text-[11px] text-gray-500 font-medium py-1">等待後端排程</div>
          )}

          {/* 套用此設定重新執行 */}
          {onReuseSettings && (
            <button
              onClick={onReuseSettings}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-100 text-xs font-medium transition-colors border border-indigo-700/40">
              ↺ 套用此設定重新執行
            </button>
          )}
          <button
            onClick={() => { handlePause(); onStop(); }}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-gray-500 hover:text-rose-400 text-xs transition-colors">
            ← 離開並刪除任務
          </button>
        </aside>

        {/* ── 右側：圖表區 ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* 頂部標題列 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-200">收斂監控</span>
            {detail?.task_name && (
              <span className="text-xs text-gray-500 truncate">— {detail.task_name}</span>
            )}
            <span className={`ml-auto flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full ${statusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              {statusLabel}
            </span>
          </div>

          {/* Tab 切換按鈕 */}
          <div className="flex gap-1 flex-shrink-0">
            {(['convergence', 'entropy', 'heatmap'] as ChartTab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-900/40'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60'
                }`}>
                {tab === 'convergence' ? 'Objective Chart'
                  : tab === 'entropy' ? 'Entropy Chart'
                  : 'Q Matrix Heatmap'}
              </button>
            ))}
          </div>

          {/* 主圖表 */}
          {!isRunning && !isCompleted && iterCount === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                {isSolving ? (
                  <>
                    <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto" />
                    <div>
                      <p className="text-gray-300 text-sm font-medium">後端運算中…</p>
                      <p className="text-gray-600 text-xs mt-1">AEQTS 正在求解，請稍候</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mx-auto">
                      <Play size={28} className="text-indigo-400 ml-1" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium">等待資料</p>
                      <p className="text-gray-600 text-xs mt-1">
                        {detail === null ? '正在取得任務資料…' : '後端尚未開始運算，請稍候。'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gray-800/30 border border-gray-700/40 rounded-xl overflow-hidden min-h-0">
              {activeTab === 'convergence' ? (
                <EnergyConvergenceChart history={simHistory} />
              ) : activeTab === 'entropy' ? (
                <EntropyChart history={simHistory} />
              ) : (
                <QMatrixHeatmap
                  n={detail?.n_variables ?? 8}
                  seed={typeof jobId === 'number' ? jobId : Number(jobId) || 0}
                />
              )}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

// ── 只讀參數列 ─────────────────────────────────────────────────────
function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className="text-[11px] font-mono text-indigo-300">{value}</span>
    </div>
  );
}

// ── 大字指標區塊 ───────────────────────────────────────────────────
function MetricBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}
