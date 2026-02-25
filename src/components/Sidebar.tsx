// src/components/Sidebar.tsx — 可收合漢堡菜單側邊欄（單一職責：組合 header + 列表佈局）
import { Cpu, Plus, X } from 'lucide-react';
import AlgorithmSelector from './AlgorithmSelector';
import JobListItem from './JobListItem';
import type { JobItem } from '../types/job';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobList: JobItem[];
  isLoading: boolean;
  error: string | null;
  activeId: string | number | null;
  selectedAlgo: string;
  onSelectJob: (id: string | number) => void;
  onDeleteJob: (id: string | number) => void;
  onChangeAlgo: (algo: string) => void;
  onCreateNew: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  jobList,
  isLoading,
  error,
  activeId,
  selectedAlgo,
  onSelectJob,
  onDeleteJob,
  onChangeAlgo,
  onCreateNew,
}: Props) {
  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 flex flex-col
          bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl shadow-black/40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Cpu size={18} className="text-indigo-400" />
              </div>
              <h2 className="text-base font-semibold text-white tracking-tight">歷史紀錄</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
              aria-label="關閉側邊欄"
            >
              <X size={18} />
            </button>
          </div>
          <AlgorithmSelector value={selectedAlgo} onChange={onChangeAlgo} />

          <button
            onClick={onCreateNew}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                       bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Plus size={16} />
            新任務
          </button>
        </div>

        {/* Job list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">載入中…</span>
            </div>
          ) : error ? (
            <div className="text-center text-rose-400/80 text-xs py-8 px-2">{error}</div>
          ) : jobList.length === 0 ? (
            <div className="text-center text-gray-500 text-xs py-8">尚無任務紀錄</div>
          ) : (
            jobList.map((item) => (
              <JobListItem
                key={item.id}
                item={item}
                isActive={activeId === item.id}
                onSelect={onSelectJob}
                onDelete={onDeleteJob}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}
