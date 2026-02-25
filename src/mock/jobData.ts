// src/mock/jobData.ts
export interface QubitData {
    iteration: number;
    probability: number;
}

export const generateMockJobData = (jobId: string, n: number) => {
    // 根據 jobId 產生一致的隨機數據 (利用簡單的雜湊模擬)
    const seed = jobId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (offset: number) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };

    // 模擬 8 個關鍵 Qubit 的收斂數據 (假設只顯示前 8 個或特定幾個)
    const indices = [0, 1, 2, 3, 4, 5, 6, 7].map(i => i + 32); // 模擬 32-39
    const chartData: Record<number, number[]> = {};

    indices.forEach((index, i) => {
        const target = random(i) > 0.5 ? 1.0 : 0.0; // 隨機決定收斂到 0 或 1
        const data: number[] = [];
        let current = 0.5;

        for (let iter = 0; iter <= 200; iter++) {
            // 模擬收斂過程
            const noise = (random(iter * (i + 1)) - 0.5) * 0.1;
            const speed = 0.02 + random(index) * 0.05;
            
            current += (target - current) * speed + noise;
            current = Math.max(0, Math.min(1, current));
            data.push(current);
        }
        chartData[index] = data;
    });

    return chartData;
};
