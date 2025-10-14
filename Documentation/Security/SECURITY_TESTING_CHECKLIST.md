# ✅ 安全修復測試清單

> **文件版本**: 1.0.0
> **建立日期**: 2025-10-14
> **對應文件**: [SECURITY_FIX_PLAN.md](SECURITY_FIX_PLAN.md)
> **測試目標**: 驗證 XSS 防護與除錯資訊管理修復效果

---

## 📋 測試環境準備

### 環境配置

```bash
# 1. 安裝依賴（確認 DOMPurify 已安裝）
npm install

# 2. 啟動開發環境
npm run dev

# 3. 開啟瀏覽器開發者工具
# Chrome/Edge: F12
# 準備監控 Console 輸出
```

### 測試工具

- **瀏覽器**: Chrome/Edge（最新版本）
- **開發者工具**: Console、Network、Elements 面板
- **測試裝置**: iPad（實際部署環境）或桌面瀏覽器模擬

---

## 🧪 測試案例

### 🔴 優先級 P1：XSS 防護測試

#### Test Case 1.1：學生姓名 XSS 攻擊測試

**測試步驟**：
1. 開啟應用程式首頁
2. 拍攝照片（或跳過）
3. 在「學生姓名」欄位輸入以下測試內容：

**測試資料**：

| 測試案例 | 輸入內容 | 預期結果 |
|---------|---------|---------|
| Script 標籤 | `<script>alert('XSS')</script>` | 顯示為純文字，不執行 alert |
| Image onerror | `<img src=x onerror=alert(1)>` | 顯示為純文字，不執行 alert |
| SVG 注入 | `<svg onload=alert('XSS')>` | 顯示為純文字，不執行 alert |
| HTML 標籤 | `<b>Bold Name</b>` | 顯示為純文字（包含標籤） |
| Unicode 特殊字元 | `\u003cscript\u003ealert('XSS')\u003c/script\u003e` | 顯示為純文字或正確轉義 |

**驗證方式**：
- [ ] 完成測驗後，檢查「結果畫面」標題
- [ ] 點擊「View Report」，檢查報告中的「Student Name」欄位
- [ ] 確認所有測試案例都顯示為純文字（無腳本執行）
- [ ] 使用開發者工具檢查 HTML 結構（應無 script 標籤）

**通過標準**：
- ✅ 所有 5 個測試案例都不執行任何腳本
- ✅ 文字正確顯示（即使包含特殊字元）
- ✅ Console 無錯誤訊息

---

#### Test Case 1.2：班級欄位 XSS 攻擊測試

**測試步驟**：
1. 在「班級」欄位輸入以下測試內容：

**測試資料**：

| 測試案例 | 輸入內容 | 預期結果 |
|---------|---------|---------|
| JavaScript URL | `javascript:alert('XSS')` | 顯示為純文字 |
| Data URL | `data:text/html,<script>alert('XSS')</script>` | 顯示為純文字 |
| Event handler | `<div onclick="alert('XSS')">Class</div>` | 顯示為純文字 |

**驗證方式**：
- [ ] 完成測驗後，點擊「View Report」
- [ ] 檢查報告中的「Class」欄位
- [ ] 確認所有測試案例都顯示為純文字

**通過標準**：
- ✅ 所有測試案例不執行腳本
- ✅ Console 無錯誤訊息

---

#### Test Case 1.3：Gemini AI 描述 XSS 測試

**測試目的**：驗證 AI 生成內容的清理

**測試步驟**：
1. 完成正常測驗流程
2. 等待 Gemini AI 生成職業描述

**手動模擬測試**（需修改程式碼測試）：
```typescript
// 暫時修改 ResultsScreen.tsx 用於測試
const testDescription = `
  Your career path looks promising! <script>alert('XSS')</script>
  You have strong <b>leadership</b> skills.
  <img src=x onerror=alert('Gemini XSS')>
`;
setGeminiDescription(testDescription);
```

**驗證方式**：
- [ ] 檢查「Personalized Insight」區塊
- [ ] 確認惡意腳本被移除或轉義
- [ ] 確認正常文字正確顯示

