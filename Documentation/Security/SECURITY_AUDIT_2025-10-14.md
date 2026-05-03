# 🔒 安全審計報告 - 2025-10-14

> **報告來源**: Zeabur 安全洞察 (Zeabur Agent)
> **生成時間**: 2025年10月14日 上午9:10:50
> **風險等級**: 高
> **專案版本**: v1.1.0

> ⚠️ **2026-05-03 後記（v1.2.0 幼稚園改版）**：此份審計是 **v1.1.0 的時間點快照**，部分被點名的檔案在 v1.2.0 已不存在：
> - `components/ReportModal.tsx`、`components/ProgressBar.tsx`、`components/ScorePanel.tsx`、`utils/googleSheetParser.ts`、`src/constants.ts` 已隨多題問卷系統一併刪除
> - 所述的 XSS / debug 風險在當時的程式碼中存在，但攻擊面已隨著刪檔大幅縮減
> - `GEMINI_API_KEY` 透過 `vite.config.ts` `define` 注入前端 bundle 的問題仍然存在，**尚未修補**
>
> 修補進度與後續計畫請看 `Documentation/Security/SECURITY_FIX_PLAN.md` 與 `CHANGELOG.md` 的 `[Unreleased] - v1.2.0-security (Planned)` 條目。本檔保留原樣作為歷史紀錄。

---

## 📋 執行摘要

此應用程式在處理使用者輸入和顯示外部內容時存在潛在的安全風險。Zeabur Agent 分析了 4 個檔案，發現 **3 個安全問題**：

- **1 個高風險問題** - XSS 攻擊風險
- **2 個中風險問題** - 除錯資訊洩漏 + 前端計分竄改

---

## 🔍 發現的安全問題

### 🔴 問題 #1：XSS 攻擊風險（高風險）

**類別**: Input Validation & Sanitization
**嚴重性**: 🔴 高
**受影響檔案**: `components/ReportModal.tsx`
**受影響行數**: 32, 33, 63

#### 問題描述

在報告顯示學生姓名、班級或個人化洞察（來自 Gemini AI）的地方，程式碼沒有檢查這些內容是否包含惡意指令。這意味著：

1. 攻擊者可能在姓名或班級欄位輸入特殊的程式碼（如 `<script>alert('XSS')</script>`）
2. 如果 Gemini AI 產生的內容中包含惡意程式碼，這些程式碼可能在使用者查看報告時執行
3. 這可能導致攻擊者竊取其他人的個人資料、竄改網頁內容，或執行未經授權的操作

#### 受影響的程式碼片段

```tsx
// components/ReportModal.tsx
<p className="font-semibold text-gray-900">{studentName}</p>  // Line 46 - 未清理
<p className="font-semibold text-gray-900">{studentClass}</p>  // Line 50 - 未清理
<p className="text-gray-700 leading-relaxed">{geminiDescription}</p>  // Line 111 - 未清理
```

```tsx
// components/ResultsScreen.tsx
<h1>Your Career Path, {studentName}!</h1>  // Line 146 - 未清理
<p>{geminiDescription}</p>  // Line 210 - 未清理
```

#### Zeabur 建議修復

在顯示任何來自使用者輸入或外部來源（如 Gemini AI）的文字之前，務必對其進行清理（sanitization）。這可以確保任何惡意的程式碼都會被移除或轉換成無害的文字。

#### 實際風險評估

⚠️ **中等風險**（而非 Zeabur 評估的「高風險」）

**理由**：
- React 預設會自動 escape 大部分 HTML 特殊字元（`<`, `>`, `&` 等）
- 除非使用 `dangerouslySetInnerHTML`，否則純文字注入的 XSS 風險較低
- 但 Gemini AI 生成的內容仍需額外驗證（因為 AI 輸出較不可預測）

**實際攻擊情境**：
- 學生姓名輸入 `<img src=x onerror=alert(1)>` → React 會自動轉義為純文字顯示
- Gemini 描述包含特殊 Unicode 字元或混淆攻擊 → 仍有低機率風險

