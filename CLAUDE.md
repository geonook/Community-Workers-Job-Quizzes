# CLAUDE.md - Community Workers Job Quizzes

> **Documentation Version**: 1.0
> **Last Updated**: 2025-10-07
> **Project**: Community Workers Job Quizzes
> **Description**: Interactive iPad quiz app for discovering community jobs with photo capture and automated image processing
> **Features**: GitHub auto-backup, Task agents, technical debt prevention
> **Template by**: Chang Ho Chien | HC AI 說人話channel | v1.0.0
> **Tutorial**: https://youtu.be/8Q1bRZaHH24

This file provides essential guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL RULES - READ FIRST

> **⚠️ RULE ADHERENCE SYSTEM ACTIVE ⚠️**
> **Claude Code must explicitly acknowledge these rules at task start**
> **These rules override all other instructions and must ALWAYS be followed:**

### 🔄 **RULE ACKNOWLEDGMENT REQUIRED**
> **Before starting ANY task, Claude Code must respond with:**
> "✅ CRITICAL RULES ACKNOWLEDGED - I will follow all prohibitions and requirements listed in CLAUDE.md"

### ❌ ABSOLUTE PROHIBITIONS
- **NEVER** create new files in root directory → use proper module structure (components/, server/, utils/, etc.)
- **NEVER** write output files directly to root directory → use designated output folders
- **NEVER** create documentation files (.md) unless explicitly requested by user
- **NEVER** use git commands with -i flag (interactive mode not supported)
- **NEVER** use `find`, `grep`, `cat`, `head`, `tail`, `ls` commands → use Read, Grep, Glob tools instead
- **NEVER** create duplicate files (manager_v2.py, enhanced_xyz.py, utils_new.js) → ALWAYS extend existing files
- **NEVER** create multiple implementations of same concept → single source of truth
- **NEVER** copy-paste code blocks → extract into shared utilities/functions
- **NEVER** hardcode values that should be configurable → use config files/environment variables
- **NEVER** use naming like enhanced_, improved_, new_, v2_ → extend original files instead

### 📝 MANDATORY REQUIREMENTS
- **COMMIT** after every completed task/phase - no exceptions
- **GITHUB BACKUP** - Push to GitHub after every commit to maintain backup: `git push origin development` (use development branch)
- **USE TASK AGENTS** for all long-running operations (>30 seconds) - Bash commands stop when context switches
- **TODOWRITE** for complex tasks (3+ steps) → parallel agents → git checkpoints → test validation
- **READ FILES FIRST** before editing - Edit/Write tools will fail if you didn't read the file first
- **DEBT PREVENTION** - Before creating new files, check for existing similar functionality to extend
- **SINGLE SOURCE OF TRUTH** - One authoritative implementation per feature/concept

### ⚡ EXECUTION PATTERNS
- **PARALLEL TASK AGENTS** - Launch multiple Task agents simultaneously for maximum efficiency
- **SYSTEMATIC WORKFLOW** - TodoWrite → Parallel agents → Git checkpoints → GitHub backup → Test validation
- **GITHUB BACKUP WORKFLOW** - After every commit: `git push origin development` to maintain GitHub backup
- **BACKGROUND PROCESSING** - ONLY Task agents can run true background operations

### 🔍 MANDATORY PRE-TASK COMPLIANCE CHECK
> **STOP: Before starting any task, Claude Code must explicitly verify ALL points:**

**Step 1: Rule Acknowledgment**
- [ ] ✅ I acknowledge all critical rules in CLAUDE.md and will follow them

**Step 2: Task Analysis**
- [ ] Will this create files in root? → If YES, use proper module structure instead (components/, server/, utils/)
- [ ] Will this take >30 seconds? → If YES, use Task agents not Bash
- [ ] Is this 3+ steps? → If YES, use TodoWrite breakdown first
- [ ] Am I about to use grep/find/cat? → If YES, use proper tools instead

**Step 3: Technical Debt Prevention (MANDATORY SEARCH FIRST)**
- [ ] **SEARCH FIRST**: Use Grep pattern="<functionality>.*<keyword>" to find existing implementations
- [ ] **CHECK EXISTING**: Read any found files to understand current functionality
- [ ] Does similar functionality already exist? → If YES, extend existing code
- [ ] Am I creating a duplicate class/manager? → If YES, consolidate instead
- [ ] Will this create multiple sources of truth? → If YES, redesign approach
- [ ] Have I searched for existing implementations? → Use Grep/Glob tools first
- [ ] Can I extend existing code instead of creating new? → Prefer extension over creation
- [ ] Am I about to copy-paste code? → Extract to shared utility instead

