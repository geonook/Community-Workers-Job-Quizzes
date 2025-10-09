# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0-ai-description] - 2025-01-09

### ✨ Added

#### AI 職業描述儲存功能
- **[Feature]** 新增 Airtable `AI職業描述` 欄位，儲存 Gemini API 生成的完整職業建議文字
- **[Feature]** 問卷提交時自動將 AI 描述儲存至 Airtable
- **[Integration]** 前端 ResultsScreen 將 `geminiDescription` 傳送至後端 API
- **[Backend]** `server/routes/questionnaire.ts` 接收並處理 AI 描述參數
- **[Backend]** `server/utils/airtable.ts` 更新 `updateQuestionnaireRecord()` 寫入 AI 描述

### 🗑️ Removed

#### Google Sheets 舊備份系統
- **[Cleanup]** 移除舊的 Google Sheets 備份系統（-111 行程式碼）
- **[Cleanup]** 刪除 `src/config.ts` 檔案（SCRIPT_URL 不再需要）
- **[Cleanup]** 移除 ResultsScreen 的 Google Sheets 提交邏輯
- **[Cleanup]** 移除 "Configuration Required" 警告訊息
- **[Cleanup]** 移除未使用的 `submissionStatus` state

### 🎨 Improved

#### 架構優化
- **[Architecture]** 單一資料來源（Airtable）- 符合專案 "Single Source of Truth" 原則
- **[UX]** 消除警告訊息，改善使用者體驗
- **[Maintainability]** 簡化程式碼維護，移除重複的儲存邏輯
- **[Type Safety]** 更新 TypeScript 型別定義以支援新欄位

### 📝 Changed Files

- `server/utils/airtable.ts` - 新增 `AI職業描述` 欄位型別定義
- `server/routes/questionnaire.ts` - 接收並傳遞 `geminiDescription` 參數
- `src/types.ts` - `QuestionnaireSubmission` 新增 `geminiDescription?` 欄位
- `components/ResultsScreen.tsx` - 提交問卷時包含 AI 描述，移除舊系統
- `src/config.ts` - ❌ 完全移除

## [v1.0.0-scroll-fix] - 2025-01-08

### 🎯 重大修正 - iPad 捲動與顯示問題完整解決

這個版本完整修正了所有頁面無法捲動的關鍵問題，確保應用程式在 iPad Air (820x1180) 和其他裝置上都能正常運作。

### 🐛 Fixed

#### 核心捲動問題
- **[Critical]** 修正 `index.html` 中 `body` 和 `#root` 的 `overflow: hidden` 導致全站無法捲動
- **[Critical]** 修正 `App.tsx` 主容器的 `overflow-hidden` className 阻止內容捲動
- **[Critical]** 將固定高度 `h-screen` 改為 `min-h-screen`，允許內容超出時可捲動

#### StartScreen 修正
- 移除 `flex items-center justify-center` 強制垂直置中導致的捲動問題
- 改用 `py-12 md:py-16` 提供上下間距
- 新增 `mx-auto` 保持內容水平置中
- 所有表單元素現在都可正常捲動查看

#### QuizScreen 修正
- 保持 `h-screen overflow-hidden` 以支援圓形選項的絕對定位佈局
- 確保選項圓圈在所有裝置上正確顯示

#### ResultsScreen 修正
- **重構 ProcessingStatus 位置**：從卡片內層移到最外層作為獨立全螢幕覆蓋
- 移除包裹 ProcessingStatus 的白色卡片容器
- 修正 `fixed inset-0` 定位在巢狀容器中失效的問題
- 使用 `min-h-screen` 允許結果卡片可捲動瀏覽

#### ProcessingStatus 修正
- 新增 `overflow-hidden` 到主容器防止內容溢出
- 新增 `flex-shrink-0` 到標題和按鈕區域防止被壓縮
- 新增 `min-h-0` 到圖片容器修正 flexbox 的 min-height 預設值問題
- 新增 `w-auto h-auto` 讓職業照片保持正確比例
- 修正照片無法在全螢幕模式下顯示的問題

