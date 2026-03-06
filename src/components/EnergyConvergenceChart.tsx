// src/components/EnergyConvergenceChart.tsx — 能量收斂折線圖
import ReactECharts from 'echarts-for-react';
import type { HistoryDataPoint } from '../types/job';

interface Props {
  history: HistoryDataPoint[];
}

export default function EnergyConvergenceChart({ history }: Props) {
  if (history.length === 0) return null;

  const hasQE = history.some((d) => d.qubo_energy != null);

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 32, right: hasQE ? 60 : 16, bottom: 36, left: 52 },
    legend: hasQE ? {
      top: 4,
      textStyle: { color: '#9ca3af', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 8,
    } : undefined,
    xAxis: {
      type: 'value',
      name: 'Iteration',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisTick: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f2937' } },
      min: 1,
      max: history[history.length - 1]?.iteration ?? 1,
    },
    yAxis: [
      {
        type: 'value',
        name: 'Best Value',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        axisLine: { lineStyle: { color: '#374151' } },
        axisTick: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1f2937' } },
      },
      hasQE ? {
        type: 'value',
        name: 'QUBO Energy',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        axisLine: { lineStyle: { color: '#374151' } },
        axisTick: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { show: false },
      } : undefined,
    ].filter(Boolean),
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 11 },
      formatter: (params: { seriesName: string; value: number[] }[]) =>
        params
          .map((p) => `${p.seriesName}: <b>${p.value[1].toFixed(4)}</b>`)
          .join('<br/>') + `<br/><span style="color:#6b7280">Iter ${params[0]?.value[0]}</span>`,
    },
    series: [
      {
        name: 'Best Objective',
        type: 'line',
        yAxisIndex: 0,
        data: history.map((d) => [d.iteration, d.value]),
        symbol: 'none',
        lineStyle: { color: '#34d399', width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52,211,153,0.25)' },
              { offset: 1, color: 'rgba(52,211,153,0.00)' },
            ],
          },
        },
        smooth: 0.3,
      },
      ...(hasQE ? [{
        name: 'QUBO Energy',
        type: 'line',
        yAxisIndex: 1,
        data: history
          .filter((d) => d.qubo_energy != null)
          .map((d) => [d.iteration, d.qubo_energy as number]),
        symbol: 'none',
        lineStyle: { color: '#818cf8', width: 1.5, type: 'dashed' },
        smooth: 0.3,
      }] : []),
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
