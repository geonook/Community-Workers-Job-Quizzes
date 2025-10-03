# Zeabur 快速部署指南 - Development 全棧服務

> 一個服務包含前端 + 後端，5 分鐘內完成部署 🚀

---

## 📋 部署架構

```
Zeabur 服務
└── Development 全棧服務
    ├── 前端 (Vite) - Port 3000
    └── 後端 (Express) - Port 4000
```

---

## 🚀 部署步驟

### 步驟 1: 在 Zeabur 建立服務（2 分鐘）

1. **登入 Zeabur Dashboard**
   - 前往：https://zeabur.com

2. **建立新服務**
   - 點擊您的專案
   - 點擊 **"Create Service"** 或 **"新增服務"**
   - 選擇 **"Git"**

3. **連接 GitHub Repository**
   - Repository: `Community-Workers-Job-Quizzes`
   - Branch: `development` ✅

4. **設定部署配置**
   - **Service Name**: `community-workers-dev`（或您喜歡的名稱）
   - **Root Directory**: **留空**（使用根目錄）
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

---

### 步驟 2: 設定環境變數（2 分鐘）

在 Zeabur 服務設定中，進入 **"Variables"** 或 **"環境變數"** 頁籤，新增以下變數：

#### ⚠️ 重要：不要設定 VITE_API_BASE_URL

全棧部署時，前端會自動使用相對路徑 `/api/*`，由 Vite proxy 轉發到後端。

#### 必要環境變數

```bash
# ============================================
# 前端環境變數 (VITE_ 開頭，建置時注入)
# ============================================

VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m
VITE_CLOUDINARY_UPLOAD_PRESET=career_nano

# ============================================
# 後端環境變數 (執行時使用)
# ============================================

# 伺服器 Port
PORT=4000

# Airtable 資料庫設定
AIRTABLE_API_KEY=【請填入您的 Airtable Personal Access Token】
AIRTABLE_BASE_ID=【請填入您的 Airtable Base ID】
AIRTABLE_TABLE_NAME=Students

# n8n Webhook URL
N8N_WEBHOOK_URL=【請填入您的 n8n Webhook URL】

# ============================================
# 選填環境變數
# ============================================

# Gemini AI (用於生成職業描述)
GEMINI_API_KEY=【請填入您的 Gemini API Key】
```

#### 🔑 如何取得實際的環境變數值

您可以從本地的 `.env.local` 檔案中複製實際的值。

---

### 步驟 3: 部署（1 分鐘）

1. **確認環境變數已設定完成**
2. **點擊 "Deploy" 或 "部署"**
3. **等待建置完成**（約 2-3 分鐘）
4. **取得服務 URL**
   - 例如：`https://community-workers-dev.zeabur.app`

---

## ✅ 測試驗證清單

部署完成後，開啟您的服務 URL 進行測試：

### 1. 基本功能測試

- [ ] ✅ 頁面能正常載入
- [ ] ✅ 能看到職業測驗介面
- [ ] ✅ 輸入姓名、班級正常

### 2. 照片上傳測試

- [ ] ✅ 點擊「拍照」按鈕
- [ ] ✅ 選擇照片（或拍照）
- [ ] ✅ 照片預覽正常顯示
- [ ] ✅ 點擊「確認」上傳
- [ ] ✅ Cloudinary 上傳成功
- [ ] ✅ Airtable 記錄建立成功
- [ ] ✅ 顯示「開始測驗」按鈕

### 3. 問卷測試

- [ ] ✅ 完成所有職業測驗題目
- [ ] ✅ 看到測驗結果頁面
- [ ] ✅ 顯示推薦職業
- [ ] ✅ 顯示 AI 生成的職業描述

### 4. 後端 API 測試

- [ ] ✅ 問卷自動提交到後端
- [ ] ✅ 狀態輪詢開始運作
- [ ] ✅ 顯示「正在製作專屬照片」的 Loading 畫面

### 5. Airtable 驗證

1. 開啟您的 Airtable Base
2. 查看 "Students" table
3. 確認測試記錄已建立：
   - [ ] ✅ 學生姓名
   - [ ] ✅ 班級
   - [ ] ✅ 原始照片（Cloudinary URL）
   - [ ] ✅ 推薦職業
   - [ ] ✅ 問卷分數
   - [ ] ✅ 處理狀態（應為「待處理」）