---

### 🟡 問題 #2：除錯資訊洩漏（中風險）

**類別**: Data Protection
**嚴重性**: 🟡 中
**受影響檔案**: `src/App.tsx`
**受影響行數**: 40-49, 100

#### 問題描述

當應用程式發生錯誤時，會顯示一個「技術細節」按鈕，點擊後會顯示來自 `getDebugInfo()` 函數的除錯資訊。如果這些除錯資訊包含：

- 敏感的系統配置
- 伺服器路徑
- 資料庫連接細節
- 內部錯誤訊息

任何人都可以看到這些資訊，可能被攻擊者用來了解系統結構，進而策劃攻擊。

#### 受影響的程式碼片段

```tsx
// src/App.tsx - ErrorScreen 元件
const ErrorScreen: React.FC<{ message: string; onRetry: () => void; debugInfo: string | null; }> = ({ message, onRetry, debugInfo }) => {
    const [showDebug, setShowDebug] = useState(false);

    return (
        <div>
            <p>{message}</p>
            {debugInfo && (
                <div>
                    <button onClick={() => setShowDebug(!showDebug)}>
                        {showDebug ? 'Hide' : 'Show'} Technical Details
                    </button>
                    {showDebug && (
                        <pre>{debugInfo}</pre>  // Line 34-35 - 顯示除錯資訊
                    )}
                </div>
            )}
        </div>
    );
};
```

```typescript
// utils/googleSheetParser.ts - getDebugInfo()
export async function getDebugInfo(): Promise<string> {
    // 返回 Google Sheets 連線診斷資訊
    return `Spreadsheet ID: ${SPREADSHEET_ID}\n\n${report.join('\n\n')}`;
}
```

#### Zeabur 建議修復

確保 `getDebugInfo()` 函數只返回對使用者無害的通用錯誤訊息，或者只在開發環境中顯示詳細的除錯資訊。

#### 實際風險評估

✅ **低風險**（而非 Zeabur 評估的「中風險」）

**理由**：
- `getDebugInfo()` 只返回 **Google Sheets 連線狀態**（工作表名稱、行數、欄位數）
- **不包含**：API Keys、資料庫憑證、伺服器路徑、系統內部資訊
- Spreadsheet ID 已公開（前端可見），洩漏無額外風險

**實際洩漏內容範例**：
```
Spreadsheet ID: 1E5eZFKRqsm2mR6WwldrkMP_-yyTqPfU5HOnRI9z7sl0

--- Fetching sheet: "Questions" ---
SUCCESS
  - Rows Found: 10
  - Columns Found: 3
  - Column Labels: ["question_id", "text", "order"]
```

**結論**：此資訊對攻擊者幫助有限，但為最佳實踐，建議限制為開發環境顯示。

---

### 🟡 問題 #3：前端計分竄改（中風險）

**類別**: Business Logic & Flow
**嚴重性**: 🟡 中
**受影響檔案**: `src/App.tsx`
**受影響行數**: 78-87, 110-117

#### 問題描述

應用程式在使用者電腦（前端）上收集答案並管理測驗流程。如果最終的測驗結果和個人化洞察（`geminiDescription`）完全基於使用者電腦上收集的答案來生成，而沒有經過伺服器端再次驗證，那麼使用者可以：

1. 修改瀏覽器記憶體中的答案陣列
2. 攔截並修改提交到伺服器的資料
3. 獲得任意想要的測驗結果

這就像讓學生自己批改考卷，可以隨意更改答案獲得滿分。

#### 受影響的程式碼片段

```tsx
// src/App.tsx
const handleSelectChoice = useCallback((optionId: string) => {
    setAnswers(prev => [...prev, optionId]);  // 前端儲存答案

    setTimeout(() => {
        if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            setGameState(GameState.Results);  // 直接進入結果畫面
        }
    }, 500);
}, [currentQuestionIndex, quizData]);
```

