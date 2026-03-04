import { useState, useEffect } from 'react';
import { useJobs } from './hooks/useJobs';
import { useJobDetail } from './hooks/useJobDetail';
import { useSolveKnapsack } from './hooks/useSolveKnapsack';
import { createJob, deleteJob } from './services/jobService';
import Sidebar from './components/Sidebar';
import ParamsPage from './components/ParamsPage';
import QuboSetupPage from './components/QuboSetupPage';
import SolveResultPanel from './components/SolveResultPanel';
import QuboMonitorPanel from './components/QuboMonitorPanel';
import type { CreateJobPayload, SimParams, KnapsackSolveRequest, QuboFormData } from './types/job';
import { DEFAULT_QUBO_FORM } from './types/job';

type ViewMode = 'params' | 'qubo-setup' | 'solve-result' | 'dashboard';

const DEFAULT_SIM_PARAMS: SimParams = { timeout: '30', initTemp: '50', coolingRate: '1000' };

export default function OptimizationDashboard() {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('params');

  // 跨頁暂存
  const [simParams, setSimParams] = useState<SimParams>(DEFAULT_SIM_PARAMS);
  const [reusePayload, setReusePayload] = useState<Partial<CreateJobPayload> | null>(null);
  const [quboFormData, setQuboFormData] = useState<QuboFormData>(DEFAULT_QUBO_FORM);

  const { jobList, isLoading: isListLoading, error: listError, refetch: refetchList } = useJobs();
  const { detail: jobDetail, isLoading: isDetailLoading, error: detailError } = useJobDetail(activeId);
  const { solve, isSubmitting, error: solveError, result: solveResult, reset: resetSolveState } = useSolveKnapsack();

  // 任務已從列表消失時返回首頁
  useEffect(() => {
    if (!isListLoading && jobList.length > 0 && activeId !== null) {
      const stillExists = jobList.some((j) => String(j.id) === String(activeId));
      if (!stillExists) { setActiveId(null); setViewMode('params'); }
    }
  }, [jobList, isListLoading, activeId]);

  // ── Page 1 → Page 2 ─────────────────────────────────────────────
  const [pendingPayload, setPendingPayload] = useState<CreateJobPayload | null>(null);

  const handleParamsNext = (payload: CreateJobPayload, params: SimParams) => {
    setPendingPayload(payload);
    setSimParams(params);
    setReusePayload(null);
    resetSolveState();
    setViewMode('qubo-setup');
  };

  // ── Page 2 → Page 1 ─────────────────────────────────────────────
  const handleQuboBack = () => setViewMode('params');

  // ── Page 2 提交（Custom QUBO：直接建立 Job，不過 /solve）───────
  const handleCustomQuboSubmit = (qMatrix: number[][]) => {
    if (pendingPayload) {
      const updatedPayload = {
        ...pendingPayload,
        n_variables: qMatrix.length,
        problem_data: { ...pendingPayload.problem_data, Q_matrix: qMatrix },
      };
      createJob(updatedPayload)
        .then((job) => { setActiveId(job.id); return refetchList(); })
        .catch((err) => console.error('建立自訂 QUBO 任務失敗:', err));
    }
    setViewMode('dashboard');
  };

  // ── Page 2 提交（POST /solve）—————————————————————————
  const handleQuboSubmit = async (payload: KnapsackSolveRequest) => {
    // 1. 即時求解（POST /solve）
    const result = await solve(payload);
    if (result === null) return;

    // 2. 背量建立 Job（不阻塞 UI）
    if (pendingPayload) {
      createJob(pendingPayload)
        .then((job) => { setActiveId(job.id); return refetchList(); })
        .catch((err) => console.error('建立歷史任務失敗:', err));
    }

    // 3. 停在求解結果頁，使用者手動決定是否查看監控
    setViewMode('solve-result');
  };

  // ── 從側邊欄選歷史任務（跳過前兩頁直接進儀錶板） ───────────────
  const handleSelectJob = (id: string | number) => {
    setActiveId(id);
    setViewMode('dashboard');
  };

  // ── 建立新任務（回 Page 1） ──────────────────────────────────────
  const handleOpenCreate = () => {
    resetSolveState();
    setViewMode('params');
    setActiveId(null);
    setPendingPayload(null);
    setReusePayload(null);
    setSimParams(DEFAULT_SIM_PARAMS);
    setQuboFormData(DEFAULT_QUBO_FORM);
  };

  // ── 套用此設定重新執行 ───────────────────────────────────────
  const handleReuseSettings = () => {
    if (!jobDetail) return;
    // 從已完成的 job 提取設定
    setReusePayload({
      task_name:      jobDetail.task_name,
      problem_type:   jobDetail.problem_type,
      n_variables:    jobDetail.n_variables,
      solver_backend: jobDetail.solver_backend,
      core_limit:     jobDetail.core_limit,
      problem_data: {
        generation_method: jobDetail.problem_data?.generation_method ?? 'random',
        seed:              jobDetail.problem_data?.seed,
      },
    });
    // t_start 儲存 N，t_end 儲存 num_iterations
    setSimParams({
      timeout:     String(jobDetail.problem_data?.timeout_seconds ?? 30),
      initTemp:    String(Math.round(jobDetail.t_start ?? 50)),
      coolingRate: String(Math.round(jobDetail.t_end   ?? 1000)),
    });
    resetSolveState();
    setPendingPayload(null);
    setViewMode('params');
  };

  // ── 停止 / 刪除任務
  const handleStopJob = async (id: string | number) => {
    try {
      await deleteJob(id);
      setActiveId(null);
      setViewMode('params');
      await refetchList();
    } catch (err) { console.error('停止任務失敗:', err); }
  };

  const handleDeleteJob = async (id: string | number) => {
    try {
      await deleteJob(id);
      if (String(activeId) === String(id)) { setActiveId(null); setViewMode('params'); }
      await refetchList();
    } catch (err) { console.error('刪除任務失敗:', err); }
  };

  // ── 步驟指示器 ───────────────────────────────────────────────────
  const STEPS = ['參數設定', 'QUBO 設定', '求解監控'];
  const stepIndex = viewMode === 'params' ? 0 : viewMode === 'qubo-setup' ? 1 : 2;
  const showStepper = viewMode !== 'dashboard';

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
        jobList={jobList}
        isLoading={isListLoading}
        error={listError}
        activeId={activeId}
        onSelectJob={handleSelectJob}
        onDeleteJob={handleDeleteJob}
        onCreateNew={handleOpenCreate}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── 頂部工具列（非 dashboard 頁才顯示） ─────────────────── */}
        {showStepper && (
          <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm">
            <span className="text-sm font-medium text-gray-400 tracking-tight">QUBO Dashboard</span>
            <div className="ml-auto flex items-center gap-1">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-700 text-[10px]">›</span>}
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                      i === stepIndex
                        ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                        : i < stepIndex
                        ? 'text-emerald-500'
                        : 'text-gray-600'
                    }`}
                  >
                    {i < stepIndex ? '✓' : `${i + 1}.`} {label}
                  </span>
                </div>
              ))}
            </div>
          </header>
        )}

        {/* ── 主內容 ─────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'params' && (
            <ParamsPage
              onNext={handleParamsNext}
              defaultSimParams={simParams}
              defaultPayload={reusePayload ?? undefined}
              restorePayload={pendingPayload ?? undefined}
            />
          )}

          {viewMode === 'qubo-setup' && (
            <QuboSetupPage
              problemType={pendingPayload?.problem_type ?? 'knapsack'}
              problemData={pendingPayload?.problem_data}
              isSubmitting={isSubmitting}
              error={solveError}
              onBack={handleQuboBack}
              onSubmit={handleQuboSubmit}
              onSubmitCustom={handleCustomQuboSubmit}
              initialFormData={quboFormData}
              onFormChange={setQuboFormData}
            />
          )}

          {viewMode === 'solve-result' && solveResult && (
            <SolveResultPanel
              result={solveResult}
              onBack={() => setViewMode('qubo-setup')}
              onViewMonitor={() => setViewMode('dashboard')}
            />
          )}

          {viewMode === 'dashboard' && (
            <QuboMonitorPanel
              jobId={activeId}
              detail={jobDetail}
              isLoading={isDetailLoading}
              loadError={detailError}
              simParams={simParams}
              onStop={() => activeId !== null && handleStopJob(activeId)}
              onReuseSettings={handleReuseSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
