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

# Cloudinary 配置（前端直接上傳使用）
VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m
VITE_CLOUDINARY_UPLOAD_PRESET=career_nano
```

⚠️ **安全警告**：
- **前端環境變數只能包含以 `VITE_` 開頭的變數**
- **絕對不要在前端設定以下變數**（會暴露在瀏覽器中）：
  - ❌ `AIRTABLE_API_KEY`
  - ❌ `GEMINI_API_KEY`
  - ❌ `N8N_WEBHOOK_URL`
  - ❌ `CLOUDINARY_API_SECRET`
  - ❌ 任何包含 `PASSWORD`、`SECRET`、`TOKEN` 的變數

💡 **如果您的前端目前有這些變數，請立即刪除它們！**

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

## 📋 後端環境變數配置（必要）

### 步驟 1: 前往後端 Zeabur 服務

1. 在 Zeabur Dashboard 中找到 **backend-api-cw7k** 服務
2. 點擊進入服務詳情
3. 點擊 **"Variables"** 頁籤

### 步驟 2: 設定所有必要的環境變數

#### 🔴 當前問題
您的後端目前使用**佔位符**（placeholder）值，導致功能完全無法運作：
- `AIRTABLE_API_KEY=your_airtable_personal_access_token` ❌
- `CLOUDINARY_API_KEY=your_cloudinary_api_key` ❌
- 等等...

#### ✅ 正確配置

```bash
# Node.js 環境
NODE_ENV=production
PORT=4000

# CORS - 允許的前端 URL（重要！請填入您的實際前端 URL）
FRONTEND_URL_MAIN=https://【您的前端服務URL】.zeabur.app
FRONTEND_URL_DEV=https://【您的前端服務URL】.zeabur.app

# Airtable 配置
AIRTABLE_API_KEY=【從您的 .env.local 複製 - 格式：pat...】
AIRTABLE_BASE_ID=【從您的 .env.local 複製 - 格式：app...】
AIRTABLE_TABLE_NAME=Students

# n8n Webhook
N8N_WEBHOOK_URL=【從您的 .env.local 複製 - 完整 webhook URL】

# Cloudinary 配置
CLOUDINARY_CLOUD_NAME=dbbtudo2m
CLOUDINARY_API_KEY=【需要從您的 .env.local 檔案中取得】
CLOUDINARY_API_SECRET=【需要從您的 .env.local 檔案中取得】

# Gemini API（如果後端有使用）
GEMINI_API_KEY=【從您的 .env.local 複製 - 格式：AIza...】
```

### 步驟 3: 取得缺少的 Cloudinary 金鑰

在您的本地專案中執行：

```bash
# 查看 .env.local 檔案
cat .env.local | grep CLOUDINARY
```

找到 `CLOUDINARY_API_KEY` 和 `CLOUDINARY_API_SECRET` 的值，複製到 Zeabur 後端環境變數中。

### 步驟 4: 找到您的前端 URL

在 Zeabur Dashboard 中：
1. 找到您的**前端服務**（不是 backend-api）
2. 在服務頁面上方會顯示 **Domains** 或 **域名**
3. 複製完整的 URL（例如：`https://community-workers-abc123.zeabur.app`）
4. 填入後端的 `FRONTEND_URL_MAIN` 和 `FRONTEND_URL_DEV`

### 步驟 5: 重新部署後端

⚠️ **必須執行**：設定環境變數後，點擊 **"Redeploy"** 重新部署後端。

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

### Q4: 如何找到我的前端 URL？

**方法 1: Zeabur Dashboard**
1. 登入 Zeabur
2. 找到您的前端服務（不是 backend-api）
3. 服務頁面上方會顯示 **Domains** 區域
4. 複製完整 URL（例如：`https://community-workers-job-quizzes.zeabur.app`）

**方法 2: 檢查部署日誌**
1. 在前端服務中點擊 **"Logs"** 或 **"日誌"**
2. 查找類似 `Deployed to https://...` 的訊息

**方法 3: 從瀏覽器位址列**
1. 如果您已經開啟前端網站
2. 直接從瀏覽器複製 URL

### Q5: 後端環境變數設定完後還是錯誤？

**檢查清單**:
1. ✅ 確認所有佔位符（`your_*`）都已替換為實際值
2. ✅ 確認**已重新部署後端**（設定環境變數後必須重新部署）
3. ✅ 檢查 Zeabur 後端 Logs 是否有錯誤訊息
4. ✅ 測試後端健康檢查：`https://backend-api-cw7k.zeabur.app/api/health`

### Q6: 如何驗證後端環境變數已正確載入？

查看後端 Zeabur Logs，應該看到類似輸出：

```
🚀 Server is running on port 4000
📡 API endpoint: http://localhost:4000/api

環境變數檢查:
  AIRTABLE_API_KEY: ✅ 已設定
  AIRTABLE_BASE_ID: ✅ 已設定
  AIRTABLE_TABLE_NAME: ✅ 已設定
  N8N_WEBHOOK_URL: ✅ 已設定
```

如果顯示 `❌ 未設定` → 環境變數配置有問題

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

## 🔒 安全最佳實務

### ❌ 絕對不要做的事

1. **不要在前端暴露後端密鑰**
   ```bash
   # 錯誤示範 - 這些變數會暴露在瀏覽器中！
   AIRTABLE_API_KEY=pat...  # ❌ 前端不應有此變數
   GEMINI_API_KEY=AIza...   # ❌ 前端不應有此變數
   N8N_WEBHOOK_URL=https... # ❌ 前端不應有此變數
   ```

2. **不要在 Git 中提交 .env 檔案**
   - 確保 `.env.local` 在 `.gitignore` 中
   - 使用 Zeabur 的環境變數功能管理生產環境密鑰

3. **不要在文檔中寫入真實密鑰**
   - 使用佔位符或說明文字
   - 引導使用者從安全來源複製

### ✅ 正確的架構

```
前端 (Vite)
├── VITE_API_BASE_URL          ✅ 公開 API 端點
├── VITE_CLOUDINARY_CLOUD_NAME ✅ 公開服務名稱
└── VITE_CLOUDINARY_UPLOAD_PRESET ✅ 公開預設值

後端 (Express)
├── AIRTABLE_API_KEY           ✅ 私密（僅後端）
├── GEMINI_API_KEY             ✅ 私密（僅後端）
├── N8N_WEBHOOK_URL            ✅ 私密（僅後端）
├── CLOUDINARY_API_SECRET      ✅ 私密（僅後端）
└── FRONTEND_URL_*             ✅ CORS 白名單
```

### 🔍 如何檢查前端是否洩漏密鑰

1. 打開前端網站
2. 按 F12 → Console
3. 輸入：`console.log(import.meta.env)`
4. 檢查輸出：**應該只看到 `VITE_` 開頭的變數**

如果看到 `AIRTABLE_API_KEY` 或其他密鑰 → **立即從前端環境變數中刪除！**

---

## 📝 記錄您的配置

**前端服務名稱**: _________________

**前端 URL**: _________________

**後端 URL**: `https://backend-api-cw7k.zeabur.app`

**環境變數設定日期**: _________________

**最後部署日期**: _________________

---

## 📚 相關文件

- [CLAUDE.md](CLAUDE.md) - 專案開發規範
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 完整部署指南
- [README.md](README.md) - 專案說明

---

**🎯 如果按照此指南操作後仍有問題，請檢查 Zeabur Logs 並提供錯誤訊息。**
