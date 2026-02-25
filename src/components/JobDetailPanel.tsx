// src/components/JobDetailPanel.tsx — 任務詳情面板（單一職責：任務詳情的佈局與狀態切換）
import { Hash, Layers, Activity, Cpu, RefreshCw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import InfoCard from './InfoCard';
import ConvergenceChart from './ConvergenceChart';
import type { JobDetail } from '../types/job';

interface Props {
  detail: JobDetail | null;
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
}

export default function JobDetailPanel({ detail, isLoading, error, onRefetch }: Props) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">載入任務詳情…</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="text-rose-400 text-sm mb-2">載入失敗</div>
          <div className="text-gray-500 text-xs mb-4">{error}</div>
          <button
            onClick={onRefetch}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <RefreshCw size={12} /> 重試
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!detail) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-800/60 flex items-center justify-center mx-auto mb-4">
            <Layers size={28} className="text-gray-600" />
          </div>
          <div className="text-gray-500 text-sm">請從左側選擇一個任務</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{detail.title}</h2>
          <div className="flex items-center gap-3 mt-1">
            {detail.status && <StatusBadge status={detail.status} />}
            <span className="text-xs text-gray-500">ID: {detail.id}</span>
          </div>
        </div>
        <button
          onClick={onRefetch}
          className="p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
          title="重新整理"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-4 gap-3">
        <InfoCard icon={Layers} label="問題類型" value={detail.job_type || '-'} />
        <InfoCard icon={Hash} label="參數 N" value={detail.params?.N ?? '-'} />
        <InfoCard icon={Cpu} label="GPU 數量" value={detail.params?.GPUs ?? '-'} />
        <InfoCard icon={Activity} label="迭代次數" value={detail.history_data?.length || 0} />
      </div>

      {/* Chart */}
      <div className="flex-1 bg-gray-800/30 border border-gray-700/40 rounded-xl p-4 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">收斂過程</h3>
          <span className="text-[11px] text-gray-500">
            {detail.history_data?.length || 0} 筆資料點
          </span>
        </div>
        <div className="h-[calc(100%-2rem)]">
          <ConvergenceChart historyData={detail.history_data || []} />
        </div>
      </div>
    </div>
  );
}
