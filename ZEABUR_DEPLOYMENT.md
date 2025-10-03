# Zeabur 部署指南

## 📋 部署前準備

### 1. 在 Zeabur Dashboard 設定環境變數

前往您的 Zeabur 專案 → 服務設定 → Environment Variables

#### 必要環境變數：

```bash
# 前端環境變數 (建置時注入)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# 後端環境變數 (執行時使用)
AIRTABLE_API_KEY=your_airtable_personal_access_token
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TABLE_NAME=Students
N8N_WEBHOOK_URL=your_n8n_webhook_url

# 選填環境變數
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ **安全提醒**: 請使用實際的值替換上述佔位符。您可以在 `.env.local` 檔案中找到這些值。

### 2. Zeabur 建置設定

在 Zeabur 服務設定中：

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: 3000 (前端), 4000 (後端，自動偵測)

## 🚀 部署步驟

### 方法 1: GitHub 自動部署（推薦）

1. 確保所有修改已推送到 GitHub development 分支
2. 在 Zeabur 連接 GitHub repository
3. 選擇 development 分支
4. 設定環境變數（見上方）
5. 觸發部署

### 方法 2: 手動部署

```bash
# 1. 確保本地建置成功
npm run build

# 2. 推送到 GitHub
git add .
git commit -m "chore: prepare for zeabur deployment"
git push origin development

# 3. 在 Zeabur dashboard 點擊 "Redeploy"
```

## ⚠️ 重要注意事項

1. **環境變數變更後必須重新部署**
   - Vite 環境變數 (VITE_*) 在建置時注入
   - 修改後需要 Redeploy 才能生效

2. **PORT 設定**
   - 前端預設 3000
   - 後端預設 4000
   - Zeabur 會自動處理 port mapping

3. **API Proxy**
   - 前端的 `/api` 請求會自動轉發到後端 4000 port
   - 由 vite.config.ts 的 preview.proxy 設定處理

## 🔍 疑難排解

### 問題 1: 405 Method Not Allowed

**原因**: 後端 Express server 沒有正確啟動

**解決**:
- 檢查 Start Command 是否為 `npm start`
- 確認 package.json 的 start script 正確
- 查看 Zeabur logs 確認後端是否啟動

### 問題 2: Cloudinary 上傳失敗

**原因**: 環境變數未設定或建置時未注入

**解決**:
- 確認 VITE_CLOUDINARY_* 環境變數已設定
- **重新部署**（環境變數變更需要重新建置）

### 問題 3: Airtable 連接失敗

**原因**: API Key 權限不足或環境變數錯誤

**解決**:
- 檢查 AIRTABLE_API_KEY 是否有 read/write 權限
- 確認 AIRTABLE_BASE_ID 和 TABLE_NAME 正確
- 查看後端 logs 確認錯誤訊息

## 📊 部署後檢查清單

- [ ] 前端頁面能正常載入
- [ ] Cloudinary 照片上傳功能正常
- [ ] Airtable 記錄建立成功
- [ ] 問卷提交正常
- [ ] n8n webhook 觸發成功
- [ ] 狀態輪詢正常運作
- [ ] 結果照片能正確顯示

## 🔗 相關連結

- Zeabur Dashboard: https://zeabur.com
- GitHub Repository: https://github.com/geonook/Community-Workers-Job-Quizzes
- n8n Webhook: https://n8geonook.zeabur.app/webhook/career-transform
