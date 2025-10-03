# Zeabur 部署完整指南

> 前後端分離架構：Main 分支 + Development 分支 + 共用後端 API

---

## 📊 部署架構

```
Zeabur 服務架構
├── Service 1: Frontend (Main 分支)       → 正式環境前端
├── Service 2: Frontend (Development 分支) → 測試環境前端
└── Service 3: Backend API (NEW)           → 共用後端 API ⭐
```

---

## 🚀 部署步驟

### 階段 1: 建立後端 API 服務（10分鐘）

#### 1.1 在 Zeabur Dashboard 建立新服務

1. 前往您的 Zeabur 專案
2. 點擊 **"Create Service"** 或 **"新增服務"**
3. 選擇 **"Git"**
4. 選擇 Repository: `Community-Workers-Job-Quizzes`
5. 選擇分支: `development` ⭐

#### 1.2 設定服務名稱和配置

- **Service Name**: `backend-api` 或您偏好的名稱
- **Root Directory**: `server` ⭐ **非常重要！**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### 1.3 設定環境變數

在服務設定中新增以下環境變數：

```bash
# 伺服器設定
PORT=4000

# CORS - 前端 URL（部署後更新）
FRONTEND_URL_MAIN=https://your-main-frontend.zeabur.app
FRONTEND_URL_DEV=https://your-dev-frontend.zeabur.app

# Airtable 設定
AIRTABLE_API_KEY=your_airtable_personal_access_token
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TABLE_NAME=Students

# n8n Webhook
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

#### 1.4 部署後端服務

1. 點擊 **"Deploy"**
2. 等待建置完成（約 2-3 分鐘）
3. **記錄後端 API URL**，例如：
   - `https://your-backend-api.zeabur.app`

#### 1.5 測試後端 API

在瀏覽器開啟：
```
https://your-backend-api.zeabur.app/api/health
```

應該看到：
```json
{
  "status": "ok",
  "timestamp": "2025-10-03T..."
}
```

---

### 階段 2: 更新前端環境變數（5分鐘）

#### 2.1 更新 Main 分支前端服務

1. 前往 Main 分支的前端服務
2. 進入 **"Variables"** 或 **"環境變數"**
3. 新增/更新以下變數：

```bash
# API 後端 URL
VITE_API_BASE_URL=https://your-backend-api.zeabur.app

# Cloudinary 設定（如果還沒設定）
VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m
VITE_CLOUDINARY_UPLOAD_PRESET=career_nano
```

4. 點擊 **"Redeploy"** 重新部署

#### 2.2 更新 Development 分支前端服務

1. 前往 Development 分支的前端服務
2. 進入 **"Variables"**
3. 新增/更新**完全相同**的環境變數：

```bash
VITE_API_BASE_URL=https://your-backend-api.zeabur.app
VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m
VITE_CLOUDINARY_UPLOAD_PRESET=career_nano
```

4. 點擊 **"Redeploy"**

---

### 階段 3: 更新後端 CORS 設定（3分鐘）

前端部署完成後，您會得到前端的 URL。需要回到後端更新 CORS 設定。

#### 3.1 記錄前端 URL

假設您的前端 URL 是：
- Main 分支：`https://community-workers-main.zeabur.app`
- Development 分支：`https://community-workers-dev.zeabur.app`

#### 3.2 更新後端環境變數

1. 回到後端 API 服務
2. 更新環境變數：

```bash
FRONTEND_URL_MAIN=https://community-workers-main.zeabur.app
FRONTEND_URL_DEV=https://community-workers-dev.zeabur.app
```

3. **重新部署後端**（環境變數變更需要重啟）

---

## ✅ 測試驗證清單

### 1. 測試 Development 環境

開啟 Development 前端 URL，測試完整流程：

- [ ] ✅ 頁面能正常載入
- [ ] ✅ 輸入姓名、班級
- [ ] ✅ 拍照上傳（Cloudinary）
- [ ] ✅ Airtable 記錄建立成功
- [ ] ✅ 完成職業測驗問卷
- [ ] ✅ 問卷提交成功
- [ ] ✅ 狀態輪詢正常運作
- [ ] ✅ （可選）結果照片顯示

