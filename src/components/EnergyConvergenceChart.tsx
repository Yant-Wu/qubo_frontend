// src/components/EnergyConvergenceChart.tsx — 能量收斂折線圖
import ReactECharts from 'echarts-for-react';
import type { HistoryDataPoint } from '../types/job';

interface Props {
  history: HistoryDataPoint[];
}

export default function EnergyConvergenceChart({ history }: Props) {
  if (history.length === 0) return null;

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 16, bottom: 36, left: 52 },
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
    yAxis: {
      type: 'value',
      name: 'Objective Value',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisTick: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 11 },
      formatter: (params: { value: number[] }[]) => {
        const p = params[0];
        return `Iter ${p.value[0]}<br/>Objective: <b>${p.value[1].toFixed(4)}</b>`;
      },
    },
    series: [
      {
        type: 'line',
        data: history.map((d) => [d.iteration, d.value]),
        symbol: 'none',
        lineStyle: { color: '#34d399', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52,211,153,0.25)' },
              { offset: 1, color: 'rgba(52,211,153,0.00)' },
            ],
          },
        },
        smooth: 0.3,
      },
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
