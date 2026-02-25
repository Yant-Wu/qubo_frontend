// src/utils/chartDataParser.ts — 圖表資料轉換（單一職責：將各種格式的 historyData 正規化為 x/y 陣列）

export interface ParsedChartData {
  xData: number[];
  yData: number[];
}

/**
 * 將後端回傳的 history_data 轉成 ECharts 可用的 x/y 陣列。
 * 支援三種輸入格式：
 *   1. number[]               → index 做 x
 *   2. { iteration, value }[] → 取 iteration/value
 *   3. { x, y } 或 { cost } 等變體
 */
export function parseHistoryData(raw: unknown[]): ParsedChartData | null {
  if (!raw || raw.length === 0) return null;

  const sample = raw[0];

  if (typeof sample === 'number') {
    return {
      xData: raw.map((_, i) => i),
      yData: raw as number[],
    };
  }

  if (sample && typeof sample === 'object') {
    const objs = raw as Record<string, unknown>[];
    return {
      xData: objs.map((d, i) => Number(d.iteration ?? d.x ?? i)),
      yData: objs.map((d) => Number(d.value ?? d.y ?? d.cost ?? d.energy ?? 0)),
    };
  }

  return null;
}
