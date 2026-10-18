# Railway 部署指南 - Monorepo 單一服務架構

> 2026-10 起正式站改放 Railway。原本的 Zeabur 部署（2026-09-21 ～ 2026-10-18）已停用，舊版指南在 git 歷史裡的 `Documentation/ZEABUR-DEPLOYMENT-GUIDE.md`。

## 🎯 專案架構

本專案採用 **Monorepo 單一服務架構**：
- **前端**：React 19 + TypeScript + Vite
- **後端**：Express + TypeScript
- **部署方式**：單一 Railway 服務，用根目錄的 [`Dockerfile`](../Dockerfile) 建置，Express 同時提供前端靜態檔案和 API

```
使用者訪問 https://community-workers-quiz.geonook.app
     ↓
Railway 服務 community-workers-quiz（容器 port 8080）
     ├─ 靜態檔案請求 → dist/（前端）
     └─ API 請求 (/api/*) → API 路由（後端）
                              └─ 觸發 n8n webhook → https://n8n.geonook.app/webhook/career-transform（workflow g2career）
```

> ⚠️ 問卷服務所在的 Railway 專案裡**還有其他正式服務**，n8n 也是共用的。部署問卷時只動 `community-workers-quiz` 這個服務：不要停掉或重啟 n8n、不要動其他服務。

---

## ⏸️ 目前狀態：2026-10-18 起暫停

問卷刻意下線，沒有刪除任何東西：

- Railway 服務 `community-workers-quiz` 已用 `railway down` 移除執行中的部署，服務、變數、網域都保留。https://community-workers-quiz.geonook.app 回 404 是預期的
- n8n 流程 `g2career` 已 unpublish，`/webhook/career-transform` 回 404
- 原因：Gemini 文字生成和 n8n 照片生成用的 Google AI 帳戶回 HTTP 402 `RESOURCE_EXHAUSTED`（預付餘額 0）

### 恢復上線步驟

1. 處理 Google AI 付款
2. 確認服務變數 `N8N_WEBHOOK_URL` 指向 `https://n8n.geonook.app/webhook/career-transform`
3. 在新 n8n 重新 publish `g2career`
4. 照下面「更新部署」執行一次 `railway up`
5. 跑一次完整測試（見「驗證部署」），**一定要等到 AI 肖像出現**——停用前照片生成這段沒有驗證成功

---

## 📋 第一次設定

### 步驟 1：連結本機 repo 與 Railway 服務

```bash
railway login
railway link        # 依提示選專案、環境，服務選 community-workers-quiz
railway status      # 確認連到的是 community-workers-quiz
```

`railway link` 只會在本機記下連結，不會改動雲端。

### 步驟 2：建置方式

Railway 偵測到根目錄的 `Dockerfile` 就用它建置（builder = DOCKERFILE），不需要其他設定檔：

<!-- AUTO-GENERATED: from Dockerfile -->
```bash
FROM node:22-alpine
ARG COMMIT_SHA=unknown               # 標記這次部署的是哪個 commit
npm install --production=false       # 強制安裝 devDependencies
ARG VITE_CLOUDINARY_CLOUD_NAME       # build-time 注入
ARG VITE_CLOUDINARY_UPLOAD_PRESET
RUN npm run build                    # 產生 dist/
ENV NODE_ENV=production
CMD ["npm", "start"]                  # 等同於 build + tsx server/index.ts
```
<!-- END AUTO-GENERATED -->

Railway 會把服務變數自動當成 Docker build 參數傳給 `Dockerfile` 裡宣告過的 `ARG`，所以 `VITE_*` 和 `COMMIT_SHA` 只要設成服務變數就好。

### 步驟 3：設定服務變數

在 Railway 後台 → 服務 → **Variables** 設定：

<!-- AUTO-GENERATED: from .env.example + Dockerfile ARGs -->
| 變數 | 必要 | 階段 | 說明 |
|---|---|---|---|
| `AIRTABLE_API_KEY` | 是 | runtime | Airtable token，需要 `data.records:write` |
| `AIRTABLE_BASE_ID` | 是 | runtime | `appXXXXXXXXXXXXXX` |
| `AIRTABLE_TABLE_NAME` | 是 | runtime | 通常為 `Students` |
| `GEMINI_API_KEY` | 是 | runtime（⚠️ `vite.config.ts` 的 define 也會把它帶進前端 bundle，見安全稽核） | 由 [server/routes/gemini.ts](../server/routes/gemini.ts) 使用；未設定或 Gemini 失敗時回傳 fallback 文字 |
| `N8N_WEBHOOK_URL` | 是（要做照片時） | runtime | `https://n8n.geonook.app/webhook/career-transform` |
| `VITE_CLOUDINARY_CLOUD_NAME` | 是 | **build-time**（Dockerfile ARG） | Cloudinary cloud 名稱 |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | 是 | **build-time**（Dockerfile ARG） | Cloudinary unsigned upload preset |
| `COMMIT_SHA` | 建議 | build-time（Dockerfile ARG） | 上傳式部署看不出是哪個 commit，部署前手動設 |
| `PORT` | **是** | runtime | 設 `8080`，網域的 target port 也是 8080 |
| `NODE_ENV` | **不要設** | runtime | Dockerfile 已設 `production`；設成 `development` 會讓 Express 不提供 `dist/` |
| `VITE_API_BASE_URL` | 否 | build-time | 留空（同 origin）；只有前後端拆開部署才設 |
<!-- END AUTO-GENERATED -->

