// src/components/AlgorithmSelector.tsx — 演算法下拉選擇器（單一職責：演算法篩選 UI）
import { ChevronDown } from 'lucide-react';
import { ALGO_OPTIONS } from '../constants/algorithms';

interface Props {
  value: string;
  onChange: (algo: string) => void;
}

export default function AlgorithmSelector({ value, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-gray-800/80 text-sm text-gray-200 rounded-lg
                   border border-gray-600/50 px-3 py-2 pr-8
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                   transition-colors cursor-pointer"
      >
        {ALGO_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