**Step 4: Session Management**
- [ ] Is this a long/complex task? → If YES, plan context checkpoints
- [ ] Have I been working >1 hour? → If YES, consider /compact or session break

> **⚠️ DO NOT PROCEED until all checkboxes are explicitly verified**

## 🐙 GITHUB SETUP & AUTO-BACKUP

### 📋 **GITHUB BACKUP WORKFLOW** (MANDATORY)
> **⚠️ CLAUDE CODE MUST FOLLOW THIS PATTERN:**

```bash
# After every commit, always run:
git push origin development

# This ensures:
# ✅ Remote backup of all changes
# ✅ Collaboration readiness
# ✅ Version history preservation
# ✅ Disaster recovery protection
```

### 🎯 **CLAUDE CODE GITHUB COMMANDS**
Essential GitHub operations for Claude Code:

```bash
# Check GitHub connection status
gh auth status && git remote -v

# Push changes (after every commit) - USE DEVELOPMENT BRANCH
git push origin development

# Check repository status
gh repo view

# Switch to development branch (if needed)
git checkout development
```

**⚠️ IMPORTANT**: This project uses `development` as the active branch. Always push to `development`, not `main`.

## 🏗️ PROJECT OVERVIEW

### 📋 **PROJECT INFORMATION**

**Community Workers Job Quizzes** - An interactive iPad application designed for students to discover suitable community jobs through an engaging quiz experience with photo capture and automated image processing.

**Tech Stack:**
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Express + TypeScript (Node.js)
- **Data Storage**: Airtable (student records and quiz results)
- **Image Hosting**: Cloudinary (photo uploads)
- **Image Processing**: n8n webhook automation
- **AI Integration**: Google Gemini API (quiz data generation)
- **Deployment**: Zeabur (separate frontend + backend services)

### 🎯 **DEVELOPMENT STATUS**
- **Setup**: ✅ Complete (Monorepo architecture)
- **Core Features**: ✅ Complete (quiz, camera, scoring, status polling)
- **Security**: ✅ Complete (API Keys moved to backend)
- **Deployment**: ✅ Complete (Zeabur single-service deployment)
- **Documentation**: ✅ Complete (setup guides, deployment guides)

### 🏗️ **ARCHITECTURE OVERVIEW**

#### Monorepo Single-Service Architecture

The app uses a **Monorepo single-service architecture**:

```
Development:
  Frontend (Vite Dev)              Backend (Express)
      ↓                                ↓
  Port 3000                         Port 4000
      ↓ Vite Proxy (/api/*)            ↓
  React SPA                         API routes (/api/*)

Production:
  Express Server (Port 4000)
      ├── Static Files: dist/ (Frontend)
      └── API Routes: /api/* (Backend)
```

