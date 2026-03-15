// src/components/QuboSetupPage.tsx — 第二頁：QUBO / 背包問題求解設定
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload } from 'lucide-react';
import type { KnapsackSolveRequest, QuboFormData } from '../types/job';

interface Props {
  problemType: string;
  problemData?: Record<string, unknown>;
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (data: KnapsackSolveRequest) => void;
  initialFormData: QuboFormData;
  onFormChange: (data: QuboFormData) => void;
}

export default function QuboSetupPage({
  problemType, problemData, isSubmitting, error,
  onBack, onSubmit, initialFormData, onFormChange,
}: Props) {
  const [items, setItems] = useState(initialFormData.items);
  const [capacity, setCapacity] = useState(initialFormData.capacity);
  const [penalty, setPenalty] = useState(initialFormData.penalty);
  const [penaltyTouched, setPenaltyTouched] = useState(initialFormData.penaltyTouched);
  const [slackBits, setSlackBits] = useState(initialFormData.slackBits ?? '');
  const [localWarning, setLocalWarning] = useState<string | null>(null);

  // ── Knapsack items 輸入模式 ────────────────────────────
  type ItemInputMode = 'manual' | 'upload';
  const [itemInputMode, setItemInputMode] = useState<ItemInputMode>('manual');
  const [itemFileName, setItemFileName] = useState('');
  const [itemFileError, setItemFileError] = useState<string | null>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  // ── Custom Q_matrix 上傳 ──────────────────────────────
  const [qMatrix, setQMatrix] = useState<number[][] | null>(null);
  const [qMatrixError, setQMatrixError] = useState<string | null>(null);
  const [qMatrixFileName, setQMatrixFileName] = useState('');
  const qFileInputRef = useRef<HTMLInputElement>(null);

  const handleQMatrixFileUpload = (file: File) => {
    setQMatrixError(null);
    setQMatrixFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).trim();
        const raw = JSON.parse(text);
        if (!Array.isArray(raw) || raw.length === 0)
          throw new Error('Q_matrix 需為非空二維陣列 [[...], [...], ...]');
        const n = raw.length;
        for (let i = 0; i < n; i++) {
          if (!Array.isArray(raw[i]))
            throw new Error(`第 ${i} 行不是陣列`);
          if ((raw[i] as unknown[]).length !== n)
            throw new Error(`Q_matrix 不是方陣（第 ${i} 行長度 ${(raw[i] as unknown[]).length} ≠ ${n}）`);
        }
        setQMatrix(raw as number[][]);
        setQMatrixError(null);
      } catch (err) {
        setQMatrix(null);
        setQMatrixError(err instanceof Error ? err.message : '解析失敗，請確認格式');
      }
    };
    reader.readAsText(file);
  };

  // 任何欄位變更時通知 App 層保存
  useEffect(() => {
    onFormChange({ items, capacity, penalty, penaltyTouched, slackBits });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, capacity, penalty, penaltyTouched, slackBits]);

  const recommendedPenalty = useMemo(
    () => Number((Math.max(1, ...items.map((it) => (Number(it.value) > 0 ? Number(it.value) : 0)))).toFixed(2)),
    [items]
  );

  useEffect(() => {
    if (!penaltyTouched) {
      setPenalty(String(recommendedPenalty));
    }
  }, [recommendedPenalty, penaltyTouched]);

  const [batchCount, setBatchCount] = useState('1');
  const addBatchItems = () => {
    const count = Math.max(1, Math.min(50, parseInt(batchCount, 10) || 1));
    setItems((prev) => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => ({
        name: `item-${prev.length + i + 1}`, weight: '', value: '',
      })),
    ]);
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

  // Slack variables：用於將不等式約束轉成等式， K = ceil(log2(C+1))
  const slackInfo = useMemo(() => {
    if (!Number.isFinite(capacityNumber) || capacityNumber <= 0) return null;
    const autoK = Math.ceil(Math.log2(capacityNumber + 1));
    const userK = slackBits !== '' ? parseInt(slackBits, 10) : null;
    const K = (userK !== null && userK >= 1) ? userK : autoK;
    const n = normalizedItems.length;
    return { autoK, K, total: n + K };
  }, [capacityNumber, normalizedItems.length, slackBits]);

  const invalidItemExists = normalizedItems.some(
    (item) => item.name === '' || item.weight <= 0 || item.value < 0 || Number.isNaN(item.weight) || Number.isNaN(item.value)
  );

  const isItemsEmpty = normalizedItems.length === 0;
  const isCapacityInvalid = !Number.isFinite(capacityNumber) || capacityNumber <= 0;
  const isPenaltyInvalid = !Number.isFinite(penaltyNumber) || penaltyNumber <= 0;

  // ── Knapsack items file upload ─────────────────────────
  const handleItemFileUpload = (file: File) => {
    setItemFileError(null);
    setItemFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).trim();
        let parsed: Array<{ name: string; weight: string; value: string }> = [];

        if (file.name.endsWith('.csv')) {
          // CSV: 必須包含 header 行 name,weight,value（順序任意）
          const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
          if (lines.length < 2) throw new Error('CSV 至少需包含 header 行與一列資料');
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          const nameIdx   = headers.indexOf('name');
          const weightIdx = headers.indexOf('weight');
          const valueIdx  = headers.indexOf('value');
          if (nameIdx < 0 || weightIdx < 0 || valueIdx < 0)
            throw new Error('CSV header 需包含 name, weight, value 欄位');
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const name   = cols[nameIdx]?.trim()   ?? '';
            const weight = cols[weightIdx]?.trim()  ?? '';
            const value  = cols[valueIdx]?.trim()   ?? '';
            if (name === '' && weight === '' && value === '') continue;
            parsed.push({ name, weight, value });
          }
        } else {
          // JSON: [{name, weight, value}, ...] 或 {items: [...]}
          const raw = JSON.parse(text);
          const arr: unknown[] = Array.isArray(raw) ? raw : (Array.isArray(raw.items) ? raw.items : null);
          if (!arr) throw new Error('JSON 需為陣列 [...] 或 {"items": [...]}');
          parsed = arr.map((r: unknown, i: number) => {
            if (typeof r !== 'object' || r === null)
              throw new Error(`第 ${i + 1} 筆資料不是物件`);
            const obj = r as Record<string, unknown>;
            return {
              name:   String(obj.name   ?? `item-${i + 1}`),
              weight: String(obj.weight ?? ''),
              value:  String(obj.value  ?? ''),
            };
          });
        }

        if (parsed.length === 0) throw new Error('解析結果為空，請確認檔案內容');
        setItems(parsed);
        setItemFileError(null);
      } catch (err) {
        setItemFileError(err instanceof Error ? err.message : '解析失敗，請確認格式');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    setLocalWarning(null);

    // ── custom 路徑 ──────────────────────────────────────
    if (problemType === 'custom') {
      if (!qMatrix) {
        setLocalWarning('請上傳一個包含 Q_matrix 的 .txt 或 .json 檔案。');
        return;
      }
      onSubmit({
        items: [],
        capacity: 0,
        penalty: 0,
        problem_type: problemType,
        problem_data: problemData,
        Q_matrix: qMatrix,
      });
      return;
    }

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
      slack_bits: slackBits !== '' ? parseInt(slackBits, 10) : undefined,
      problem_type: problemType,
      problem_data: problemData,
    });
  };


  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-5xl bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 p-8">
          <div className="block">

            {/* ══ CUSTOM Q_MATRIX 路徑 ════════════════════════════ */}
            {problemType === 'custom' ? (
              <div className="space-y-5">
                <section className="space-y-3">
                  <SectionTitle>上傳 Q_matrix 檔案</SectionTitle>
                  <p className="text-xs text-gray-300"> 或 <span className="text-gray-300">.json</span>，內容為 JSON 二維方陣 <code className="text-indigo-300">{"[[...], [...], ...]"}</code>。
                  </p>
                  <div
                    className="border-2 border-dashed border-gray-700 hover:border-indigo-500/60 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                    onClick={() => qFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleQMatrixFileUpload(f); }}
                  >
                    <Upload size={28} className="mx-auto mb-2 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">點擊或拖放 .txt / .json 到此處</p>
                    {qMatrixFileName && <p className="mt-2 text-xs text-indigo-300 font-medium">{qMatrixFileName}</p>}
                    <input
                      ref={qFileInputRef}
                      type="file"
                      accept=".txt,.json"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQMatrixFileUpload(f); e.target.value = ''; }}
                    />
                  </div>
                  {qMatrixError && (
                    <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                      {qMatrixError}
                    </div>
                  )}
                  {qMatrix && !qMatrixError && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                      <p className="text-xs text-emerald-300 font-semibold">✓ 已載入 {qMatrix.length} × {qMatrix.length} Q_matrix</p>
                      <p className="text-xs text-gray-300 mt-1">對角線最小値：{Math.min(...qMatrix.map((row, i) => row[i])).toFixed(2)}</p>
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
                  <button onClick={onBack} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600 text-sm transition-all">
                    <ChevronLeft size={16} />
                    上一步
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !qMatrix}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
                  >
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中…</>
                    ) : (
                      <>開始求解<ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            ) : (
            /* ══ KNAPSACK 路徑（原本內容）══════════════════════════ */
            <>
            {/* ── LEFT PANEL ──────────────────────────────────── */}
            <div className="space-y-5">
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SectionTitle>物品清單（items）</SectionTitle>
                    {/* 輸入模式切換 */}
                    <div className="flex rounded-lg overflow-hidden border border-gray-700/60 text-sm">
                      <button
                        onClick={() => setItemInputMode('manual')}
                        className={`px-3 py-1.5 transition-colors ${itemInputMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'}`}
                      >
                        手動輸入
                      </button>
                      <button
                        onClick={() => setItemInputMode('upload')}
                        className={`px-3 py-1.5 transition-colors ${itemInputMode === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'}`}
                      >
                        上傳檔案
                      </button>
                    </div>
                  </div>

                  {itemInputMode === 'manual' ? (
                    <>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-gray-300">一次新增</span>
                        <input
                          type="number" min={1} max={50} value={batchCount}
                          onChange={(e) => setBatchCount(e.target.value)}
                          className="w-16 bg-gray-700/60 border border-gray-600/50 rounded px-2 py-1 text-sm text-gray-100 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                        />
                        <button
                          onClick={addBatchItems}
                          className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Plus size={14} />
                          個物品
                        </button>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1.5">
                        {items.map((item, index) => (
                          <div key={index} className="grid grid-cols-[1.2fr_0.9fr_0.9fr_auto] gap-2 items-center">
                            <input type="text" value={item.name} placeholder="name" onChange={(e) => setItemField(index, 'name', e.target.value)} className={inputCls} />
                            <input type="number" min={0} step="any" value={item.weight} placeholder="weight" onChange={(e) => setItemField(index, 'weight', e.target.value)} className={inputCls} />
                            <input type="number" min={0} step="any" value={item.value} placeholder="value" onChange={(e) => setItemField(index, 'value', e.target.value)} className={inputCls} />
                            <button onClick={() => removeItem(index)} className="text-gray-600 hover:text-rose-400 transition-colors" disabled={items.length <= 1} aria-label="刪除物品">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="border-2 border-dashed border-gray-700 hover:border-indigo-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors group"
                        onClick={() => itemFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleItemFileUpload(f); }}
                      >
                        <Upload size={24} className="mx-auto mb-2 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">點擊或拖放檔案到此處</p>
                        <p className="text-xs text-gray-400 mt-1">支援 CSV（需含 name,weight,value 欄位）或 JSON</p>
                        {itemFileName && <p className="mt-2 text-xs text-indigo-300 font-medium">{itemFileName}</p>}
                        <input
                          ref={itemFileInputRef}
                          type="file"
                          accept=".csv,.json"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleItemFileUpload(f); e.target.value = ''; }}
                        />
                      </div>
                      {itemFileError && (
                        <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                          {itemFileError}
                        </div>
                      )}
                      {items.length > 0 && !itemFileError && itemFileName && (
                        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-1">
                          <p className="text-xs text-indigo-300 font-semibold">✓ 已載入 {items.length} 個物品</p>
                          <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
                            {items.slice(0, 5).map((item, i) => (
                              <p key={i} className="text-xs text-gray-200 font-mono">
                                {item.name} &nbsp;·&nbsp; w: {item.weight} &nbsp;·&nbsp; v: {item.value}
                              </p>
                            ))}
                            {items.length > 5 && <p className="text-xs text-gray-400">…還有 {items.length - 5} 個</p>}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {isItemsEmpty && (
                    <p className="text-amber-300 text-xs">目前物品清單為空，請至少新增一筆。</p>
                  )}
                </section>

                <section className="space-y-3">
                  <SectionTitle>容量與懲罰係數</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm text-gray-100 uppercase tracking-wider">capacity</label>
                      <input type="number" min={0} step="any" value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputCls} />
                      {isCapacityInvalid && <p className="text-amber-300 text-xs">capacity 需大於 0</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-gray-100 uppercase tracking-wider">penalty</label>
                      <input type="number" min={0} step="any" value={penalty} onChange={(e) => { setPenalty(e.target.value); setPenaltyTouched(true); }} className={inputCls} />
                      {isPenaltyInvalid && <p className="text-amber-300 text-xs">penalty 需大於 0</p>}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800/80 bg-gray-950/40 px-3 py-2 text-sm text-gray-200 space-y-1">
                    <div>建議 penalty（≈ 單一物品最大 value）= <span className="text-indigo-300 font-semibold">{recommendedPenalty}</span></div>
                    {slackInfo && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span>Slack bits K：</span>
                          <input
                            type="number" min={1} step={1}
                            value={slackBits === '' ? 0 : slackBits}
                            placeholder={String(slackInfo.autoK)}
                            onChange={(e) => setSlackBits(e.target.value)}
                            className="w-16 bg-gray-700/60 border border-gray-600/50 rounded px-2 py-0.5 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                          />
                          <span className="text-gray-300">（自動建議：{slackInfo.autoK}）</span>
                        </div>
                        {normalizedItems.length > 0 && (
                          <div className="text-gray-300">
                            QUBO 維度：{normalizedItems.length} items + {slackInfo.K} slack = <span className="text-emerald-400 font-semibold">{slackInfo.total}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>

            {/* ── RIGHT PANEL ─────────────────────────────────── */}
            <div className="space-y-5">
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
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 小元件 ────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-widest">{children}</h3>;
}

const inputCls =
  'bg-gray-800/60 border border-gray-700/50 rounded-lg px-3.5 py-2.5 text-base text-gray-100 w-full ' +
  'placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-colors';

