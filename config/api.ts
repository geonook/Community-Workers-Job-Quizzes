/**
 * API URL 配置
 *
 * Monorepo 架構：前端和後端部署在同一個服務
 * - 開發環境：Vite proxy 將 /api 請求代理到 localhost:4000
 * - 生產環境：Express 同時提供前端靜態檔案和 API 服務，使用相對路徑即可
 */

/**
 * 取得 API 完整 URL
 * @param path - API 路徑（例如：/api/upload）
 * @returns 完整的 API URL
 */
export function getApiUrl(path: string): string {
  // Monorepo 架構：前後端同 domain，直接使用相對路徑
  // 開發環境：Vite proxy 會將 /api 請求代理到 localhost:4000
  // 生產環境：Express 會同時處理靜態檔案和 API 請求
  return path;
}