> **build-time vs runtime**：`VITE_*` 在 build 時打包進前端，改了**一定要重新部署**才生效。其餘是 runtime 變數，改完服務重啟就生效。
>
> ⚠️ `railway variables` 會把所有變數的值印在終端機。只要查名稱時用 `railway variables --json` 再自己過濾 key，不要把輸出貼到任何地方。

### 步驟 4：網域

服務 → **Settings → Networking**：自訂網域 `community-workers-quiz.geonook.app`，另有 Railway 預設的 `*.up.railway.app` 網域。兩者的 target port 都是 `8080`。

---

## 🚀 更新部署（正式流程：上傳式）

服務目前**沒有綁 GitHub**：push 到 `quiz` 只是備份，不會上線。要上線時在 repo 根目錄手動上傳：

```bash
git status                     # 必須是乾淨的——railway up 上傳的是「本機目前的檔案」，包含沒 commit 的改動
git push origin quiz           # 先備份
railway variables --set "COMMIT_SHA=$(git rev-parse --short HEAD)" --skip-deploys
railway up --ci                # 上傳並串流 build log，build 完才結束
```

- `railway up` 會略過 `.gitignore` 列的檔案（`.env.local`、`node_modules`、`dist` 不會被上傳）
- build 約 2-3 分鐘；容器啟動時 `npm start` 會再 build 一次前端，多等十幾秒
- 要暫停服務：`railway down`（只移除目前部署，服務和變數保留）

### 之後想改成「push 就自動部署」

停用期間**不要**做這一步：綁定後 Railway 會立刻部署一次，等於把網站重新開起來。恢復上線、而且改版頻繁時再考慮：

1. Railway 後台安裝 GitHub App，授權 `geonook/Community-Workers-Job-Quizzes`
2. 把服務來源接到 `quiz` 分支：
   ```bash
   railway service source connect --repo geonook/Community-Workers-Job-Quizzes --branch quiz --service community-workers-quiz
   ```
3. 服務 → **Settings → Build → Watch Paths** 設定只在程式變動時部署，避免改文件也觸發，例如：
   ```
   src/**
   components/**
   config/**
   utils/**
   server/**
   index.html
   package.json
   package-lock.json
   Dockerfile
   vite.config.ts
   tailwind.config.js
   postcss.config.js
   tsconfig.json
   ```
4. 綁定後就不再需要 `railway up` 和手動設 `COMMIT_SHA`；部署紀錄會顯示 commit，也可以在後台一鍵回滾

---

## ✅ 驗證部署

開 https://community-workers-quiz.geonook.app ，確認國小問卷流程：

- [ ] 姓名和班級都輸入 2 個字以上，相機才會開；拍照上傳完成後「Start quiz!」才能按
- [ ] 10 題依序出現，「Question N of 10」和進度點正確，第 2 題起有 Back
- [ ] 選項圖片壞掉時改顯示文字卡，不會卡住
- [ ] 答完後 Network 依序看到 `/api/upload`（拍照時）→ `/api/generate-description` → `/api/submit-questionnaire`
- [ ] 結果頁顯示「{name}, you'd be a great {job}!」、職業卡和 AI 描述
- [ ] `/api/check-status/:recordId` 每 3 秒輪詢，120 秒內 AI 肖像出現（Airtable `處理狀態` = `完成`、`結果URL` 有值）
- [ ] 「Next student」回到開始畫面

---

## 🔧 本地開發

1. `npm install`
2. `cp .env.example .env.local`（範本在專案根目錄，前後端共用同一份 `.env.local`），填入上面表格的變數；本機不用設 `PORT`、`COMMIT_SHA`
3. `npm run dev`：前端 Vite http://localhost:3000 ，後端 Express http://localhost:4000 ，Vite 會把 `/api/*` 轉給後端

---

## 🐛 常見問題

### 網站回 404
服務目前沒有執行中的部署（例如被 `railway down` 暫停）。照「更新部署」重新 `railway up`。

### 網站回 502 或一直連不上
- 確認 `PORT=8080`，網域 target port 也是 8080
- 看 Railway **Deploy Logs** 是否有啟動錯誤（例如缺 Airtable 變數）

### Build 失敗
看 **Build Logs**；確認 `VITE_CLOUDINARY_*` 已設定成服務變數。

### 前端空白頁
`npm run build` 失敗或 `NODE_ENV` 被設成非 production。確認沒有設 `NODE_ENV` 變數後重新部署。

### API 回 500
看 **Deploy Logs**；確認 `AIRTABLE_API_KEY`、`AIRTABLE_BASE_ID`、`AIRTABLE_TABLE_NAME` 都已設定且 token 有效。

### AI 描述一直是同一句 fallback
Gemini 呼叫失敗。2026-10 的原因是 Google AI 帳戶回 402（預付餘額 0），處理付款後就會恢復。

### AI 肖像一直出不來（`處理狀態` 變 `失敗`）
- Airtable `錯誤訊息` 若是「Gemini 圖片生成失敗…API 回應格式錯誤」，通常是 Google AI 額度或付款問題
- 確認 `g2career` 已 publish、`N8N_WEBHOOK_URL` 指向新站
- 到 n8n 看該次 execution 的錯誤

### 輪詢逾時
n8n 超過 120 秒沒做完。看 n8n execution 花在哪個節點；必要時調整 [utils/api.ts](../utils/api.ts) 的輪詢次數和間隔。注意 Airtable 免費方案每月只有 1,000 次 API 呼叫，輪詢越密用得越快。

---

**架構**：Monorepo 單一服務（Dockerfile）
**適用分支**：`quiz`
