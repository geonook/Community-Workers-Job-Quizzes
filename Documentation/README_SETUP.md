# Community Workers Job Quizzes - 設置說明

## Part 3: 後端 API - 已完成 ✅

### 已建立的檔案

<!-- AUTO-GENERATED: from server/ filesystem layout -->
**後端結構：**
```
server/
├── index.ts                    # Express 伺服器主檔案（生產環境同時提供 dist/ 靜態檔案）
├── routes/
│   ├── upload.ts              # POST /api/upload
│   ├── questionnaire.ts       # POST /api/submit-questionnaire
│   ├── status.ts              # GET /api/check-status/:recordId
│   └── gemini.ts              # POST /api/generate-description
└── utils/
    ├── airtable.ts            # Airtable 操作工具（createRecord / updateQuestionnaireRecord / getRecordStatus）
    └── webhook.ts             # n8n Webhook 觸發
```

> 注意：`server/` 沒有獨立的 `package.json` 或 `tsconfig.json`，使用根目錄的設定，透過 `tsx` 執行。
<!-- END AUTO-GENERATED -->

### API 端點說明

#### 1. POST /api/upload
建立 Airtable 記錄（照片上傳後）

**請求：**
```json
{
  "photoUrl": "https://res.cloudinary.com/...",
  "studentName": "Mia",
  "studentClass": "Kindergarten"
}
```

**回應：**
```json
{
  "success": true,
  "recordId": "rec123456",
  "message": "照片已成功儲存"
}
```

#### 2. POST /api/submit-questionnaire
提交問卷並觸發圖片處理

> v1.2.0 起，前端改成「單張卡片選一個職業」，所以 `answers` 只會有一個 jobKey、`recommendedJobs` 只會有一個 displayName、`scores` 也只會有一筆 `1`。

**請求：**
```json
{
  "recordId": "rec123456",
  "answers": ["doctor"],
  "recommendedJobs": "Doctor",
  "scores": { "doctor": 1 },
  "studentName": "Mia",
  "studentClass": "Kindergarten",
  "geminiDescription": "Mia, you'd be an amazing doctor! ..."
}
```

> `geminiDescription` 為前端在送出問卷前先呼叫 `POST /api/generate-description` 取得的 AI 職業描述，會儲存到 Airtable 的 `AI職業描述` 欄位。詳見 [server/routes/questionnaire.ts](../server/routes/questionnaire.ts)。
>
> `studentClass` 後端會驗證 `length >= 2`，前端固定送 `"Kindergarten"`（v1.2.0 移除班級輸入欄位）。

**回應：**
```json
{
  "success": true,
  "recommendedJobs": "Doctor",
  "message": "問卷已成功提交，照片處理中"
}
```

#### 3. GET /api/check-status/:recordId
查詢處理狀態

**請求：**
```
GET /api/check-status/rec123456
```

**回應：**
```json
{
  "success": true,
  "status": "完成",
  "resultUrl": "https://drive.google.com/...",
  "error": null
}
```

**狀態值：**
- `問卷中` - 剛上傳照片，尚未完成問卷
- `待處理` - 問卷已提交，等待 n8n 處理
- `處理中` - n8n 正在處理圖片
- `完成` - 處理完成，結果照片可用
- `失敗` - 處理失敗，查看錯誤訊息

#### 4. POST /api/generate-description
使用 Gemini API 產生個人化職業描述（約 50-70 字）。當未設定 `GEMINI_API_KEY` 或 API 失敗時，回傳由 `JOBS` 衍生的 song-lyric fallback（直接 echo 卡片上的句子加上 `" We can't wait to grow up!"`）。

**請求：**
```json
{
  "studentName": "Mia",
  "topJobs": [{ "job_id": "doctor", "job_name": "Doctor" }],
  "sortedScores": [{ "job_id": "doctor", "job_name": "Doctor", "score": 1 }]
}
```

> `job_id` 必須是 [src/data/jobs.ts](../src/data/jobs.ts) 定義的 11 個 key 之一（musician / police / hairdresser / firefighter / zookeeper / farmer / pilot / baker / artist / dancer / doctor）。

**回應：**
```json
{
  "success": true,
  "description": "..."
}
```

