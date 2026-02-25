import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useJobs } from './hooks/useJobs';
import { useJobDetail } from './hooks/useJobDetail';
import { useCreateJob } from './hooks/useCreateJob';
import { deleteJob } from './services/jobService';
import Sidebar from './components/Sidebar';
import JobDetailPanel from './components/JobDetailPanel';
import CreateJobForm from './components/CreateJobForm';
import type { CreateJobPayload } from './types/job';

type ViewMode = 'create' | 'detail';

export default function OptimizationDashboard() {
  // 篩選器狀態
  const [selectedAlgo, setSelectedAlgo] = useState<string>('simulated-annealing');
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('create'); // 首次進入顯示新任務
  const justCreatedRef = useRef(false); // 防止建立後被 useEffect 重設

  // 透過 hooks 串接真實 API
  const { jobList, isLoading: isListLoading, error: listError, refetch: refetchList } = useJobs(selectedAlgo);
  const { detail: jobDetail, isLoading: isDetailLoading, error: detailError, refetch: refetchDetail } = useJobDetail(activeId);
  const { create, isSubmitting, error: createError, reset: resetCreateError } = useCreateJob();

  // 當列表載入完成且已選任務不在列表中時，清除 activeId（跳過剛建立的情況）
  useEffect(() => {
    if (justCreatedRef.current) {
      justCreatedRef.current = false;
      return;
    }
    if (!isListLoading && jobList.length > 0 && activeId !== null) {
      const stillExists = jobList.some((j) => String(j.id) === String(activeId));
      if (!stillExists) {
        setActiveId(null);
        setViewMode('create');
      }
    }
  }, [jobList, isListLoading, activeId]);

  // 選擇任務後自動收合側邊欄，切換至詳情檢視
  const handleSelectJob = (id: string | number) => {
    setActiveId(id);
    setViewMode('detail');
    setSidebarOpen(false);
  };

  // 建立任務
  const handleCreateJob = async (payload: CreateJobPayload) => {
    const result = await create(payload);
    if (result) {
      resetCreateError();
      justCreatedRef.current = true;
      // 先切到詳情檢視
      setActiveId(result.id);
      setViewMode('detail');
      // 切換演算法並重新載入列表（使用 algoOverride 確保用新演算法）
      setSelectedAlgo(payload.algorithm);
      await refetchList(payload.algorithm);
    }
  };

  const handleOpenCreate = () => {
    resetCreateError();
    setViewMode('create');
    setActiveId(null);
    setSidebarOpen(false);
  };

  // 刪除任務
  const handleDeleteJob = async (id: string | number) => {
    try {
      await deleteJob(id);
      // 如果刪除的是當前查看的任務，切回建立頁面
      if (String(activeId) === String(id)) {
        setActiveId(null);
        setViewMode('create');
      }
      await refetchList();
    } catch (err) {
      console.error('刪除任務失敗:', err);
    }
  };

  return (
    <div className="relative flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* 漢堡菜單側邊欄 */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        jobList={jobList}
        isLoading={isListLoading}
        error={listError}
        activeId={activeId}
        selectedAlgo={selectedAlgo}
        onSelectJob={handleSelectJob}
        onDeleteJob={handleDeleteJob}
        onChangeAlgo={setSelectedAlgo}
        onCreateNew={handleOpenCreate}
      />

      {/* 主內容區 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部工具列 + 漢堡按鈕 */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
            aria-label="開啟歷史紀錄"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-medium text-gray-300 tracking-tight">QUBO Dashboard</h1>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'create' ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-lg bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 p-6">
                <h2 className="text-base font-semibold text-white mb-5">建立新任務</h2>
                <CreateJobForm
                  onSubmit={handleCreateJob}
                  isSubmitting={isSubmitting}
                  error={createError}
                />
              </div>
            </div>
          ) : (
            <JobDetailPanel
              detail={jobDetail}
              isLoading={isDetailLoading}
              error={detailError}
              onRefetch={refetchDetail}
            />
          )}
        </main>
      </div>
    </div>
  );
}