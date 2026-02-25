// src/components/ConvergenceChart.tsx — 收斂圖表（單一職責：ECharts 圖表渲染）
import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { parseHistoryData } from '../utils/chartDataParser';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface Props {
  historyData: unknown[];
}

export default function ConvergenceChart({ historyData }: Props) {
  const option = useMemo(() => {
    const parsed = parseHistoryData(historyData);
    if (!parsed) return null;

    const { xData, yData } = parsed;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderColor: '#374151',
        textStyle: { color: '#e5e7eb', fontSize: 12 },
      },
      grid: {
        top: 16,
        right: 24,
        bottom: 60,
        left: 56,
      },
      xAxis: {
        type: 'category' as const,
        data: xData,
        name: 'Iteration',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        name: 'Cost',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1f2937', type: 'dashed' as const } },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          height: 20,
          bottom: 8,
          borderColor: '#374151',
          backgroundColor: '#111827',
          fillerColor: 'rgba(59, 130, 246, 0.2)',
          handleStyle: { color: '#3b82f6' },
          textStyle: { color: '#9ca3af', fontSize: 10 },
        },
      ],
      series: [
        {
          type: 'line',
          data: yData,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: '#06b6d4' },
            ]),
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.01)' },
            ]),
          },
        },
      ],
    };
  }, [historyData]);

  if (!option) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        尚無收斂資料
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '100%', width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
