# Zeabur 部署指南 - Monorepo 單一服務架構

## 🎯 專案架構

本專案採用 **Monorepo 單一服務架構**：
- **前端**：React 19 + TypeScript + Vite
- **後端**：Express + TypeScript
- **部署方式**：單一 Node.js 服務，Express 同時提供前端靜態檔案和 API 服務

### 架構圖

```
使用者訪問 https://your-app.zeabur.app
     ↓
Express 伺服器 (port 4000)
     ├─ 靜態檔案請求 → 提供 dist/ 資料夾（前端）
     └─ API 請求 (/api/*) → API 路由（後端）
```

### 優勢

- ✅ **只需要管理一個 Zeabur 服務**
- ✅ **沒有 CORS 問題**（前後端同 domain）
- ✅ **部署更簡單**（一鍵部署）
- ✅ **成本更低**（只用一個服務）
- ✅ **符合主流做法**（Vercel、Netlify、Render 都推薦這種方式）

---

## 📋 部署步驟

### 步驟 1：連接 GitHub Repository

1. 登入 [Zeabur Dashboard](https://zeabur.com/dashboard)
2. 點選 **New Project**
3. 選擇 **Import from GitHub**
4. 找到 `Community-Workers-Job-Quizzes` repository
5. 選擇 **`development` 分支**
6. 點選 **Deploy**

### 步驟 2：Zeabur 自動偵測專案類型

Zeabur 會自動偵測為 **Node.js 專案**，並執行 `npm start`：

```bash
npm run build           # 先 build 前端（產生 dist/）
NODE_ENV=production tsx server/index.ts  # 啟動 Express（提供靜態檔案 + API）
```

### 步驟 3：設定環境變數

進入 Zeabur 服務 → **Environment Variables**，設定以下變數：

#### 必要環境變數

```
NODE_ENV=production
PORT=4000
```

#### Airtable 設定

```
AIRTABLE_API_KEY=你的_Airtable_API_金鑰
AIRTABLE_BASE_ID=你的_Base_ID
AIRTABLE_TABLE_NAME=Students
```

#### Cloudinary 設定（前端 build 時需要）

```
VITE_CLOUDINARY_CLOUD_NAME=dyqzglsgt
VITE_CLOUDINARY_UPLOAD_PRESET=job_quizzes
```

#### n8n Webhook（可選）

```
N8N_WEBHOOK_URL=https://your-n8n-webhook-url
```

### 步驟 4：設定網域（可選）

如果你想使用自訂網域：

1. 進入服務 → **Networking**
2. 點選 **Add Domain**
3. 輸入子網域名稱（例如 `career-explorer`）
4. 儲存

### 步驟 5：等待部署完成

- 部署約需 5-10 分鐘
- 可以在 **Deployments** 頁面查看進度
- 查看 **Runtime Logs** 確認是否有錯誤

### 步驟 6：驗證部署成功

前往你的網域（例如 `https://career-explorer.zeabur.app`），確認：

- [ ] UI 介面是英文
- [ ] 必須先填入姓名和班級才能看到相機
- [ ] 不能在填寫前拍照
- [ ] 錯誤訊息是英文
- [ ] 不接受預設值 'Student' / 'Class'
- [ ] 完整流程正常運作：姓名 → 班級 → 拍照 → 測驗 → 結果

---

## 🔧 本地開發

### 開發環境設定

1. **安裝依賴**：
   ```bash
   npm install
   ```

2. **建立 `.env.local` 檔案**：
   ```bash
   cp server/.env.example .env.local
   ```

3. **填入環境變數**：
   ```
   AIRTABLE_API_KEY=你的_Airtable_API_金鑰
   AIRTABLE_BASE_ID=你的_Base_ID
   AIRTABLE_TABLE_NAME=Students
   N8N_WEBHOOK_URL=你的_n8n_webhook_URL
   ```

4. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```
   
   這會同時啟動：
   - 前端開發伺服器（Vite）：http://localhost:3000
   - 後端 API 伺服器（Express）：http://localhost:4000

5. **開啟瀏覽器**：
   訪問 http://localhost:3000

### 開發環境架構

```
開發環境：

使用者訪問 http://localhost:3000
     ↓
Vite Dev Server (port 3000)
     ├─ 前端檔案請求 → Vite HMR
     └─ API 請求 (/api/*) → Vite Proxy → Express (port 4000)
```

---

## 🚀 更新部署

當你推送新的 commit 到 `development` 分支時：

1. Zeabur 會自動偵測 GitHub 變更
2. 自動重新部署服務
3. 約 5-10 分鐘後，新版本上線

**你不需要手動觸發部署！**

---

## 🐛 常見問題

### Q1: 部署失敗，顯示 "Build failed"

**可能原因**：
- 環境變數沒有正確設定
- `node_modules` 安裝失敗

**解決方法**：
1. 檢查 Zeabur **Deployment Logs**
2. 確認所有環境變數都已設定
3. 嘗試重新部署

### Q2: 網站可以訪問，但 API 回傳 500 錯誤

**可能原因**：
- Airtable 環境變數沒有設定
- Airtable API 金鑰無效

**解決方法**：
1. 檢查 Zeabur **Runtime Logs**
2. 確認 `AIRTABLE_API_KEY`、`AIRTABLE_BASE_ID`、`AIRTABLE_TABLE_NAME` 都已設定
3. 測試 Airtable API 金鑰是否有效

### Q3: 前端顯示空白頁面

**可能原因**：
- `npm run build` 失敗
- `dist/` 資料夾沒有正確產生
- Cloudinary 環境變數缺失（build 時需要）

**解決方法**：
1. 檢查 **Deployment Logs** 中的 build 步驟
2. 確認 `VITE_CLOUDINARY_CLOUD_NAME` 和 `VITE_CLOUDINARY_UPLOAD_PRESET` 已設定
3. 重新部署

### Q4: 照片上傳失敗

**可能原因**：
- Cloudinary 設定錯誤
- n8n webhook 沒有回應

**解決方法**：
1. 檢查前端 Console 是否有 Cloudinary 錯誤
2. 確認 Cloudinary Upload Preset 設定為 "Unsigned"
3. 測試 n8n workflow 是否正常運作

### Q5: 輪詢逾時（polling timeout）

**可能原因**：
- n8n workflow 執行時間過長（> 120 秒）
- Gemini API 回應慢
- Cloudinary 上傳慢

**解決方法**：
1. 檢查 n8n workflow 執行時間
2. 優化 Gemini API 請求（減少 token 數量）
3. 調整前端輪詢時間（目前是 120 秒）

---

## 📝 程式碼說明

### package.json scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx server/index.ts",
    "dev:client": "vite",
    "build": "vite build",
    "start": "npm run build && NODE_ENV=production tsx server/index.ts"
  }
}
```

- **`npm run dev`**：本地開發，同時啟動前後端
- **`npm start`**：生產環境，先 build 前端，再啟動 Express

### server/index.ts 關鍵程式碼

```typescript
// 提供前端靜態檔案（生產環境）
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  
  // 提供靜態檔案
  app.use(express.static(distPath));
  
  // SPA fallback - 所有非 API 請求返回 index.html
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}
```

### config/api.ts 關鍵程式碼

```typescript
export function getApiUrl(path: string): string {
  // Monorepo 架構：前後端同 domain，直接使用相對路徑
  return path;
}
```

---

## 🔄 從前後端分離改為 Monorepo

如果你之前部署了前後端分離架構，想要改用 Monorepo：

1. **刪除舊的兩個 Zeabur 服務**（前端 + 後端）
2. **按照本指南重新建立單一服務**
3. **環境變數只需要設定一份**
4. **不再需要 `VITE_API_BASE_URL`**（前後端同 domain）

---

## 📞 技術支援

如果遇到問題：

1. 查看 Zeabur **Deployment Logs**（部署日誌）
2. 查看 Zeabur **Runtime Logs**（執行日誌）
3. 確認 GitHub `development` 分支有最新的 commit
4. 確認所有環境變數都已設定
5. 檢查本地開發環境是否正常運作

---

**最後更新**：2025-10-07  
**適用版本**：development 分支（commit 7ab16f7）  
**架構**：Monorepo 單一服務
