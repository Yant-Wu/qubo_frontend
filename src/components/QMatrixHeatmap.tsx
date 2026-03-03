// src/components/QMatrixHeatmap.tsx — QUBO Q 矩陣熱力圖
import ReactECharts from 'echarts-for-react';

interface Props {
  /** Q 矩陣邊長（變數數量）。API 就緒後可改為直接傳 matrix 二維陣列 */
  n: number;
  /** 亂數種子（用於模擬 Q 值）*/
  seed?: number;
}

/** 從種子產生偽 Q 矩陣（對稱，對角線為正，非對角線有正負） */
function generateQMatrix(n: number, seed: number): [number, number, number][] {
  const data: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const s = Math.sin((i * 31 + j * 17 + seed) * 0.1);
      const v = i === j ? Math.abs(s) * 2 : s;
      data.push([i, j, parseFloat(v.toFixed(3))]);
    }
  }
  return data;
}

export default function QMatrixHeatmap({ n, seed = 42 }: Props) {
  const displayN = Math.min(n, 24); // 最多顯示 24×24 避免太密
  const data = generateQMatrix(displayN, seed);
  const labels = Array.from({ length: displayN }, (_, i) => `x${i}`);

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 16, right: 16, bottom: 48, left: 48 },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 11 },
      formatter: (params: { value: [number, number, number] }) => {
        const [i, j, v] = params.value;
        return `Q[${i},${j}] = <b>${v}</b>`;
      },
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#4b5563', fontSize: 9, interval: Math.floor(displayN / 8) },
      axisLine: { lineStyle: { color: '#374151' } },
      splitArea: { show: true, areaStyle: { color: ['transparent', 'transparent'] } },
    },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      axisLabel: { color: '#4b5563', fontSize: 9, interval: Math.floor(displayN / 8) },
      axisLine: { lineStyle: { color: '#374151' } },
      splitArea: { show: true, areaStyle: { color: ['transparent', 'transparent'] } },
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: false,
      show: false,
      inRange: {
        color: ['#3b82f6', '#1e293b', '#f59e0b'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data,
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.5)' } },
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