**Key Points:**
- **Development**: Frontend (Vite) + Backend (Express) run separately
- **Production**: Express serves both static files and API
- Frontend-backend on same domain in production (no CORS issues)
- API calls use relative paths via [config/api.ts](config/api.ts)
- Vite proxy handles /api/* requests in development

#### Frontend Structure

[App.tsx](App.tsx) orchestrates state management across three main screens:

1. **StartScreen** ([components/StartScreen.tsx](components/StartScreen.tsx))
   - Embeds CameraCapture component
   - Collects student name/class
   - Validates photo capture before quiz start

2. **QuizScreen** ([components/QuizScreen.tsx](components/QuizScreen.tsx))
   - Displays questions from Google Sheets data
   - Handles option selection
   - Progress tracked via ProgressBar component

3. **ResultsScreen** ([components/ResultsScreen.tsx](components/ResultsScreen.tsx))
   - Calculates job scores using [utils/scoring.ts](utils/scoring.ts)
   - Generates AI career description via Gemini API
   - Submits questionnaire (with AI description) to backend
   - Polls processing status via [utils/api.ts](utils/api.ts)
   - Shows ProcessingStatus component for async image processing

#### Backend API Routes

Located in [server/routes/](server/routes/):

- **POST /api/upload** ([upload.ts](server/routes/upload.ts))
  - Creates Airtable record with photo URL
  - Returns recordId for tracking
  - Called by CameraCapture after Cloudinary upload

- **POST /api/submit-questionnaire** ([questionnaire.ts](server/routes/questionnaire.ts))
  - Updates Airtable with quiz answers, recommended jobs, and AI description
  - Saves Gemini-generated career guidance to `AI職業描述` field
  - Triggers n8n webhook for image processing
  - Sets status to "待處理"

- **GET /api/check-status/:recordId** ([status.ts](server/routes/status.ts))
  - Polls Airtable for processing status
  - Returns status: 問卷中 | 待處理 | 處理中 | 完成 | 失敗
  - Used by ResultsScreen for async status updates

- **POST /api/generate-description** ([gemini.ts](server/routes/gemini.ts)) 🔒
  - Generates personalized career description using Gemini API
  - **Security**: API Key only exists on backend (not exposed to frontend)
  - Returns AI-generated career guidance text
  - Used by ResultsScreen for personalized insights

#### Airtable Database Schema

**Students Table** - Stores all student records and quiz results:

| 欄位名稱 | 類型 | 說明 | 更新時機 |
|---------|------|------|---------|
| 學生姓名 | Single line text | 學生姓名 | Photo upload |
| 班級 | Single line text | 班級 | Photo upload |
| 原始照片 | Attachment | Cloudinary 照片 URL | Photo upload |
| 推薦職業 | Long text | 推薦職業清單 (e.g., "Teacher / Doctor") | Quiz submission |
| 問卷分數 | Long text | 所有職業分數 (JSON 格式) | Quiz submission |
| **AI職業描述** | Long text | Gemini API 生成的職業建議文字 | Quiz submission |
| 處理狀態 | Single select | 問卷中 \| 待處理 \| 處理中 \| 完成 \| 失敗 | Various stages |
| 結果照片 | Attachment | AI 生成的職業肖像 (備用) | n8n workflow |
| 結果URL | URL | Google Drive 照片連結 (主要) | n8n workflow |
| 錯誤訊息 | Long text | 處理失敗時的錯誤訊息 | n8n workflow |

**Key Points:**
- `AI職業描述` stores the full Gemini-generated career guidance text (200-300 words)
- All data is stored in a single Airtable table for easy management
- See [server/utils/airtable.ts](server/utils/airtable.ts) for type definitions

#### Data Flow

1. **Photo Capture** (CameraCapture → Cloudinary → Backend)
   ```
   Student takes photo → Upload to Cloudinary → POST /api/upload → Airtable record created
   ```

2. **Quiz Completion** (Frontend scoring → Backend submission)
   ```
   Answer questions → computeScores() → Generate AI description (Gemini API) →
   POST /api/submit-questionnaire { answers, recommendedJobs, scores, geminiDescription } →
   Airtable updated → n8n webhook triggered
   ```

3. **Status Polling** (Frontend → Backend → Airtable)
   ```
   pollProcessingStatus() → GET /api/check-status/:recordId → Display results
   ```

#### Type System

All shared types defined in [types.ts](types.ts):

- **GameState enum**: Controls UI state machine (Start/Quiz/Results)
- **QuizData**: Questions, Jobs, OptionJobMap from Google Sheets
- **API Types**: UploadResponse, QuestionnaireSubmission, StatusResponse
- **Status Enums**: CaptureStatus, ProcessingStatus for UI states

### 📁 **PROJECT STRUCTURE**

```
Community-Workers-Job-Quizzes/
├── CLAUDE.md                  # This file - rules and guidelines
├── README.md                  # Project overview
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── index.html                 # Entry HTML
├── index.tsx                  # React entry point
├── App.tsx                    # Main React component
├── types.ts                   # Shared TypeScript types
├── constants.ts               # App constants
├── metadata.json              # App metadata
├── .env.example               # Environment variables template
├── .env.local                 # Local environment (gitignored)
├── .env.production.example    # Production env template
├── components/                # React components
│   ├── CameraCapture.tsx      # iPad camera functionality
│   ├── StartScreen.tsx        # Initial screen with photo capture
│   ├── QuizScreen.tsx         # Quiz question display
│   ├── ResultsScreen.tsx      # Quiz results and processing
│   ├── ProcessingStatus.tsx   # Status polling display
│   ├── ProgressBar.tsx        # Quiz progress indicator
│   ├── ScorePanel.tsx         # Score display
│   └── ReportModal.tsx        # Results modal
├── config/                    # Configuration files
│   └── api.ts                 # API URL configuration (Monorepo)
├── utils/                     # Utility functions
│   ├── api.ts                 # API client functions
│   ├── scoring.ts             # Quiz scoring algorithm
│   └── googleSheetParser.ts   # Google Sheets integration
├── server/                    # Backend Express server
│   ├── index.ts               # Express app entry point
│   ├── package.json           # Server dependencies
│   ├── tsconfig.json          # Server TypeScript config
│   ├── routes/                # API route handlers
│   │   ├── upload.ts          # Photo upload endpoint
│   │   ├── questionnaire.ts   # Quiz submission endpoint
│   │   ├── status.ts          # Status check endpoint
│   │   └── gemini.ts          # 🔒 Gemini API endpoint (secure)
│   └── utils/                 # Server utilities
│       ├── airtable.ts        # Airtable client
│       └── webhook.ts         # n8n webhook trigger
├── dist/                      # Production build output (gitignored)
├── node_modules/              # Dependencies (gitignored)
└── Documentation/             # Deployment guides
    ├── README_SETUP.md        # Setup instructions
    ├── DEPLOYMENT_GUIDE.md    # General deployment
    └── ZEABUR-DEPLOYMENT-GUIDE.md  # Zeabur Monorepo deployment
```

## 🚀 COMMON COMMANDS

### Local Development

```bash
# Install dependencies
npm install

# Start both frontend (3000) and backend (4000) concurrently
npm run dev

# Start services separately
npm run dev:client    # Frontend only (port 3000)
npm run dev:server    # Backend only (port 4000)
```

### Production Build

```bash
# Build frontend (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Start production server (Monorepo: serves static + API)
# This will build frontend first, then start Express server
npm start
```

### Environment Setup

Required environment variables (see [.env.example](.env.example)):

**Frontend (.env.local):**
```bash
GEMINI_API_KEY=xxx                          # For AI features
VITE_CLOUDINARY_CLOUD_NAME=xxx              # Photo upload
VITE_CLOUDINARY_UPLOAD_PRESET=xxx           # Cloudinary preset
VITE_API_BASE_URL=https://backend.zeabur.app  # Production backend (leave empty for local dev)
```

**Backend (server/.env.example):**
```bash
AIRTABLE_API_KEY=xxx         # Airtable API token
AIRTABLE_BASE_ID=xxx         # Airtable base ID
AIRTABLE_TABLE_NAME=Students # Table name
N8N_WEBHOOK_URL=xxx          # Image processing webhook
FRONTEND_URL_MAIN=xxx        # For CORS (production)
FRONTEND_URL_DEV=xxx         # For CORS (staging)
```

## 🚀 DEPLOYMENT (ZEABUR)

### Zeabur Architecture

Three separate services:

1. **Frontend Main** (main branch)
   - Production frontend
   - Environment: `VITE_API_BASE_URL=<backend-url>`

2. **Frontend Dev** (development branch)
   - Staging frontend
   - Same environment variables as main

3. **Backend API** (development branch, server/ root directory)
   - Shared by both frontends
   - Root Directory setting: `server`
   - Start Command: `npm start`

**Important:** Frontend environment variables require redeployment to take effect (build-time injection).

### Key Implementation Details

#### API Configuration Pattern

[config/api.ts](config/api.ts) provides environment-aware API URLs:

```typescript
// Local dev: '' (uses Vite proxy to localhost:4000)
// Production: 'https://backend.zeabur.app' (from VITE_API_BASE_URL)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

#### CORS Configuration

[server/index.ts](server/index.ts) validates origins dynamically:

```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL_MAIN,   // Zeabur main frontend
  process.env.FRONTEND_URL_DEV,    // Zeabur dev frontend
  'http://localhost:3000',         // Local dev
];
```

#### Async Image Processing

ResultsScreen uses polling pattern ([utils/api.ts](utils/api.ts#L79-L147)):

```typescript
pollProcessingStatus(recordId, onUpdate, onComplete, onError, onTimeout)
// Polls every 3s, max 20 attempts (60s timeout)
// Stops when status === '完成' or '失敗'
```

#### Scoring Algorithm

[utils/scoring.ts](utils/scoring.ts) maps quiz answers to job recommendations:

```typescript
// 1. Map option_id → job_id[] (from OptionJobMap)
// 2. Count scores for each job_id
// 3. Sort by score, return top jobs
```

## 🚨 TECHNICAL DEBT PREVENTION

### ❌ WRONG APPROACH (Creates Technical Debt):
```bash
# Creating new file without searching first
Write(file_path="components/NewFeature.tsx", content="...")
```

### ✅ CORRECT APPROACH (Prevents Technical Debt):
```bash
# 1. SEARCH FIRST
Grep(pattern="feature.*implementation", glob="**/*.tsx")
# 2. READ EXISTING FILES
Read(file_path="components/ExistingFeature.tsx")
# 3. EXTEND EXISTING FUNCTIONALITY
Edit(file_path="components/ExistingFeature.tsx", old_string="...", new_string="...")
```

## 🧹 DEBT PREVENTION WORKFLOW

### Before Creating ANY New File:
1. **🔍 Search First** - Use Grep/Glob to find existing implementations
2. **📋 Analyze Existing** - Read and understand current patterns
3. **🤔 Decision Tree**: Can extend existing? → DO IT | Must create new? → Document why
4. **✅ Follow Patterns** - Use established project patterns
5. **📈 Validate** - Ensure no duplication or technical debt

### Examples of Technical Debt to AVOID:

❌ **DON'T CREATE**:
- `components/CameraCapture_v2.tsx`
- `utils/api_enhanced.ts`
- `server/routes/upload_new.ts`
- `components/StartScreen_improved.tsx`

✅ **INSTEAD EXTEND**:
- Edit `components/CameraCapture.tsx`
- Edit `utils/api.ts`
- Edit `server/routes/upload.ts`
- Edit `components/StartScreen.tsx`

## 🔧 TROUBLESHOOTING

### Common Issues & Solutions

#### 405 Method Not Allowed
- **Cause:** Frontend hitting wrong API URL
- **Fix:** Check `VITE_API_BASE_URL` in frontend env, redeploy frontend

#### CORS Errors
- **Cause:** Frontend URL not in backend allowedOrigins
- **Fix:** Update `FRONTEND_URL_*` in backend env, restart backend

#### Cloudinary Upload Fails
- **Cause:** Missing `VITE_CLOUDINARY_*` variables
- **Fix:** Set variables, redeploy frontend (build-time vars)

#### Airtable Connection Fails
- **Cause:** Invalid API key or permissions
- **Fix:** Verify API key has `data.records:write` scope

### Testing Workflow

1. Start dev servers: `npm run dev`
2. Open http://localhost:3000
3. Take photo → Check Airtable record created
4. Complete quiz → Verify POST /api/submit-questionnaire
5. Verify status polling updates
6. Check backend logs for webhook trigger

## 📋 NEED HELP? START HERE

- **Setup Guide**: [Documentation/README_SETUP.md](Documentation/README_SETUP.md)
- **Deployment Guide**: [Documentation/DEPLOYMENT_GUIDE.md](Documentation/DEPLOYMENT_GUIDE.md)
- **Zeabur Deployment**: [Documentation/ZEABUR-DEPLOYMENT-GUIDE.md](Documentation/ZEABUR-DEPLOYMENT-GUIDE.md)

## 🔒 SECURITY DOCUMENTATION

- **Security Audit (2025-10-14)**: [Documentation/Security/SECURITY_AUDIT_2025-10-14.md](Documentation/Security/SECURITY_AUDIT_2025-10-14.md)
- **Security Fix Plan**: [Documentation/Security/SECURITY_FIX_PLAN.md](Documentation/Security/SECURITY_FIX_PLAN.md)
- **Security Testing Checklist**: [Documentation/Security/SECURITY_TESTING_CHECKLIST.md](Documentation/Security/SECURITY_TESTING_CHECKLIST.md)

**Security Status**:
- **Last Audit**: 2025-10-14 (Zeabur Security Insights)
- **Risk Level**: 🟡 Medium (1 High + 2 Medium issues identified)
- **Fix Status**: 📝 Documented, awaiting implementation in v1.2.0

## 🎯 RULE COMPLIANCE CHECK

Before starting ANY task, verify:
- [ ] ✅ I acknowledge all critical rules above
- [ ] Files go in proper module structure (not root)
- [ ] Use Task agents for >30 second operations
- [ ] TodoWrite for 3+ step tasks
- [ ] Commit after each completed task
- [ ] Push to GitHub (development branch) after each commit

---

**⚠️ Prevention is better than consolidation - build clean from the start.**
**🎯 Focus on single source of truth and extending existing functionality.**
**📈 Each task should maintain clean architecture and prevent technical debt.**

---

**🎯 Template by Chang Ho Chien | HC AI 說人話channel | v1.0.0**
**📺 Tutorial**: https://youtu.be/8Q1bRZaHH24