### 6. 後端 Logs 檢查

在 Zeabur Dashboard → 您的服務 → Logs，應該看到：

```
✅ 正常的 Log 範例：
🚀 Server is running on port 4000
POST /api/upload
✅ 記錄已建立: recXXXXXXXXXX
POST /api/submit-questionnaire
✅ 問卷已提交: recXXXXXXXXXX
✅ n8n webhook 已觸發
GET /api/check-status/recXXXXXXXXXX
```

---

## 🐛 疑難排解

### 問題 1: 頁面無法載入

**檢查項目**:
1. Zeabur 服務狀態是否為 "Running"
2. Build logs 是否有錯誤
3. 環境變數是否都已設定

---

### 問題 2: Cloudinary 上傳失敗

**錯誤訊息**: "Cloudinary 設定未完成"

**解決方案**:
1. 確認環境變數：
   - `VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m`
   - `VITE_CLOUDINARY_UPLOAD_PRESET=career_nano`
2. **重新部署**（環境變數變更需要重新建置）

---

### 問題 3: Airtable 連接失敗

**錯誤訊息**: "儲存記錄失敗" 或 405/403 錯誤

**解決方案**:
1. 檢查 `AIRTABLE_API_KEY` 是否正確
2. 確認 API Key 有以下權限：
   - `data.records:read`
   - `data.records:write`
3. 檢查 `AIRTABLE_BASE_ID` 和 `AIRTABLE_TABLE_NAME` 是否正確
4. 查看 Zeabur Logs 確認詳細錯誤訊息

---

### 問題 4: API 請求失敗 (404/405)

**可能原因**: 後端沒有正確啟動

**解決方案**:
1. 確認 Start Command 是 `npm start`
2. 檢查 package.json 的 start script：
   ```json
   "start": "concurrently \"npm run start:server\" \"npm run start:client\""
   ```
3. 查看 Zeabur Logs 確認後端是否啟動
4. 應該看到：`🚀 Server is running on port 4000`

---

### 問題 5: n8n Webhook 沒有觸發

**檢查項目**:
1. 確認 `N8N_WEBHOOK_URL` 環境變數正確
2. 在 Zeabur Logs 查看是否有：`✅ n8n webhook 已觸發`
3. 檢查 n8n workflow 是否正常運作
4. 在 Airtable 手動測試：
   - 將「處理狀態」改為「完成」
   - 上傳一張測試圖片到「結果照片」
   - 回到前端，應該會自動顯示結果

---

## 📊 服務監控

### 查看 Logs

Zeabur Dashboard → 您的服務 → **Logs**

可以看到：
- 前端建置 logs (Vite)
- 後端 API logs (Express)
- 請求記錄
- 錯誤訊息

### 重新部署

如果需要重新部署：
1. Zeabur Dashboard → 您的服務
2. 點擊 **"Redeploy"**
3. 等待建置完成

---

## 🎯 下一步

### 1. 設定自訂網域（選填）

Zeabur Dashboard → 您的服務 → Domains
- 可以設定自己的網域名稱

### 2. 設定 n8n Workflow

確保 n8n workflow 包含：
1. Webhook Trigger（接收來自後端的請求）
2. Airtable Read（讀取學生資料和照片）
3. AI Image Processing（生成職業照片）
4. Cloudinary Upload（上傳結果照片）
5. Airtable Update（更新狀態為「完成」）

### 3. 監控使用狀況

定期檢查：
- Airtable 記錄數量
- Cloudinary 儲存空間
- Zeabur 服務狀態

---

## 📞 需要協助？

如果遇到問題：

1. **查看 Logs**：Zeabur Dashboard → Logs
2. **檢查環境變數**：確認所有必要變數都已設定
3. **測試本地環境**：`npm run dev` 確認本地可正常運作
4. **檢查 Airtable**：確認 API Key 權限和 Table 設定

---

**部署完成！** 🎉

您的 Development 環境已經在 Zeabur 上運行，包含：
- ✅ 完整的前端介面
- ✅ 後端 API 服務
- ✅ 照片上傳功能
- ✅ Airtable 資料儲存
- ✅ n8n 自動化處理