#### CameraCapture 修正
- 降低照片預覽最大高度：`md:max-h-[600px]` → `md:max-h-80` (600px → 320px)
- 防止照片預覽過高導致「Start Quiz」按鈕被推到螢幕外

### ✨ Enhanced

#### 響應式設計優化
- 統一使用 `min-h-screen` 作為主容器高度策略
- 優化間距系統：行動版使用較小間距，平板/桌面使用較大間距
- 改善 flexbox 佈局以支援內容捲動

#### 可訪問性改善
- 確保所有頁面內容都可透過捲動訪問
- 移除內容截斷問題
- 優化表單標籤和 ARIA 屬性

### 🎨 Design System (前一版本)

#### UI/UX 完整重新設計
- 統一色彩系統：Indigo-600 作為主要品牌色
- 建立 6/8 間距節奏系統
- 清晰的 4 層級文字階層（H1-H3 + Body）
- 卡片式佈局設計
- 創建完整的 [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) 文件

### 📱 Tested On

- ✅ iPad Air (820 x 1180)
- ✅ iPhone SE (375 x 667)
- ✅ Desktop (1920 x 1080)
- ✅ Chrome DevTools 模擬器
- ✅ 本地開發環境 (localhost:3000)
- ✅ Zeabur 生產環境 (career-explorer.zeabur.app)

### 🔧 Technical Details

#### 修改的檔案
1. `index.html` - 移除 body/root 的 overflow 限制
2. `src/App.tsx` - 主容器改用 min-h-screen
3. `components/StartScreen.tsx` - 移除垂直置中，支援捲動
4. `components/QuizScreen.tsx` - 保持固定高度以支援圓形佈局
5. `components/ResultsScreen.tsx` - ProcessingStatus 重構為最外層
6. `components/ProcessingStatus.tsx` - 修正 flexbox 圖片顯示
7. `components/CameraCapture.tsx` - 優化照片預覽高度

#### Git 提交記錄
- `9121725` - 🐛 修正全站捲動問題 - 完整解決 iPad 顯示與互動問題
- `4e50034` - 🐛 修正 StartScreen 捲動問題 - iPad Air 顯示優化
- `f0352f6` - 🎨 完整 UI/UX 重新設計 - 修正捲動問題並統一設計語言

### 📝 Migration Notes

如果您正在從舊版本升級：

1. **清除瀏覽器快取**：強制重新整理 (Cmd+Shift+R 或 Ctrl+Shift+R)
2. **檢查 index.html**：確保沒有自訂的 overflow 樣式
3. **測試所有頁面**：確認捲動功能在所有頁面都正常運作
4. **檢查照片上傳**：確認 ProcessingStatus 全螢幕顯示正常

### 🙏 Acknowledgments

感謝所有測試人員提供的詳細截圖和反饋，幫助我們快速定位並修正這些關鍵問題。

---

## [Previous Versions]

### v0.9.0 - UI/UX 重新設計
- 🎨 完整 UI/UX 重新設計
- 🖼️ 修正結果圖片顯示
- 📱 完整 RWD 優化

### v0.8.0 - iPad 優化
- 📱 優化 iPad 介面體驗
- 🎨 ResultsScreen 響應式設計

### v0.7.0 - Zeabur 部署修正
- 🐳 強制安裝 devDependencies
- 🚀 配置前後端分離部署架構
- 📚 新增 Zeabur 部署完整指南

### v0.6.0 - 前後端分離架構
- 🏗️ 創建獨立 API 服務
- 🔧 實作 Express 提供靜態檔案
- 📡 修復 Zeabur 部署 405 錯誤

---

**Legend:**
- 🎯 Major Release
- 🐛 Bug Fix
- ✨ Enhancement
- 🎨 Design
- 📱 Responsive
- 🔧 Technical
- 📚 Documentation
- 🚀 Deployment
