// src/components/EnergyConvergenceChart.tsx — 能量收斂折線圖 (支援雙語)
import ReactECharts from 'echarts-for-react';
import type { HistoryDataPoint } from '../types/job';

interface Props {
  history: HistoryDataPoint[];
  compact?: boolean;
  lang?: 'zh' | 'en'; // 💡 接收語言屬性
}

export default function EnergyConvergenceChart({ history, compact = false, lang = 'zh' }: Props) {
  if (history.length === 0) return null;

  const hasQE = history.some((d) => d.qubo_energy != null);

  // 💡 根據語言設定 Tooltip 文字
  const tooltipText = {
    zh: {
      bestDesc: '歷史最佳解的總價值<br/>只增不減，最右端即為最終答案',
      quboDesc: '含懲罰項的能量值，用來導引搜索方向<br/>數值越負代表解越好且越可行'
    },
    en: {
      bestDesc: 'Total value of the best historical solution<br/>Only increases, rightmost is the final answer',
      quboDesc: 'Energy value with penalty, guides search direction<br/>More negative means a better and feasible solution'
    }
  };

  const option = {
    backgroundColor: 'transparent',
    grid: compact
      ? { top: 6, right: 6, bottom: 6, left: 6 }
      : { top: 45, right: hasQE ? 70 : 20, bottom: 40, left: 65 },
    legend: compact ? undefined : hasQE ? {
      top: 0,
      right: hasQE ? 70 : 20,
      textStyle: { color: '#e5e7eb', fontSize: 13 },
      itemWidth: 16,
      itemHeight: 10,
      tooltip: {
        show: true,
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        textStyle: { color: '#e5e7eb', fontSize: 13 },
        formatter: (params: { name: string }) => {
          if (params.name === 'Best Objective') return tooltipText[lang].bestDesc;
          if (params.name === 'QUBO Energy') return tooltipText[lang].quboDesc;
          return params.name;
        },
      },
    } : undefined,
    xAxis: {
      type: 'value',
      name: compact ? '' : 'Iteration',
      nameTextStyle: { color: '#e5e7eb', fontSize: 13 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisTick: { show: !compact, lineStyle: { color: '#374151' } },
      axisLabel: { show: !compact, color: '#e5e7eb', fontSize: 13 },
      splitLine: { lineStyle: { color: '#1f2937' } },
      min: 1,
      max: history[history.length - 1]?.iteration ?? 1,
    },
    yAxis: [
      {
        type: 'value',
        name: compact ? '' : 'Best Value',
        nameTextStyle: { color: '#e5e7eb', fontSize: 13, align: 'left' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisTick: { show: !compact, lineStyle: { color: '#374151' } },
        axisLabel: { show: !compact, color: '#e5e7eb', fontSize: 13 },
        splitLine: { lineStyle: { color: '#1f2937' } },
      },
      hasQE ? {
        type: 'value',
        name: compact ? '' : 'QUBO Energy',
        nameTextStyle: { color: '#e5e7eb', fontSize: 13, align: 'right' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisTick: { show: !compact, lineStyle: { color: '#374151' } },
        axisLabel: { show: !compact, color: '#e5e7eb', fontSize: 13 },
        splitLine: { show: false },
      } : undefined,
    ].filter(Boolean),
    tooltip: compact ? { show: false } : {
      trigger: 'axis',
      axisPointer: { type: 'line', snap: true, lineStyle: { color: '#6b7280', type: 'dashed', width: 1 } },
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 14 },
      formatter: (params: { seriesName: string; value: number[] }[]) =>
        params.map((p) => `${p.seriesName}: <b>${p.value[1].toFixed(4)}</b>`).join('<br/>') + 
        `<br/><span style="color:#6b7280">Iter ${params[0]?.value[0]}</span>`,
    },
    series: [
      {
        name: 'Best Objective', type: 'line', yAxisIndex: 0,
        data: history.map((d) => [d.iteration, d.value]),
        symbol: 'none', lineStyle: { color: '#34d399', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(52,211,153,0.25)' }, { offset: 1, color: 'rgba(52,211,153,0.00)' }] }
        },
        smooth: 0.3,
      },
      ...(hasQE ? [{
        name: 'QUBO Energy', type: 'line', yAxisIndex: 1,
        data: history.filter((d) => d.qubo_energy != null).map((d) => [d.iteration, d.qubo_energy as number]),
        symbol: 'none', lineStyle: { color: '#818cf8', width: 1.5, type: 'dashed' },
        smooth: 0.3,
      }] : []),
    ],
  };

  return <ReactECharts option={option} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'canvas' }} />;
}