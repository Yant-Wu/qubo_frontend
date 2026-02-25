// src/services/apiClient.ts — 通用 HTTP 請求工具（單一職責：HTTP 通訊）

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

/** 通用 fetch 包裝：自動解析 JSON 並處理 HTTP 錯誤 */
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}