**通過標準**：
- ✅ Script 標籤被完全移除
- ✅ 正常文字內容保留
- ✅ 無腳本執行

---

#### Test Case 1.4：正常文字內容測試

**測試目的**：確保清理邏輯不會過度影響正常文字

**測試資料**：

| 測試案例 | 輸入內容 | 預期結果 |
|---------|---------|---------|
| 中文姓名 | `王小明` | 正確顯示 |
| 英文姓名 | `John Smith` | 正確顯示 |
| 特殊符號 | `O'Connor (愛爾蘭)` | 正確顯示（保留符號） |
| 長文字 | `This is a very long name with multiple words` | 正確顯示 |
| Emoji | `學生姓名 🎓` | 正確顯示（保留 Emoji） |

**驗證方式**：
- [ ] 檢查結果畫面
- [ ] 檢查報告顯示
- [ ] 確認所有正常文字完整顯示

**通過標準**：
- ✅ 所有正常文字正確顯示
- ✅ 無任何內容被錯誤移除
- ✅ 格式正確（無換行錯誤等）

---

### 🟡 優先級 P2：除錯資訊管理測試

#### Test Case 2.1：開發環境除錯資訊顯示

**測試環境**：`npm run dev`

**測試步驟**：
1. 修改 `utils/googleSheetParser.ts` 暫時破壞 API
   ```typescript
   // 將 SPREADSHEET_ID 改成無效值
   const SPREADSHEET_ID = 'INVALID_ID';
   ```
2. 重新啟動應用程式
3. 等待錯誤畫面出現

**驗證方式**：
- [ ] 確認錯誤畫面顯示
- [ ] 確認顯示「Show Technical Details (Dev Only)」按鈕
- [ ] 點擊按鈕，確認顯示除錯資訊（包含 Spreadsheet ID、錯誤詳情）
- [ ] 確認除錯資訊格式正確（JSON/文字）

**通過標準**：
- ✅ 開發環境顯示「Show Technical Details」按鈕
- ✅ 點擊後正確展開除錯資訊
- ✅ 除錯資訊包含有用的診斷內容

---

#### Test Case 2.2：生產環境除錯資訊隱藏

**測試環境**：`npm run build && npm run preview`

**測試步驟**：
1. 建置生產版本
   ```bash
   npm run build
   npm run preview
   ```
2. 開啟 `http://localhost:4173`（或指定 port）
3. 確保使用上一步驟的錯誤狀態（SPREADSHEET_ID 仍為 INVALID_ID）

**驗證方式**：
- [ ] 確認錯誤畫面顯示
- [ ] 確認**沒有**顯示「Show Technical Details」按鈕
- [ ] 確認顯示替代訊息：「If this problem persists, please contact support.」
- [ ] 開啟開發者工具 Console，確認無除錯資訊洩漏

**通過標準**：
- ✅ 生產環境完全隱藏除錯按鈕
- ✅ 只顯示使用者友善的錯誤訊息
- ✅ Console 無敏感資訊

**清理**：
```bash
# 測試完成後，恢復正確的 SPREADSHEET_ID
# 重新建置
npm run build
```

---

### 🔵 整合測試：完整流程驗證

#### Test Case 3.1：正常使用流程

**測試步驟**：
1. 開啟應用程式
2. 輸入正常姓名：`測試學生`
3. 輸入正常班級：`五年級 A 班`
4. 完成測驗（選擇任意答案）
5. 查看結果畫面
6. 點擊「View Report」查看報告

**驗證方式**：
- [ ] 所有畫面正常顯示
- [ ] 姓名/班級正確顯示
- [ ] Gemini 描述正常生成
- [ ] 報告列印預覽正常
- [ ] Console 無錯誤訊息

**通過標準**：
- ✅ 完整流程無任何錯誤
- ✅ 所有功能正常運作
- ✅ 效能無明顯影響

---

#### Test Case 3.2：後端驗證測試

**測試步驟**：
1. 開啟瀏覽器 Network 面板
2. 完成測驗流程
3. 觀察 `POST /api/submit-questionnaire` 請求

**驗證方式**：
- [ ] 檢查請求 Payload（Request Body）
- [ ] 確認 `studentName`, `studentClass`, `geminiDescription` 欄位存在
- [ ] 檢查回應（Response）狀態碼應為 `200`
- [ ] 確認回應包含 `{ success: true }`

