// src/constants/algorithms.ts — 演算法選項常數（單一職責：領域常數）

export interface AlgorithmOption {
  value: string;
  label: string;
}

export const ALGO_OPTIONS: AlgorithmOption[] = [
  { value: 'simulated-annealing', label: '模擬退火 (SA)' },
  { value: 'quantum-annealing',   label: '量子退火 (QA)' },
  { value: 'tabu-search',         label: '禁忌搜尋 (TS)' },
  { value: 'genetic-algorithm',   label: '基因演算法 (GA)' },
];