### 2. 測試 Main 環境

在 Main 前端 URL 執行相同測試。

### 3. 檢查 Airtable

1. 開啟 Airtable Base
2. 查看 "Students" table
3. 確認測試記錄已建立
4. 確認欄位都正確填寫

### 4. 檢查後端 Logs

在 Zeabur 後端服務查看 Logs：

```
✅ 應該看到：
- POST /api/upload
- POST /api/submit-questionnaire
- GET /api/check-status/:recordId
- ✅ n8n webhook 已觸發
```

---

## 🐛 疑難排解

### 問題 1: 405 Method Not Allowed

**症狀**: 前端顯示 "Failed to load resource: 405"

**原因**:
- 後端 API 沒有正確啟動
- 或前端沒有設定 `VITE_API_BASE_URL`

**解決方案**:
1. 檢查後端服務是否正常運行
2. 檢查前端 `VITE_API_BASE_URL` 環境變數
3. **重新部署前端**（環境變數需要重新建置）

---

### 問題 2: CORS Error

**症狀**:
```
Access to fetch at 'https://backend...' from origin 'https://frontend...'
has been blocked by CORS policy
```

**原因**: 後端 CORS 設定不包含前端 URL

**解決方案**:
1. 檢查後端環境變數 `FRONTEND_URL_MAIN` 和 `FRONTEND_URL_DEV`
2. 確認 URL 完全正確（包括 https://）
3. 重新部署後端

---

### 問題 3: Cloudinary 上傳失敗

**症狀**: "Cloudinary 設定未完成"

**原因**: 前端環境變數未設定

**解決方案**:
1. 檢查前端環境變數：
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
2. **重新部署前端**

---

### 問題 4: Airtable 連接失敗

**症狀**: "儲存記錄失敗"

**原因**: Airtable API Key 無權限或錯誤

**解決方案**:
1. 檢查 `AIRTABLE_API_KEY` 是否有 `data.records:write` 權限
2. 檢查 `AIRTABLE_BASE_ID` 和 `AIRTABLE_TABLE_NAME`
3. 查看後端 logs 確認詳細錯誤

---

## 📋 環境變數總覽

### 後端 API 服務

| 變數名稱 | 範例值 | 用途 |
|---------|--------|------|
| PORT | 4000 | 後端 port |
| FRONTEND_URL_MAIN | https://main.zeabur.app | CORS 白名單 |
| FRONTEND_URL_DEV | https://dev.zeabur.app | CORS 白名單 |
| AIRTABLE_API_KEY | patXXX... | Airtable 存取 |
| AIRTABLE_BASE_ID | appXXX | Airtable Base |
| AIRTABLE_TABLE_NAME | Students | Table 名稱 |
| N8N_WEBHOOK_URL | https://... | n8n webhook |

### 前端服務 (Main & Dev)

| 變數名稱 | 範例值 | 用途 |
|---------|--------|------|
| VITE_API_BASE_URL | https://backend.zeabur.app | 後端 API URL |
| VITE_CLOUDINARY_CLOUD_NAME | dbbtudo2m | Cloudinary |
| VITE_CLOUDINARY_UPLOAD_PRESET | career_nano | Cloudinary |

---

## 🔄 日常部署流程

### 更新 Development 環境

1. 修改程式碼
2. Commit & Push 到 `development` 分支
3. Zeabur 自動偵測並重新部署
4. 測試功能

### 發佈到 Main 環境

1. 確認 Development 測試通過
2. Merge `development` → `main`
3. Zeabur 自動部署 Main 分支
4. 正式環境上線

---

## 📞 技術支援

如果遇到無法解決的問題：

1. 查看 Zeabur 服務的 **Logs**
2. 檢查瀏覽器 **Console** 錯誤訊息
3. 確認所有環境變數正確設定
4. 檢查 GitHub 最新 commit 是否包含所需變更

---

**部署完成！** 🎉

您現在有三個服務在 Zeabur 上運行：
- ✅ Main 分支前端（正式環境）
- ✅ Development 分支前端（測試環境）
- ✅ 共用後端 API
