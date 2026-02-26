// src/components/CreateJobForm.tsx — 建立任務表單（單一職責：表單欄位與驗證）
import { useState } from 'react';
import type { CreateJobPayload } from '../types/job';

interface Props {
  onSubmit: (payload: CreateJobPayload) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function CreateJobForm({ onSubmit, isSubmitting, error }: Props) {
  const [title, setTitle] = useState('');
  const [paramN, setParamN] = useState('10');
  const [cores, setCores] = useState('100');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      job_type: '',
      algorithm: '',
      params: { N: Number(paramN) || 10, cores: Number(cores) || 100 },
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

      {/* 核心數量 */}
      <fieldset className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          核心數量 <span className="text-gray-500 normal-case font-normal">(最低 100)</span>
        </label>
        <input
          type="number"
          min={100}
          step={1}
          value={cores}
          onChange={(e) => setCores(e.target.value)}
          className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                     transition-colors"
        />
        {Number(cores) < 100 && cores !== '' && (
          <span className="text-rose-400 text-xs">核心數量不可低於 100</span>
        )}
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
        disabled={isSubmitting || !title.trim() || Number(cores) < 100}
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
