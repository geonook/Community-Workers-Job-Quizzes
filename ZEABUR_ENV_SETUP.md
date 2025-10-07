# Zeabur 環境變數快速設定

## 🎯 前端環境變數（3 個）

```bash
VITE_API_BASE_URL=https://backend-api-cw7k.zeabur.app
VITE_CLOUDINARY_CLOUD_NAME=dbbtudo2m
VITE_CLOUDINARY_UPLOAD_PRESET=career_nano
```

**設定後重新部署前端！**

---

## 🎯 後端環境變數（10 個）

```bash
NODE_ENV=production
PORT=4000

# ⚠️ 重要：URL 不要加結尾斜線（/）
FRONTEND_URL_MAIN=https://career-explorer.zeabur.app
FRONTEND_URL_DEV=https://career-explorer.zeabur.app

AIRTABLE_API_KEY=【從 .env.local 複製】
AIRTABLE_BASE_ID=【從 .env.local 複製】
AIRTABLE_TABLE_NAME=Students

N8N_WEBHOOK_URL=【從 .env.local 複製】

CLOUDINARY_CLOUD_NAME=dbbtudo2m
CLOUDINARY_API_KEY=【從 .env.local 複製】
CLOUDINARY_API_SECRET=【從 .env.local 複製】

GEMINI_API_KEY=【從 .env.local 複製】
```

**設定後重新部署後端！**

### 🔴 常見錯誤

**CORS 錯誤**：如果看到 `Access-Control-Allow-Origin` 錯誤
- ✅ 確認 `FRONTEND_URL_*` **沒有結尾斜線**
- ✅ 確認 URL 拼寫正確（包含 `https://`）
- ✅ **重新部署後端**（修改環境變數後必須重新部署）

---

## 📌 快速查詢 .env.local 的值

在本地專案執行：

```bash
cat .env.local
```

複製需要的值到 Zeabur 對應的環境變數中。

---

## ⚠️ 重要提醒

1. **前端只能放 `VITE_` 開頭的變數**
2. **設定環境變數後必須重新部署**（否則不會生效）
3. **查詢前端 URL**: Zeabur Dashboard → 您的前端服務 → 查看 Domains
