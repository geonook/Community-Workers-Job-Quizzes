/**
 * API 配置
 *
 * 用途：
 * - 本地開發：使用相對路徑 '' (透過 Vite proxy 轉發到 localhost:4000)
 * - 生產環境：使用完整的後端 API URL (從環境變數讀取)
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 是否使用遠端 API
export const IS_REMOTE_API = !!import.meta.env.VITE_API_BASE_URL;

/**
 * 建構完整的 API URL
 * @param endpoint - API 端點路徑（例如：'/api/upload'）
 * @returns 完整的 API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * 顯示當前 API 配置資訊（僅開發環境）
 */
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log(`  Base URL: ${API_BASE_URL || '(relative path - via proxy)'}`);
  console.log(`  Remote API: ${IS_REMOTE_API ? 'Yes' : 'No (local proxy)'}`);
}
