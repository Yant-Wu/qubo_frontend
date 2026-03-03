// src/components/SolveResultPanel.tsx — 第三頁（即時求解）：背包問題求解結果
import { ChevronLeft, BarChart2 } from 'lucide-react';
import type { KnapsackSolveResponse } from '../types/job';

interface Props {
  result: KnapsackSolveResponse;
  onBack: () => void;
  onViewMonitor?: () => void;
}

export default function SolveResultPanel({ result, onBack, onViewMonitor }: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center p-6 min-h-full">
        <div className="w-full max-w-5xl bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 p-8 space-y-6">

          {/* 成功橫幅 */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/40">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">✓</div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">求解完成</p>
              <p className="text-xs text-gray-400">
                計算時間：{result.computation_time_ms} ms &nbsp;·&nbsp; Energy：{result.energy}
              </p>
            </div>
            <button
              onClick={onBack}
              className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700/50 hover:border-gray-500 transition-all"
            >
              <ChevronLeft size={14} />
              返回修改
            </button>
            {onViewMonitor && (
              <button
                onClick={onViewMonitor}
                className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-700/50 hover:border-indigo-400 bg-indigo-900/20 hover:bg-indigo-800/30 transition-all"
              >
                <BarChart2 size={14} />
                查看收斂監控
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* 左欄：被選中的物品 */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Selected Items</h3>
              {(!result.selected_items || !Array.isArray(result.selected_items)) ? (
                <div className="text-rose-400 text-sm p-4 rounded-xl border border-rose-800/80 bg-rose-950/40 overflow-auto">
                  <p>無法解析選擇的物品，請檢查 API 回傳格式：</p>
                  <pre className="text-xs mt-2">{JSON.stringify(result, null, 2)}</pre>
                </div>
              ) : result.selected_items.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 rounded-xl border border-gray-800/80 bg-gray-950/40">無被選中的物品</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {result.selected_items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center rounded-lg bg-gray-800/40 border border-gray-700/30 px-3.5 py-2.5">
                      <span className="text-sm text-gray-100 font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500">w: <span className="text-indigo-300 font-mono">{item.weight}</span></span>
                      <span className="text-xs text-gray-500">v: <span className="text-emerald-300 font-mono">{item.value}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 右欄：指標卡片 */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">求解指標</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Total Value"      value={String(result.total_value ?? 'N/A')}          color="emerald" />
                <ResultCard label="Total Weight"     value={String(result.total_weight ?? 'N/A')}         color="indigo" />
                <ResultCard label="Energy"           value={String(result.energy ?? 'N/A')}               color="amber" />
                <ResultCard label="Computation Time" value={`${result.computation_time_ms ?? 'N/A'} ms`} color="gray" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── 指標卡片 ───────────────────────────────────────────────────────
const colorMap = {
  emerald: 'text-emerald-300',
  indigo:  'text-indigo-300',
  amber:   'text-amber-300',
  gray:    'text-gray-300',
} as const;

function ResultCard({ label, value, color }: { label: string; value: string; color: keyof typeof colorMap }) {
  return (
    <div className="rounded-xl border border-gray-800/80 bg-gray-950/40 p-3 space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-sm font-bold font-mono ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