```typescript
// utils/scoring.ts - 前端計分邏輯
export function computeScores(
    selectedOptionIds: string[],  // 可被竄改的答案
    jobs: Job[],
    optionJobMap: OptionJobMapItem[]
): ScoringResults {
    // 完全在前端計算分數
    // ...
}
```

```typescript
// server/routes/questionnaire.ts - 後端只接收結果
router.post('/', async (req: Request, res: Response) => {
    const { recordId, answers, recommendedJobs, scores } = req.body;

    // ❌ 沒有重新驗證計分邏輯
    // ✅ 直接儲存前端傳來的結果
    await updateQuestionnaireRecord(recordId, {
        recommendedJobs,
        scores: scores || {},
    });
});
```

#### Zeabur 建議修復

將測驗答案發送到伺服器進行驗證和分數計算，而不是完全依賴前端邏輯。這可以確保即使使用者修改答案，伺服器也會根據正確的規則重新計算。

#### 實際風險評估

✅ **極低風險**（應用特性決定）

**不修復的理由**：

1. **應用特性**：這是一個 **職業探索測驗**，不是考試或評分系統
2. **無實質利益**：竄改結果無法獲得：
   - 金錢獎勵
   - 權限提升
   - 證書或資格
   - 任何其他實質利益
3. **使用者群體**：主要為學生用戶，惡意攻擊動機極低
4. **資料性質**：測驗結果僅供參考，不具法律效力或約束力

**攻擊成本 vs 收益**：
- 攻擊成本：需學習瀏覽器開發者工具 + JavaScript 修改技巧
- 攻擊收益：修改一個對自己沒有實質影響的職業建議
- **結論**：攻擊動機極低

**替代方案（如需未來加強）**：
- 在後端重新驗證計分邏輯（需將 `utils/scoring.ts` 移至 server/）
- 新增答案時間戳驗證（防止批量作弊）
- 記錄異常高分提交（監控而非阻止）

---

## 📊 分析資訊

**分析檔案數量**: 4
**分析檔案**:
- `App.tsx`
- `components/ProgressBar.tsx`
- `components/QuizScreen.tsx`
- `components/ReportModal.tsx`

**原始產生時間**: 2025年10月14日 上午8:51:22
**報告更新時間**: 2025年10月14日 上午9:10:50

---

## 🎯 Zeabur 一般建議

Zeabur Agent 提供的整體安全建議：

1. **輸入驗證與清理**
   對所有來自使用者輸入或外部來源（如 AI 服務）的文字內容，在顯示到網頁上之前，都必須進行嚴格的清理和驗證，以防止惡意程式碼執行。

2. **錯誤訊息管理**
   限制應用程式在錯誤訊息中顯示的技術細節。在公開環境中，只顯示對使用者有幫助的通用錯誤訊息，將詳細的除錯資訊記錄到安全的伺服器日誌中，供開發人員內部使用。

3. **伺服器端驗證**
   將所有涉及分數計算、結果生成或任何影響業務邏輯的處理，都移到安全的伺服器端進行。即使前端收集了答案，也應將其發送到伺服器進行重新驗證和處理，以防止使用者在自己的電腦上竄改結果。

4. **身份驗證與授權**
   考慮為測驗結果或報告添加身份驗證機制，確保只有相關的學生或授權人員才能查看特定的報告，防止未經授權的資訊洩漏。

---

## 🏁 後續行動

請參閱以下配套文件：

- **修復計畫**: [SECURITY_FIX_PLAN.md](SECURITY_FIX_PLAN.md) - 詳細的修復步驟與程式碼範例
- **測試清單**: [SECURITY_TESTING_CHECKLIST.md](SECURITY_TESTING_CHECKLIST.md) - 驗證修復效果的測試流程

---

**文件版本**: 1.0.0
**最後更新**: 2025-10-14
**負責人**: Development Team
