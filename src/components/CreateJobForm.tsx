// src/components/CreateJobForm.tsx — 建立任務表單（單一職責：表單欄位與驗證）
import { useState } from 'react';
import { ALGO_OPTIONS } from '../constants/algorithms';
import { JOB_TYPE_OPTIONS } from '../constants/jobTypes';
import type { CreateJobPayload } from '../types/job';

interface Props {
  onSubmit: (payload: CreateJobPayload) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function CreateJobForm({ onSubmit, isSubmitting, error }: Props) {
  const [title, setTitle] = useState('');
  const [jobType, setJobType] = useState(JOB_TYPE_OPTIONS[0].value);
  const [algorithm, setAlgorithm] = useState(ALGO_OPTIONS[0].value);
  const [paramN, setParamN] = useState('10');
  const [gpus, setGpus] = useState(1);

  const GPU_OPTIONS = [1, 2, 4, 8] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      job_type: jobType,
      algorithm,
      params: { N: Number(paramN) || 10, GPUs: gpus },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 標題 */}
      <fieldset className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          任務標題 <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. TSP 50 nodes benchmark"
          required
          className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-100
                     placeholder:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                     transition-colors"
        />
      </fieldset>

      {/* 問題類型 */}
      <fieldset className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">問題類型</label>
        <div className="grid grid-cols-3 gap-2">
          {JOB_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setJobType(opt.value)}
              className={`rounded-lg px-3 py-2 text-sm border transition-all
                ${jobType === opt.value
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-gray-800/40 border-gray-700/40 text-gray-400 hover:border-gray-600/60 hover:text-gray-300'
                }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-[10px] mt-0.5 opacity-70">{opt.description}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* 演算法 */}
      <fieldset className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">演算法</label>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                     transition-colors cursor-pointer"
        >
          {ALGO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </fieldset>

      {/* 參數 N */}
      <fieldset className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">參數 N</label>
        <input
          type="number"
          min={1}
          value={paramN}
          onChange={(e) => setParamN(e.target.value)}
          className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                     transition-colors"
        />
      </fieldset>

      {/* GPU 數量 */}
      <fieldset className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">GPU 數量</label>
        <div className="grid grid-cols-4 gap-2">
          {GPU_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setGpus(n)}
              className={`rounded-lg px-3 py-2 text-sm border transition-all
                ${gpus === n
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-gray-800/40 border-gray-700/40 text-gray-400 hover:border-gray-600/60 hover:text-gray-300'
                }`}
            >
              {n} GPU
            </button>
          ))}
        </div>
      </fieldset>

      {/* Error */}
      {error && (
        <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                   bg-indigo-600 hover:bg-indigo-500 text-white
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            提交中…
          </>
        ) : (
          '建立任務'
        )}
      </button>
    </form>
  );
}
