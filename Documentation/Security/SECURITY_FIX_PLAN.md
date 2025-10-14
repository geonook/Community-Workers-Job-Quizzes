# 🔧 安全漏洞修復計畫

> **文件版本**: 1.0.0
> **建立日期**: 2025-10-14
> **對應審計報告**: [SECURITY_AUDIT_2025-10-14.md](SECURITY_AUDIT_2025-10-14.md)
> **目標版本**: v1.2.0（安全強化版）

---

## 📋 目錄

1. [修復優先順序](#-修復優先順序)
2. [優先級 1：XSS 防護](#-優先級-1xss-防護)
3. [優先級 2：除錯資訊管理](#-優先級-2除錯資訊管理)
4. [優先級 3：計分邏輯驗證](#-優先級-3計分邏輯驗證-暫不實作)
5. [完整實作步驟](#-完整實作步驟)
6. [資源評估](#-資源評估)

---

## 🎯 修復優先順序

根據實際風險評估，建議的修復優先順序：

| 優先級 | 問題 | 嚴重性 | 實際風險 | 修復建議 | 預估工時 |
|-------|------|--------|---------|---------|---------|
| **P1** | XSS 攻擊風險 | 🔴 高 | ⚠️ 中 | ✅ **建議立即修復** | 1.5-2 小時 |
| **P2** | 除錯資訊洩漏 | 🟡 中 | ✅ 低 | 📝 **建議選擇性修復** | 0.5 小時 |
| **P3** | 前端計分竄改 | 🟡 中 | ✅ 極低 | ❌ **暫不修復** | 4-6 小時 |

**建議執行範圍**：P1 + P2（總計約 2-2.5 小時）

---

## 🛡️ 優先級 1：XSS 防護

### 問題描述

使用者輸入（姓名、班級）和 AI 生成內容（Gemini 描述）未經清理直接顯示在頁面上，存在潛在 XSS 風險。

### 受影響檔案

1. `components/ReportModal.tsx` - 3 處
2. `components/ResultsScreen.tsx` - 2 處
3. `server/routes/questionnaire.ts` - 後端驗證

### 修復方案：安裝 DOMPurify

#### Step 1：安裝依賴套件

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**套件說明**：
- `dompurify`: 業界標準的 HTML/文字清理工具
- 支援瀏覽器和 Node.js 環境
- 自動移除潛在的惡意程式碼

#### Step 2：建立清理工具函數

**新建檔案**: `utils/sanitize.ts`

```typescript
import DOMPurify from 'dompurify';

/**
 * 清理使用者輸入文字，防止 XSS 攻擊
 * @param text - 需要清理的文字
 * @returns 清理後的安全文字
 */
export function sanitizeText(text: string): string {
  // 移除所有 HTML 標籤，只保留純文字
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],  // 不允許任何 HTML 標籤
    ALLOWED_ATTR: []   // 不允許任何屬性
  });
}

/**
 * 清理 HTML 內容（保留部分安全標籤）
 * 用於需要保留格式的場景（如 AI 描述）
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],  // 只允許這些標籤
    ALLOWED_ATTR: []  // 不允許任何屬性（避免 onclick 等）
  });
}
```

#### Step 3：修改 `components/ReportModal.tsx`

**位置**: Line 46, 50, 111

```tsx
import React from 'react';
import { ScoringResults } from '../src/types';
import { sanitizeText } from '../utils/sanitize';  // ✅ 新增 import

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    studentClass: string;
    results: ScoringResults;
    geminiDescription: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    studentName,
    studentClass,
    results,
    geminiDescription
}) => {
    if (!isOpen) return null;

    // ✅ 清理輸入內容
    const safeStudentName = sanitizeText(studentName);
    const safeStudentClass = sanitizeText(studentClass);
    const safeGeminiDescription = sanitizeText(geminiDescription);

    const topJobText = results.topJobs.length > 0
        ? results.topJobs.map(j => j.job_name).join(' / ')
        : 'N/A';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 printable-area print:bg-white print:items-start print:p-0 p-4">
            <div className="bg-white text-gray-800 p-6 md:p-10 rounded-2xl shadow-2xl max-w-xl md:max-w-3xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-full print:h-full print:rounded-none">
                <div id="printable-report">
                    {/* Report Header */}
                    <div className="text-center mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Career Explorer Report</h2>
                        <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
                    </div>

                    {/* Student Info */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:text-base">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm mb-1">Student Name</p>
                                {/* ✅ 使用清理後的內容 */}
                                <p className="font-semibold text-gray-900">{safeStudentName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm mb-1">Class</p>
                                {/* ✅ 使用清理後的內容 */}
                                <p className="font-semibold text-gray-900">{safeStudentClass}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-500 text-xs md:text-sm mb-1">Report Date</p>
                                <p className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8 text-sm md:text-base">
                        {/* Top Job Suggestion */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-base md:text-xl mb-3 flex items-center gap-2">
                                <span className="text-2xl">🎯</span>
                                Top Job Suggestion(s)
                            </h3>
                            <div className="p-4 md:p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                                <p className="text-base md:text-lg font-semibold text-indigo-700">{topJobText}</p>
                            </div>
                        </div>

                        {/* Full Score Report */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-base md:text-xl mb-3 flex items-center gap-2">
                                <span className="text-2xl">📊</span>
                                Full Score Report
                            </h3>
                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 md:p-4 font-semibold text-gray-700 text-sm md:text-base">Job / Career</th>
                                            <th className="p-3 md:p-4 font-semibold text-gray-700 text-sm md:text-base text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.sortedScores.map((scoreItem, index) => (
                                            <tr
                                                key={scoreItem.job_id}
                                                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                            >
                                                <td className="p-3 md:p-4 text-gray-800 border-t border-gray-200">
                                                    {scoreItem.job_name}
                                                </td>
                                                <td className="p-3 md:p-4 text-gray-800 border-t border-gray-200 text-right font-semibold">
                                                    {scoreItem.score}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Personalized Insight */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-base md:text-xl mb-3 flex items-center gap-2">
                                <span className="text-2xl">💡</span>
                                Personalized Insight
                            </h3>
                            <div className="p-4 md:p-5 bg-gray-50 rounded-xl border-l-4 border-indigo-500">
                                {/* ✅ 使用清理後的內容 */}
                                <p className="text-gray-700 leading-relaxed">{safeGeminiDescription}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 mt-6 md:mt-8 print:hidden">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all transform hover:scale-105 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-gray-300"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all transform hover:scale-105 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    >
                        Print Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
```

#### Step 4：修改 `components/ResultsScreen.tsx`

**位置**: Line 146, 210

```tsx
import React, { useMemo, useState, useEffect } from 'react';
import { QuizData, ScoringResults, QuestionnaireSubmission } from '../src/types';
import ReportModal from './ReportModal';
import ProcessingStatus from './ProcessingStatus';
import { computeScores } from '../utils/scoring';
import { submitQuestionnaire } from '../utils/api';
import { getApiUrl } from '../config/api';
import { sanitizeText } from '../utils/sanitize';  // ✅ 新增 import

// ... (其他程式碼保持不變)

const ResultsScreen: React.FC<ResultsScreenProps> = ({
    answers,
    quizData,
    onRestart,
    studentName,
    studentClass,
    recordId,
    photoUrl
}) => {
    const [geminiDescription, setGeminiDescription] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [questionnaireSubmitted, setQuestionnaireSubmitted] = useState(false);

    // ✅ 清理輸入內容
    const safeStudentName = sanitizeText(studentName);
    const safeGeminiDescription = sanitizeText(geminiDescription);

    const results = useMemo<ScoringResults>(() => {
        return computeScores(answers, quizData.jobs, quizData.optionJobMap);
    }, [answers, quizData]);

    // ... (其他邏輯保持不變)

    return (
        <>
            {/* Processing Status */}
            {recordId && questionnaireSubmitted && (
                <ProcessingStatus
                    recordId={recordId}
                    onComplete={(resultUrl) => {
                        console.log('🎉 Result photo ready:', resultUrl);
                    }}
                    onError={(error) => {
                        console.error('❌ Processing error:', error);
                    }}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 py-8 md:py-12">
                <div className="max-w-3xl mx-auto px-4 space-y-6 md:space-y-8">

                {/* Welcome Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up">
                    <div className="text-center mb-4">
                        <div className="text-5xl md:text-6xl mb-3">🎉</div>
                        {/* ✅ 使用清理後的內容 */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Your Career Path, {safeStudentName}!
                        </h1>
                        <p className="text-base md:text-lg text-gray-600">
                            Based on your responses, here are personalized career recommendations
                        </p>
                    </div>
                </div>

                {/* ... (其他卡片元件) */}

                {/* AI Insight Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                        Personalized Insight
                    </h2>

                    {!isLoading && geminiDescription && (
                        <div className="p-4 md:p-5 bg-gray-50 rounded-xl border-l-4 border-indigo-500">
                            {/* ✅ 使用清理後的內容 */}
                            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                                {safeGeminiDescription}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 md:gap-5 pb-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <button onClick={onRestart} className="...">Restart Quiz</button>
                    <button onClick={() => setIsReportVisible(true)} className="...">View Report</button>
                </div>
            </div>

            <ReportModal
                isOpen={isReportVisible}
                onClose={() => setIsReportVisible(false)}
                studentName={studentName}  // ReportModal 內部會清理
                studentClass={studentClass}
                results={results}
                geminiDescription={geminiDescription}
            />
            </div>
        </>
    );
};

export default ResultsScreen;
```

#### Step 5：加強後端驗證

**修改檔案**: `server/routes/questionnaire.ts`

```typescript
import { Router, Request, Response } from 'express';
import { updateQuestionnaireRecord } from '../utils/airtable.js';
import { triggerN8nWebhook } from '../utils/webhook.js';

const router = Router();

/**
 * 驗證輸入長度（防止異常大量資料）
 */
function validateInputLength(text: string, maxLength: number, fieldName: string): void {
  if (text && text.length > maxLength) {
    throw new Error(`${fieldName} 超過最大長度 ${maxLength} 字元`);
  }
}

/**
 * 清理文字內容（移除控制字元）
 */
function sanitizeServerInput(text: string): string {
  if (!text) return '';
  // 移除控制字元（保留換行符）
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { recordId, answers, recommendedJobs, scores, studentName, studentClass, geminiDescription } = req.body;

    // 驗證必填欄位
    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: '缺少 recordId',
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: '缺少或格式錯誤的 answers',
      });
    }

    if (!recommendedJobs) {
      return res.status(400).json({
        success: false,
        error: '缺少 recommendedJobs',
      });
    }

    // ✅ 新增：輸入長度驗證
    try {
      validateInputLength(studentName, 100, '學生姓名');
      validateInputLength(studentClass, 100, '班級');
      validateInputLength(geminiDescription, 2000, 'AI 描述');
      validateInputLength(recommendedJobs, 500, '推薦職業');
    } catch (validationError: any) {
      return res.status(400).json({
        success: false,
        error: validationError.message,
      });
    }

    // ✅ 新增：清理輸入內容
    const safeGeminiDescription = sanitizeServerInput(geminiDescription);

    // 更新 Airtable 記錄
    await updateQuestionnaireRecord(recordId, {
      recommendedJobs,
      scores: scores || {},
      geminiDescription: safeGeminiDescription,  // ✅ 使用清理後的內容
    });

    console.log(`✅ 問卷已提交: ${recordId} - ${recommendedJobs}`);

    // 非同步觸發 n8n webhook（不等待結果）
    triggerN8nWebhook(recordId).catch((err) => {
      console.error('Webhook trigger failed (non-blocking):', err);
    });

    res.json({
      success: true,
      recommendedJobs,
      message: '問卷已成功提交,照片處理中',
    });
  } catch (error: any) {
    console.error('Questionnaire submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '伺服器錯誤',
    });
  }
});

export default router;
```

---

## 🔍 優先級 2：除錯資訊管理

### 問題描述

ErrorScreen 元件在生產環境顯示技術細節，可能洩漏系統資訊。

### 修復方案：環境變數控制

#### 修改 `src/App.tsx`

**位置**: Line 28-39

```tsx
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, QuizData, Question as QuestionType } from './types';
import StartScreen from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import ResultsScreen from '../components/ResultsScreen';
import ProgressBar from '../components/ProgressBar';
import { getQuizData, getDebugInfo } from '../utils/googleSheetParser';

// ... (其他程式碼)

// Error Screen Component
const ErrorScreen: React.FC<{ message: string; onRetry: () => void; debugInfo: string | null; }> = ({ message, onRetry, debugInfo }) => {
    const [showDebug, setShowDebug] = useState(false);

    // ✅ 只在開發環境顯示除錯按鈕
    const isDevelopment = import.meta.env.DEV;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-white p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
            <p className="text-lg mb-6">{message}</p>
            <button
                onClick={onRetry}
                className="bg-yellow-400 text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-yellow-500 transition-colors"
            >
                Try Again
            </button>

            {/* ✅ 只在開發環境顯示技術細節 */}
            {isDevelopment && debugInfo && (
                <div className="mt-6">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-sm text-gray-300 hover:text-white underline"
                    >
                        {showDebug ? 'Hide' : 'Show'} Technical Details (Dev Only)
                    </button>
                    {showDebug && (
                        <pre className="mt-4 p-4 bg-black/30 rounded-lg text-left text-xs whitespace-pre-wrap font-mono max-w-full overflow-x-auto">
                            {debugInfo}
                        </pre>
                    )}
                </div>
            )}

            {/* ✅ 生產環境的替代訊息 */}
            {!isDevelopment && (
                <p className="mt-6 text-sm text-gray-300">
                    If this problem persists, please contact support.
                </p>
            )}
        </div>
    );
};

// ... (其他程式碼保持不變)
```

**效果**：
- 開發環境（`npm run dev`）：顯示「Show Technical Details (Dev Only)」按鈕
- 生產環境（`npm run build`）：只顯示通用錯誤訊息

---

## ⏸️ 優先級 3：計分邏輯驗證（暫不實作）

### 為什麼暫不實作？

1. **應用特性**：職業探索測驗，非考試系統
2. **無利益誘因**：竄改結果無實質利益
3. **架構成本高**：需重構整個計分系統（4-6 小時工作量）
4. **使用者群體**：學生用戶，惡意攻擊動機極低

### 如需未來實作（參考架構）

#### 架構變更概要

```
現況：
  Frontend: answers[] → computeScores() → results
  Backend: 接收 results（不驗證）

未來（如需加強）：
  Frontend: answers[] → 提交到後端
  Backend: 接收 answers[] → computeScores() → 驗證 → 儲存 results
```

#### 實作步驟（預估 4-6 小時）

1. **移動計分邏輯到後端**
   - 將 `utils/scoring.ts` 複製到 `server/utils/scoring.ts`
   - 修改 import 路徑以支援 Node.js 環境

2. **修改後端 API**
   - `POST /api/submit-questionnaire` 接收 `answers[]` 而非 `results`
   - 在後端執行 `computeScores()`
   - 比對前端傳來的 `recommendedJobs` 是否與後端計算一致

3. **新增異常監控**
   - 記錄前後端計分結果不一致的情況
   - 發送告警通知（可選）

4. **測試驗證**
   - 單元測試：後端計分邏輯
   - 整合測試：前後端計分結果一致性
   - 竄改測試：驗證後端成功攔截異常資料

**結論**：除非應用性質改變（例如成為正式考試系統），否則建議暫不實作。

---

## 🚀 完整實作步驟

### Phase 1：準備階段（10 分鐘）

```bash
# 1. 確認目前分支
git status

# 2. 建立修復分支
git checkout -b security-fix-xss-protection

# 3. 安裝依賴套件
npm install dompurify
npm install --save-dev @types/dompurify
```

### Phase 2：實作階段（1.5 小時）

**任務清單**：
- [ ] 建立 `utils/sanitize.ts`（5 分鐘）
- [ ] 修改 `components/ReportModal.tsx`（15 分鐘）
- [ ] 修改 `components/ResultsScreen.tsx`（15 分鐘）
- [ ] 修改 `server/routes/questionnaire.ts`（20 分鐘）
- [ ] 修改 `src/App.tsx`（除錯資訊管理）（10 分鐘）

### Phase 3：測試階段（30 分鐘）

**測試項目**：
1. **XSS 防護測試**
   ```bash
   # 啟動開發環境
   npm run dev

   # 測試案例：
   - 姓名輸入：<script>alert('XSS')</script>
   - 班級輸入：<img src=x onerror=alert(1)>
   - 預期：顯示為純文字，不執行腳本
   ```

2. **正常流程測試**
   - 完成完整測驗流程
   - 驗證報告正常顯示
   - 確認 Gemini 描述正常顯示

3. **除錯資訊測試**
   - 開發環境：應顯示「Show Technical Details」按鈕
   - 生產環境：`npm run build && npm run preview`，應隱藏按鈕

詳細測試清單請參閱：[SECURITY_TESTING_CHECKLIST.md](SECURITY_TESTING_CHECKLIST.md)

### Phase 4：部署階段（20 分鐘）

```bash
# 1. 提交變更
git add .
git commit -m "🔒 安全強化 - 新增 XSS 防護與除錯資訊管理

- 安裝 DOMPurify 進行輸入清理
- 清理所有使用者輸入與 AI 生成內容
- 限制除錯資訊只在開發環境顯示
- 加強後端輸入長度驗證

Fixes: Zeabur Security Audit Issue #1 (High), #2 (Medium)
Ref: Documentation/Security/SECURITY_AUDIT_2025-10-14.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 2. 推送到 GitHub
git push origin security-fix-xss-protection

# 3. 合併到 development 分支
git checkout development
git merge security-fix-xss-protection
git push origin development

# 4. 部署到 Zeabur
# （Zeabur 會自動偵測 development 分支變更並重新部署）
```

---

## 📊 資源評估

### 工作量估算

| 階段 | 任務 | 預估時間 | 複雜度 |
|------|------|---------|--------|
| 準備 | 環境設定 + 套件安裝 | 10 分鐘 | 🟢 簡單 |
| 實作 | P1: XSS 防護 | 55 分鐘 | 🟡 中等 |
| 實作 | P2: 除錯資訊管理 | 10 分鐘 | 🟢 簡單 |
| 測試 | 功能測試 + XSS 測試 | 30 分鐘 | 🟡 中等 |
| 部署 | Git 提交 + 推送 | 20 分鐘 | 🟢 簡單 |
| **總計** | **P1 + P2** | **2-2.5 小時** | 🟡 中等 |

### 影響範圍

| 類別 | 變更檔案數 | 新增檔案數 | 測試需求 |
|------|-----------|-----------|---------|
| 前端元件 | 3 個 | 1 個 | 中等 |
| 後端 API | 1 個 | 0 個 | 簡單 |
| 依賴套件 | - | +1 (dompurify) | - |

### 風險評估

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|---------|
| DOMPurify 相容性問題 | 低 | 低 | 廣泛使用的成熟套件 |
| 正常文字被過度清理 | 低 | 中 | 測試階段驗證 |
| 效能影響 | 極低 | 極低 | 只清理顯示內容（非大量資料） |
| 部署失敗 | 低 | 中 | 先在開發環境完整測試 |

---

## 📝 驗收標準

修復完成後，應滿足以下標準：

### 功能性
- [ ] 所有使用者輸入正確清理（姓名、班級）
- [ ] AI 生成內容正確清理（Gemini 描述）
- [ ] 正常文字內容正確顯示（無過度清理）
- [ ] 除錯資訊只在開發環境顯示

### 安全性
- [ ] XSS 測試案例全部通過（無腳本執行）
- [ ] 後端輸入長度驗證生效
- [ ] 生產環境無敏感資訊洩漏

### 相容性
- [ ] 開發環境正常運作
- [ ] 生產環境正常運作
- [ ] 所有現有功能不受影響

### 效能
- [ ] 頁面載入時間無明顯增加
- [ ] 報告生成速度不受影響

---

## 🔗 相關文件

- **安全審計報告**: [SECURITY_AUDIT_2025-10-14.md](SECURITY_AUDIT_2025-10-14.md)
- **測試清單**: [SECURITY_TESTING_CHECKLIST.md](SECURITY_TESTING_CHECKLIST.md)
- **專案規範**: [../../CLAUDE.md](../../CLAUDE.md)

---

**文件版本**: 1.0.0
**最後更新**: 2025-10-14
**負責人**: Development Team
**預計實作版本**: v1.2.0