**異常測試**：
```javascript
// 在 Console 手動發送異常資料
fetch('/api/submit-questionnaire', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recordId: 'test-id',
    answers: [],
    recommendedJobs: 'Teacher',
    scores: {},
    studentName: 'A'.repeat(200),  // 超過 100 字元限制
    studentClass: 'Class',
    geminiDescription: 'Normal'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

**預期結果**：
- [ ] 後端回應 `400 Bad Request`
- [ ] 錯誤訊息：`學生姓名 超過最大長度 100 字元`

**通過標準**：
- ✅ 正常資料成功提交
- ✅ 異常資料被正確攔截
- ✅ 錯誤訊息清晰明確

---

## 📊 測試報告模板

### 測試執行記錄

| 測試案例 | 執行日期 | 測試人員 | 結果 | 備註 |
|---------|---------|---------|------|------|
| Test Case 1.1 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |
| Test Case 1.2 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |
| Test Case 1.3 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |
| Test Case 1.4 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |
| Test Case 2.1 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |
| Test Case 2.2 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |
| Test Case 3.1 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |
| Test Case 3.2 | YYYY-MM-DD | 姓名 | ✅ 通過 / ❌ 失敗 | 問題描述（如有） |

### 測試總結

**測試統計**：
- 總測試案例數：8 個
- 通過案例數：___ 個
- 失敗案例數：___ 個
- 通過率：____%

**已知問題**：
1. 問題描述
   - 重現步驟
   - 影響範圍
   - 優先級

**建議事項**：
- 改進建議 1
- 改進建議 2

---

## 🔍 測試工具與技巧

### XSS 測試技巧

1. **檢查 HTML 源碼**
   ```javascript
   // 在 Console 執行
   document.querySelector('.target-element').innerHTML
   ```

2. **監控 DOM 變化**
   ```javascript
   // 設置 MutationObserver
   const observer = new MutationObserver(mutations => {
     mutations.forEach(mutation => {
       console.log('DOM changed:', mutation);
     });
   });
   observer.observe(document.body, { childList: true, subtree: true });
   ```

3. **CSP 檢查**（Content Security Policy）
   ```javascript
   // 檢查 CSP 標頭
   fetch(window.location.href)
     .then(res => console.log(res.headers.get('Content-Security-Policy')));
   ```

### 除錯資訊檢查

1. **環境變數驗證**
   ```javascript
   // 在 Console 執行（開發環境）
   console.log('Is Development:', import.meta.env.DEV);
   console.log('Mode:', import.meta.env.MODE);
   ```

2. **生產建置檢查**
   ```bash
   # 檢查建置後的檔案
   cat dist/assets/*.js | grep -i "debug\|console\.log"
   ```

---

## ✅ 驗收標準

修復通過測試的最低標準：

### 必須通過（Mandatory）

- [ ] **Test Case 1.1**：學生姓名 XSS 測試（5/5 通過）
- [ ] **Test Case 1.2**：班級欄位 XSS 測試（3/3 通過）
- [ ] **Test Case 1.4**：正常文字內容測試（5/5 通過）
- [ ] **Test Case 2.1**：開發環境除錯資訊顯示
- [ ] **Test Case 2.2**：生產環境除錯資訊隱藏
- [ ] **Test Case 3.1**：正常使用流程
- [ ] **Test Case 3.2**：後端驗證測試

### 建議通過（Recommended）

- [ ] **Test Case 1.3**：Gemini AI 描述 XSS 測試

### 效能標準

- [ ] 頁面載入時間增加 < 100ms
- [ ] 報告生成時間增加 < 50ms
- [ ] 記憶體使用增加 < 5MB

---

## 🔗 相關文件

- **修復計畫**: [SECURITY_FIX_PLAN.md](SECURITY_FIX_PLAN.md)
- **審計報告**: [SECURITY_AUDIT_2025-10-14.md](SECURITY_AUDIT_2025-10-14.md)

---

**文件版本**: 1.0.0
**最後更新**: 2025-10-14
**測試負責人**: QA Team
