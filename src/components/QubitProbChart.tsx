// src/components/QubitProbChart.tsx — Q-bit 機率變化圖 (Subplot 網格版)
import ReactECharts from 'echarts-for-react';
import type { HistoryDataPoint } from '../types/job';

interface Props {
  history: HistoryDataPoint[];
}

export default function QubitProbChart({ history }: Props) {
  const data = history.filter((d) => d.qubit_probs && d.qubit_probs.length > 0);
  
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
        目前無 Q-bit 機率資料
      </div>
    );
  }

  const numQubits = (data[0].qubit_probs as number[]).length;
  const iterations = data.map(d => d.iteration);
  const maxIter = iterations[iterations.length - 1] ?? 1;

  return (
    <div className="w-full h-full overflow-y-auto px-4 pb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: numQubits }).map((_, i) => {
          const seriesData = data.map(d => [d.iteration, (d.qubit_probs as number[])[i]]);

          const option = {
            animation: false,
            tooltip: { show: false },
            // 💡 微調網格的留白，避免切字
            grid: { top: 15, right: 10, bottom: 25, left: 35 }, 
            xAxis: {
              type: 'value',
              name: 'Iter', // 💡 縮短字數
              nameLocation: 'middle',
              nameGap: 12,
              nameTextStyle: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold' },
              axisLabel: { show: false }, 
              splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
              min: 0,
              max: maxIter,
            },
            yAxis: {
              type: 'value',
              name: `Q[${i}]`, // 💡 從 [i] probability 縮短成 Q[i]，超級省空間
              nameLocation: 'middle',
              nameGap: 22,
              nameTextStyle: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold' },
              axisLabel: { color: '#9ca3af', fontSize: 9, margin: 4 },
              splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
              min: 0,
              max: 1,
            },
            series: [
              {
                type: 'line',
                data: seriesData,
                symbol: 'none',
                lineStyle: { color: '#ef4444', width: 1.5 },
              },
            ],
          };

          return (
            // 💡 加高到 h-48，多一點呼吸空間
            <div key={i} className="bg-gray-800/80 border border-gray-700/60 rounded-lg p-1 h-48 shadow-sm hover:border-gray-500 transition-colors">
              <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}