> 模型：`gemini-2.5-flash`（定義於 [server/routes/gemini.ts](../server/routes/gemini.ts)）。`gemini-2.0-flash-exp` 別名 2026-05 已被 Google 退役，會回 404。

### 環境變數設置

請在專案根目錄的 `.env.local` 檔案中設置以下變數（複製自 [`.env.example`](../.env.example)）：

<!-- AUTO-GENERATED: from .env.example + server source -->
```env
# Gemini（後端 + ⚠️ 也會被 vite.config.ts 注入到前端 bundle）
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary（前端 build-time）
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Airtable（後端）
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Students

# n8n Webhook（後端）
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/process-career

# 選用
PORT=4000                # Express 監聽埠（預設 4000）
NODE_ENV=development     # 由 npm start 自動設為 production
VITE_API_BASE_URL=       # 前後端不同 origin 時才填寫；同服務部署留空
```
<!-- END AUTO-GENERATED -->

### Airtable 資料表設置

實際使用的欄位結構（與 [server/utils/airtable.ts](../server/utils/airtable.ts) 對應）：

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| 學生姓名 | Single line text | 學生姓名 |
| 班級 | Single line text | 班級 |
| 原始照片 | Attachment | Cloudinary URL（自動轉換為附件）|
| 推薦職業 | Long text | 計算出的職業（多個用 / 分隔）|
| 問卷分數 | Long text | JSON 格式的完整計分結果 |
| **AI職業描述** | Long text | Gemini API 產生的職業描述（~50-70 字）|
| 處理狀態 | Single select | 選項：問卷中, 待處理, 處理中, 完成, 失敗 |
| 結果照片 | Attachment | n8n 處理後的照片（備用）|
| **結果URL** | URL | Google Drive 的結果連結（主要顯示來源）|
| 錯誤訊息 | Long text | 失敗時的錯誤訊息 |
| 建立時間 | Created time | 自動建立 |

### 啟動伺服器

```bash
# 同時啟動前端和後端
npm run dev

# 或分別啟動
npm run dev:server  # 後端 (port 4000)
npm run dev:client  # 前端 (port 3000)
```

### 測試 API

使用 curl 或 Postman 測試：

```bash
# 健康檢查
curl http://localhost:4000/api/health

# 測試上傳端點
curl -X POST http://localhost:4000/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl": "https://test.com/photo.jpg",
    "studentName": "Mia",
    "studentClass": "Kindergarten"
  }'
```

### n8n Webhook 設置

n8n 應該監聽 webhook 並執行以下操作：

1. **接收資料：**
   ```json
   {
     "recordId": "rec123456",
     "action": "process_career"
   }
   ```

2. **處理流程：**
   - 從 Airtable 讀取記錄（使用 recordId）
   - 更新狀態為「處理中」
   - 下載原始照片
   - 根據推薦職業進行圖片處理
   - 上傳結果照片到 Airtable
   - 更新狀態為「完成」或「失敗」

3. **錯誤處理：**
   - 如果處理失敗，更新狀態為「失敗」
   - 將錯誤訊息寫入「錯誤訊息」欄位

---

## 完成狀態（2026-05-03）

所有原始里程碑都已完成並上線：

- ✅ Part 1: 相機拍照（v1.2.0 改為 `getUserMedia` 直接拍）
- ✅ Part 2: iPad / 手機 / 桌面 RWD 全面優化
- ✅ Part 3: 後端 API（4 個 endpoint 全部上線）
- ✅ Part 4: 前端狀態輪詢與結果顯示（`ProcessingStatus` + `pollProcessingStatus`）

### 測試檢查清單（v1.2.0）

- [x] 後端伺服器啟動成功
- [x] /api/health 回應正常
- [x] /api/upload 寫入 Airtable
- [x] /api/submit-questionnaire 觸發 n8n webhook
- [x] /api/check-status 回傳目前狀態
- [x] /api/generate-description 回傳 Gemini 文字（或 JOBS-derived fallback）
- [x] 32/32 Vitest 測試
- [ ] 真實 iPad 上的 end-to-end 流程（每個版本上線前都建議跑一次）
- [ ] Lighthouse Accessibility 分數每頁 ≥ 90
- [ ] 測試 /api/submit-questionnaire
- [ ] 確認 n8n webhook 被觸發
- [ ] 測試 /api/check-status
