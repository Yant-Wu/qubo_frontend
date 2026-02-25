// src/constants/jobTypes.ts — 問題類型選項常數（單一職責：領域常數）

export interface JobTypeOption {
  value: string;
  label: string;
  description: string;
}

export const JOB_TYPE_OPTIONS: JobTypeOption[] = [
  { value: 'TSP',       label: 'TSP',       description: '旅行推銷員問題' },
  { value: 'MaxCut',    label: 'MaxCut',    description: '最大切割問題' },
  { value: 'Knapsack',  label: 'Knapsack',  description: '背包問題' },
];
