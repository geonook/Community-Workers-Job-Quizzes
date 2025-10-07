# Zeabur 前端環境變數配置指南

> **用途**: 修正 405 錯誤 - 前端無法連接後端

## 🎯 問題診斷

### 後端狀態
- ✅ **後端已成功部署**
- ✅ **後端 URL**: `https://backend-api-cw7k.zeabur.app`
- ✅ **健康檢查**: `/api/health` 返回 200 OK

### 前端問題
- ❌ **前端缺少 `VITE_API_BASE_URL` 環境變數**
- ❌ **前端嘗試調用相對路徑 `/api/upload`**
- ❌ **結果**: 405 Method Not Allowed

---

## ✅ 解決方案

### 步驟 1: 前往前端 Zeabur 服務

1. 登入 [Zeabur Dashboard](https://zeabur.com)
2. 找到您的**前端服務**（不是 backend-api 那個）
3. 點擊進入服務詳情

### 步驟 2: 設定環境變數

點擊 **"Variables"** 或 **"環境變數"** 頁籤，新增以下變數：

```bash
# ⭐ 最重要 - 後端 API URL
VITE_API_BASE_URL=https://backend-api-cw7k.zeabur.app

# Cloudinary 配置
VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m
VITE_CLOUDINARY_UPLOAD_PRESET=career_nano
```

### 步驟 3: 重新部署前端

⚠️ **關鍵步驟**：

1. 在前端服務頁面，找到 **"Redeploy"** 或 **"重新部署"** 按鈕
2. 點擊執行重新部署
3. 等待建置完成（約 2-3 分鐘）

**為什麼必須重新部署？**
- `VITE_*` 環境變數在**建置時**注入到前端程式碼
- 只是新增變數不會生效，必須重新建置

### 步驟 4: 驗證配置

部署完成後，打開前端 URL，按 F12 開啟 Console，應該看到：

```javascript
🔧 API Configuration:
  Base URL: https://backend-api-cw7k.zeabur.app
  Remote API: Yes
```

如果仍然顯示：
```javascript
Base URL: (relative path - via proxy)
```

表示**沒有重新部署**或環境變數設定錯誤。

---

## 🔍 測試上傳功能

### 在前端頁面測試

1. 輸入學生姓名和班級
2. 拍照並上傳
3. 打開 **Network Tab** (F12 → Network)
4. 查看 `/api/upload` 請求

**✅ 成功的情況：**
```
Request URL: https://backend-api-cw7k.zeabur.app/api/upload
Status Code: 200 OK
Response:
{
  "success": true,
  "recordId": "recXXXXXXXXXXXX",
  "imageUrl": "https://res.cloudinary.com/...",
  "message": "照片上傳成功"
}
```

**❌ 仍然失敗：**
```
Request URL: https://your-frontend.zeabur.app/api/upload
Status Code: 405 Method Not Allowed
```
→ 表示環境變數沒有生效，請確認**已重新部署**

---

## 📋 後端環境變數（可選）

### 如果需要設定 CORS

前往**後端服務** (backend-api-cw7k)，新增：

```bash
# 允許的前端 URL
FRONTEND_URL_MAIN=https://your-frontend-main.zeabur.app
FRONTEND_URL_DEV=https://your-frontend-dev.zeabur.app

# Airtable 配置
AIRTABLE_API_KEY=【從 .env.local 複製您的 Airtable API Key】
AIRTABLE_BASE_ID=【從 .env.local 複製您的 Base ID】
AIRTABLE_TABLE_NAME=Students

# n8n Webhook
N8N_WEBHOOK_URL=【從 .env.local 複製您的 n8n Webhook URL】

# Cloudinary (後端直接上傳使用)
CLOUDINARY_CLOUD_NAME=dbbtudo2m
CLOUDINARY_API_KEY=【從 .env.local 複製您的 API Key】
CLOUDINARY_API_SECRET=【從 .env.local 複製您的 API Secret】
```

設定後**重新部署後端**。

---

## 🎯 快速檢查清單

### 前端配置 ✓

- [ ] 新增 `VITE_API_BASE_URL=https://backend-api-cw7k.zeabur.app`
- [ ] 新增 `VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m`
- [ ] 新增 `VITE_CLOUDINARY_UPLOAD_PRESET=career_nano`
- [ ] **已點擊 Redeploy 重新部署**
- [ ] Console 顯示正確的 Base URL
- [ ] Network Tab 顯示請求到 backend-api-cw7k.zeabur.app

### 後端配置 ✓

- [x] 後端已部署成功
- [x] `/api/health` 返回 200 OK
- [ ] 環境變數已設定（Airtable, n8n, Cloudinary）
- [ ] CORS 允許前端 URL

---

## 📞 常見問題

### Q1: 設定環境變數後仍然 405

**A**: 請確認：
1. ✅ 環境變數名稱拼寫正確（**V**ITE_API_BASE_URL）
2. ✅ URL 包含 https://（完整 URL）
3. ✅ **已重新部署**（這是最常忘記的步驟）
4. ✅ 清除瀏覽器快取並重新載入

### Q2: Console 仍顯示 "relative path - via proxy"

**A**: 表示環境變數沒有注入，原因：
- 沒有重新部署
- 環境變數名稱錯誤
- Zeabur 建置失敗

**解決方案**:
1. 檢查 Zeabur Logs 確認建置成功
2. 再次確認環境變數名稱
3. 強制重新部署

### Q3: CORS 錯誤而非 405

**A**: 表示後端收到請求但拒絕了，需要：
1. 在後端設定 `FRONTEND_URL_*` 環境變數
2. 重新部署後端

---

## ✨ 成功標誌

當一切正常時，您會看到：

**Console 輸出：**
```javascript
📤 上傳照片到 Cloudinary...
✅ Cloudinary 上傳成功
💾 建立 Airtable 記錄...
✅ 記錄建立成功
```

**沒有 405 錯誤，沒有 CORS 錯誤！** 🎉

---

## 📝 記錄您的配置

**前端服務名稱**: _________________

**前端 URL**: _________________

**後端 URL**: `https://backend-api-cw7k.zeabur.app`

**環境變數設定日期**: _________________

**最後部署日期**: _________________

---

**🎯 如果按照此指南操作後仍有問題，請檢查 Zeabur Logs 並提供錯誤訊息。**
