// src/components/ParamsPage.tsx — 第一頁：基本資訊 + 求解參數設定
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { CreateJobPayload, SimParams } from '../types/job';
import { useCreateJobForm, PROBLEM_TYPES } from '../hooks/useCreateJobForm';

interface Props {
  onNext: (payload: CreateJobPayload, simParams: SimParams) => void;
  defaultSimParams?: SimParams;
  defaultPayload?: Partial<CreateJobPayload>;  // 重用舊任務（加 copy 後綴）
  restorePayload?: Partial<CreateJobPayload>;  // 上一步返回時原樣還原
}

export default function ParamsPage({ onNext, defaultSimParams, defaultPayload, restorePayload }: Props) {
  // restorePayload 優先（原樣還原），其次 defaultPayload（複製加 copy 後綴）
  const initPayload = restorePayload ?? defaultPayload;
  const copySuffix  = !restorePayload && !!defaultPayload;

  const {
    taskName, setTaskName,
    problemType, setProblemType,
    canSubmit, buildPayload,
  } = useCreateJobForm(initPayload ? {
    taskName:    initPayload.task_name    ? initPayload.task_name + (copySuffix ? ' (copy)' : '') : undefined,
    problemType: initPayload.problem_type,
  } : undefined);

  const isAEQTS = true; // 所有後端均使用 AEQTS 求解器

  const [timeout,     setTimeout_]    = useState(defaultSimParams?.timeout     ?? '30');
  const [initTemp,    setInitTemp]    = useState(defaultSimParams?.initTemp    ?? '50');
  const [coolingRate, setCoolingRate] = useState(defaultSimParams?.coolingRate ?? '1000');

  const handleNext = () => {
    if (!canSubmit(false)) return;
    const payload = buildPayload();
    // 將 AEQTS 參數實際送入 payload
    payload.core_limit = Math.max(1, Number(initTemp) || 50);               // Neighbors (N)
    payload.problem_data = {
      ...payload.problem_data,
      num_iterations:  Math.max(100, Number(coolingRate) || 1000),           // Iterations
      timeout_seconds: Math.max(1,   Number(timeout)    || 30),             // 執行時限
    };
    onNext(payload, { timeout, initTemp, coolingRate });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-5xl bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 p-8">
          
          <div className="grid grid-cols-2 gap-8">
            {/* ── 左欄：基本設定 + 求解器 ───────────────────────────────── */}
            <div className="space-y-5">
              <SectionTitle>基本設定</SectionTitle>
              
              <CompactField label="任務標題" required>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. TSP benchmark"
                  className={compactInputCls}
                />
              </CompactField>

              <CompactField label="問題類型" required>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  className={compactInputCls}
                >
                  {PROBLEM_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </CompactField>


            </div>

            {/* ── 右欄：相關參數 ───────────────────────────────────────── */}
            <div className="space-y-5">
              <SectionTitle>相關參數</SectionTitle>
              
              <CompactField label="Timeout" hint="秒">
                <input type="number" min={1} step={1} value={timeout}
                  onChange={(e) => setTimeout_(e.target.value)} className={compactInputCls} />
              </CompactField>

              {isAEQTS && (
                <>
                  <SectionTitle>AEQTS 參數</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <CompactField label="Neighbors (N)" hint="鄰域大小">
                      <input type="number" min={1} step={1} value={initTemp}
                        onChange={(e) => setInitTemp(e.target.value)} className={compactInputCls} />
                    </CompactField>
                    <CompactField label="Iterations" hint="迭代次數">
                      <input type="number" min={100} step={100} value={coolingRate}
                        onChange={(e) => setCoolingRate(e.target.value)} className={compactInputCls} />
                    </CompactField>
                  </div>
                </>
              )}

              {/* 下一步按鈕 */}
              <button
                onClick={handleNext}
                disabled={!canSubmit(false)}
                className="w-full mt-8 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
              >
                下一步：QUBO 設定
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 小元件 ────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{children}</h3>;
}

function CompactField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}{required && <span className="text-rose-400">*</span>}
        </label>
        {hint && <span className="text-[10px] text-gray-600 font-normal">({hint})</span>}
      </div>
      {children}
    </fieldset>
  );
}

const compactInputCls =
  'bg-gray-800/60 border border-gray-700/50 rounded-lg px-3.5 py-2 text-sm text-gray-100 w-full ' +
  'placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-colors';
