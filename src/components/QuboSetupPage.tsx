// src/components/QuboSetupPage.tsx — 第二頁：背包問題求解設定
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { KnapsackSolveRequest, KnapsackSolveResponse, QuboFormData } from '../types/job';

interface Props {
  problemType: string;
  problemData?: Record<string, unknown>;
  isSubmitting: boolean;
  error: string | null;
  result: KnapsackSolveResponse | null;
  onBack: () => void;
  onSubmit: (data: KnapsackSolveRequest) => void;
  initialFormData: QuboFormData;
  onFormChange: (data: QuboFormData) => void;
}

export default function QuboSetupPage({ problemType, problemData, isSubmitting, error, result, onBack, onSubmit, initialFormData, onFormChange }: Props) {
  const [items, setItems] = useState(initialFormData.items);
  const [capacity, setCapacity] = useState(initialFormData.capacity);
  const [penalty, setPenalty] = useState(initialFormData.penalty);
  const [penaltyTouched, setPenaltyTouched] = useState(initialFormData.penaltyTouched);
  const [localWarning, setLocalWarning] = useState<string | null>(null);

  // 任何欄位變更時通知 App 層保存
  useEffect(() => {
    onFormChange({ items, capacity, penalty, penaltyTouched });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, capacity, penalty, penaltyTouched]);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.value) > 0 ? Number(item.value) : 0), 0),
    [items]
  );

  const recommendedPenalty = useMemo(() => Number((totalValue * 0.75).toFixed(2)), [totalValue]);

  useEffect(() => {
    if (!penaltyTouched) {
      setPenalty(String(recommendedPenalty));
    }
  }, [recommendedPenalty, penaltyTouched]);

  const addItem = () => {
    setItems((prev) => [...prev, { name: `item-${prev.length + 1}`, weight: '', value: '' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const setItemField = (index: number, field: keyof QuboFormData['items'][number], value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const normalizedItems = useMemo(
    () => items
      .map((item) => ({
        name: item.name.trim(),
        weight: Number(item.weight),
        value: Number(item.value),
      }))
      .filter((item) => item.name !== '' || item.weight > 0 || item.value > 0),
    [items]
  );

  const capacityNumber = Number(capacity);
  const penaltyNumber = Number(penalty);

  const invalidItemExists = normalizedItems.some(
    (item) => item.name === '' || item.weight <= 0 || item.value < 0 || Number.isNaN(item.weight) || Number.isNaN(item.value)
  );

  const isItemsEmpty = normalizedItems.length === 0;
  const isCapacityInvalid = !Number.isFinite(capacityNumber) || capacityNumber <= 0;
  const isPenaltyInvalid = !Number.isFinite(penaltyNumber) || penaltyNumber <= 0;

  const handleSubmit = () => {
    setLocalWarning(null);

    if (isItemsEmpty) {
      setLocalWarning('物品清單不可為空，請至少新增一個有效物品。');
      return;
    }
    if (invalidItemExists) {
      setLocalWarning('每個物品需包含 name，且 weight > 0、value >= 0。');
      return;
    }
    if (isCapacityInvalid) {
      setLocalWarning('capacity 必須為正數。');
      return;
    }
    if (isPenaltyInvalid) {
      setLocalWarning('penalty 必須為正數。');
      return;
    }

    onSubmit({
      items: normalizedItems,
      capacity: capacityNumber,
      penalty: penaltyNumber,
      problem_type: problemType,
      problem_data: problemData,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-5xl bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-5">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionTitle>物品清單（items）</SectionTitle>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Plus size={14} />
                    新增物品
                  </button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1.5">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1.2fr_0.9fr_0.9fr_auto] gap-2 items-center">
                      <input
                        type="text"
                        value={item.name}
                        placeholder="name"
                        onChange={(e) => setItemField(index, 'name', e.target.value)}
                        className={inputCls}
                      />
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.weight}
                        placeholder="weight"
                        onChange={(e) => setItemField(index, 'weight', e.target.value)}
                        className={inputCls}
                      />
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.value}
                        placeholder="value"
                        onChange={(e) => setItemField(index, 'value', e.target.value)}
                        className={inputCls}
                      />
                      <button
                        onClick={() => removeItem(index)}
                        className="text-gray-600 hover:text-rose-400 transition-colors"
                        disabled={items.length <= 1}
                        aria-label="刪除物品"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {isItemsEmpty && (
                  <p className="text-amber-300 text-xs">目前物品清單為空，請至少新增一筆。</p>
                )}
              </section>

              <section className="space-y-3">
                <SectionTitle>容量與懲罰係數</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">capacity</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className={inputCls}
                    />
                    {isCapacityInvalid && <p className="text-amber-300 text-xs">capacity 需大於 0</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">penalty</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={penalty}
                      onChange={(e) => {
                        setPenalty(e.target.value);
                        setPenaltyTouched(true);
                      }}
                      className={inputCls}
                    />
                    {isPenaltyInvalid && <p className="text-amber-300 text-xs">penalty 需大於 0</p>}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-800/80 bg-gray-950/40 px-3 py-2 text-xs text-gray-400">
                  建議 penalty（75% × items 總 value）= <span className="text-indigo-300 font-semibold">{recommendedPenalty}</span>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="space-y-3">
                <SectionTitle>求解結果</SectionTitle>
                {!result ? (
                  <div className="rounded-xl border border-gray-800/80 bg-gray-950/40 p-4 text-sm text-gray-500">
                    尚未求解，請填入參數後按「開始求解」。
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Metric label="total_value" value={String(result.total_value)} />
                      <Metric label="total_weight" value={String(result.total_weight)} />
                      <Metric label="energy" value={String(result.energy)} />
                      <Metric label="computation_time_ms" value={`${result.computation_time_ms} ms`} />
                    </div>
                    <div className="rounded-xl border border-gray-800/80 bg-gray-950/40 p-3">
                      <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">selected items</p>
                      {result.selected_items.length === 0 ? (
                        <p className="text-sm text-gray-500">無被選中的物品</p>
                      ) : (
                        <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
                          {result.selected_items.map((item, index) => (
                            <li key={`${item.name}-${index}`} className="text-sm text-gray-200">
                              {item.name}（w: {item.weight}, v: {item.value}）
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {localWarning && (
                <div className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  {localWarning}
                </div>
              )}

              {error && (
                <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600 text-sm transition-all"
                >
                  <ChevronLeft size={16} />
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      提交中…
                    </>
                  ) : (
                    <>
                      開始求解
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800/80 bg-gray-950/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-100 mt-1">{value}</p>
    </div>
  );
}

const inputCls =
  'bg-gray-800/60 border border-gray-700/50 rounded-lg px-3.5 py-2 text-sm text-gray-100 w-full ' +
  'placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-colors';
