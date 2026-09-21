# CLAUDE.md - Community Workers Job Quizzes

> **Documentation Version**: 1.2
> **Last Updated**: 2026-05-03
> **Project**: Community Workers Job Quizzes
> **Description**: Elementary-school career quiz — student enters name + class, takes a photo, answers 10 sheet-driven questions, gets a scored job recommendation, AI description, and AI portrait
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
- **GITHUB BACKUP** - Push to GitHub after every commit to maintain backup: `git push origin quiz` (see Branch model below)
- **USE TASK AGENTS** for all long-running operations (>30 seconds) - Bash commands stop when context switches
- **TODOWRITE** for complex tasks (3+ steps) → parallel agents → git checkpoints → test validation
- **READ FILES FIRST** before editing - Edit/Write tools will fail if you didn't read the file first
- **DEBT PREVENTION** - Before creating new files, check for existing similar functionality to extend
- **SINGLE SOURCE OF TRUTH** - One authoritative implementation per feature/concept

### ⚡ EXECUTION PATTERNS
- **PARALLEL TASK AGENTS** - Launch multiple Task agents simultaneously for maximum efficiency
- **SYSTEMATIC WORKFLOW** - TodoWrite → Parallel agents → Git checkpoints → GitHub backup → Test validation
- **GITHUB BACKUP WORKFLOW** - After every commit: `git push origin quiz` to maintain GitHub backup
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
git push origin quiz

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

# Push changes (after every commit) - USE QUIZ BRANCH
git push origin quiz

# Check repository status
gh repo view

# Switch to the active branch (if needed)
git checkout quiz
```

**⚠️ IMPORTANT — Branch model (since 2026-09-21):** the product versions live on separate branches.

| Branch | What it is | Status |
|---|---|---|
| `kindergarten` | v1.2.0 kindergarten single-pick app | Active — kindergarten line |
| `quiz` | v2.0.0 elementary quiz app (this branch) | **Active** — all quiz work goes here |
| `quiz-version` | v1.1.0 multi-question quiz app (frozen pre-redesign snapshot) | Frozen, tagged `v1.1.0-ai-description` |
| `development` | Legacy alias | Deprecated |
| `main` | Legacy alias | Deprecated — do not push here |

Always push to `quiz` from this branch. Never push to `main`.

## 🏗️ PROJECT OVERVIEW

### 📋 **PROJECT INFORMATION**

**Community Workers Job Quizzes** - An elementary-school career-exploration app: a student types their name and class, takes a photo, answers 10 questions pulled live from a teacher-editable Google Sheet (2×2 image option cards per question), and gets a scored job recommendation, an AI-written description, and an AI-generated portrait once n8n finishes generating it.

**Tech Stack:**
- **Frontend**: React 19 + TypeScript + Vite 6 + TailwindCSS
- **Backend**: Express 5 + TypeScript via `tsx` (Node 22)
- **Data Storage**: Airtable (single `Students` table)
- **Image Hosting**: Cloudinary (direct upload from browser)
- **Image Processing**: n8n webhook (async portrait generation)
- **AI Integration**: Google Gemini API (career-description generation)
- **Deployment**: Zeabur, **single service** built from `Dockerfile` (Express serves `dist/` + `/api/*`)

### 🎯 **DEVELOPMENT STATUS**
- **Setup**: Monorepo, single root `package.json`
- **Core Features**: Complete — name+class gated camera capture, 10-question sheet-driven quiz with image/text option cards, scored job recommendation (multi-job ties supported), Gemini description, async portrait polling
- **Tests**: 48 Vitest + RTL tests across 11 files (`npm test`)
- **Security**: ⚠️ Partial — `GEMINI_API_KEY` is referenced from backend but **also injected into the frontend bundle** via `vite.config.ts` `define`. See `Documentation/Security/SECURITY_AUDIT_2025-10-14.md`.
- **Deployment**: Zeabur single-service via Dockerfile
- **Documentation**: Setup, deployment, security audit docs in `Documentation/`

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

[src/App.tsx](src/App.tsx) orchestrates a **5-state machine** (`Loading` → `Start` → `Quiz` → `Submitting` → `Results`, `GameState` enum in [src/types.ts](src/types.ts)).

1. **StartScreen** ([components/StartScreen.tsx](components/StartScreen.tsx))
   - Name + class inputs (both must trim to ≥2 chars) gate the embedded [CameraCapture](components/CameraCapture.tsx)
   - `Start quiz!` stays disabled until both inputs are valid **and** the photo has uploaded; if the inputs go invalid again after a successful upload, the camera unmounts and the uploaded photo is forgotten (student has to retake it)

2. **QuizScreen** ([components/QuizScreen.tsx](components/QuizScreen.tsx)) + **OptionCard** ([components/OptionCard.tsx](components/OptionCard.tsx))
   - One question at a time in a 2×2 image-card grid (single column for non-4-option questions), "Question N of 10" header + progress dots, Back button (hidden on question 1)
   - `OptionCard` renders the sheet's `image_url`; on `<img onError>` it swaps to a full-bleed coloured text card so a broken/missing image never blocks the quiz

3. **BusyScreen** ([components/BusyScreen.tsx](components/BusyScreen.tsx))
   - Shared loading/submitting screen: a spinner by default, or an `AlertCircle` error card with **Try again** when `error` is set
   - Used for both `Loading` (fetching the sheet) and `Submitting` (scoring + description + Airtable write); on submission failure it shows a fixed English sentence while the real error is only `console.error`-logged, and **Try again** re-runs the same submission with the same answers

4. **ResultsScreen** ([components/ResultsScreen.tsx](components/ResultsScreen.tsx))
   - Heading `"{name}, you'd be a great {job}!"` — tied top jobs are joined with `" or "`
   - One card per top job with a Lucide icon looked up via [src/data/jobIcons.ts](src/data/jobIcons.ts) (falls back to `Briefcase` for an unmapped `job_id`)
   - AI description card, then [ProcessingStatus](components/ProcessingStatus.tsx) — unchanged: polls `GET /api/check-status/:recordId` every 3s and renders the AI portrait when ready
   - **Next student** resets state straight to `Start` — no re-fetch of the Google Sheet

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
  - Generates personalized career description (~50-70 words) using Gemini (`gemini-2.5-flash`)
  - **Security caveat**: backend route is the intended call site, but `vite.config.ts` still injects `process.env.GEMINI_API_KEY` into the client bundle — see Documentation/Security audit
  - Fallback: when Gemini errors or the key is missing, [server/utils/fallbackDescription.ts](server/utils/fallbackDescription.ts) builds a one-line description from the top scored job name (or a generic "many jobs" line when there's no top job)
  - Called by `App.tsx`'s `runSubmission` during the `Submitting` state, right after `computeScores` and before `/api/submit-questionnaire`

#### Airtable Database Schema

**Students Table** - Stores all student records and quiz results:

| 欄位名稱 | 類型 | 說明 | 更新時機 |
|---------|------|------|---------|
| 學生姓名 | Single line text | 學生姓名 | Photo upload |
| 班級 | Single line text | 班級 | Photo upload |
| 原始照片 | Attachment | Cloudinary 照片 URL | Photo upload |
| 推薦職業 | Long text | Top job name(s), comma-separated when tied (e.g., "Doctor, Teacher") | Quiz submission |
| 問卷分數 | Long text | JSON of `job_name → score` across all 10 answers (`ScoringResults.counts`) | Quiz submission |
| **AI職業描述** | Long text | Gemini API 生成的職業建議文字 | Quiz submission |
| 處理狀態 | Single select | 問卷中 \| 待處理 \| 處理中 \| 完成 \| 失敗 | Various stages |
| 結果照片 | Attachment | AI 生成的職業肖像 (備用) | n8n workflow |
| 結果URL | URL | Google Drive 照片連結 (主要) | n8n workflow |
| 錯誤訊息 | Long text | 處理失敗時的錯誤訊息 | n8n workflow |

**Key Points:**
- `AI職業描述` stores the Gemini-generated career guidance (~50-70 words; prompt and word target live in [server/routes/gemini.ts](server/routes/gemini.ts))
- All data is stored in a single Airtable table for easy management
- See [server/utils/airtable.ts](server/utils/airtable.ts) for type definitions

#### Google Sheet (quiz content)

The 10 questions, their image options, and the job scoring map live in a single public Google Sheet — not in code. Sheet ID: `SPREADSHEET_ID` in [config/quiz.ts](config/quiz.ts). Fetched via the `gviz` JSON endpoint by [utils/googleSheetParser.ts](utils/googleSheetParser.ts) (`getQuizData()`); column names are matched case-insensitively.

| Sheet | Columns |
|---|---|
| `Questions` | `question_id`, `text`, `order` |
| `Options` | `option_id`, `text` (or `option_text`), `question_id`, `image_url` (optional — a missing or broken URL falls back to a text card) |
| `Jobs` | `job_id`, `job_name` |
| `OptionJobMap` | `option_id`, `job_id` |

**The spreadsheet must be published to the web** (Google Sheets → **File → Share → Publish to web**), otherwise every load fails with a readable "access_denied" error on the Loading screen.

#### Data Flow

1. **Start** (StartScreen → backend)
   ```
   Name + class both trim to ≥2 chars → CameraCapture unlocks →
   getUserMedia preview → canvas snapshot → Cloudinary upload →
   POST /api/upload { photoUrl, studentName, studentClass } → recordId
   → Start quiz! enables
   ```

2. **Quiz** (QuizScreen, client-only)
   ```
   Tap an OptionCard → optionId appended to answers[] → next question renders (Back removes the last answer)
   answers.length reaches quizData.questions.length (10) → triggers Submitting
   ```

3. **Submitting** (App.tsx `runSubmission`)
   ```
   computeScores(answers, quizData.jobs, quizData.optionJobMap) → { counts, topJobs, sortedScores }
   POST /api/generate-description { studentName, topJobs, sortedScores }              → geminiDescription (or fallback)
   POST /api/submit-questionnaire {
     recordId, studentName, studentClass, answers,
     recommendedJobs: topJobs.map(j => j.job_name).join(', '),   // e.g. "Doctor, Teacher" when tied
     scores: counts,                                             // job_name → score
     geminiDescription,
   }                                                                                    → Airtable + n8n webhook
   → advances to Results (submission failure shows a fixed English error with Try again)
   ```

4. **Portrait polling** (ResultsScreen)
   ```
   ProcessingStatus → pollProcessingStatus(recordId) → GET /api/check-status/:recordId every 3s →
   render portrait when status === "完成", show error when "失敗", timeout after 40 attempts (~120s)
   Next student → resets straight to Start, no re-fetch of the Google Sheet
   ```

#### Type System

All shared types defined in [src/types.ts](src/types.ts):

- **GameState enum**: `Loading | Start | Quiz | Submitting | Results`
- **Quiz content** (from the Google Sheet): `Question` (`id`, `text`, `choices: Choice[]`), `Choice` (`id`, `text`, `imageUrl?`), `Job` (`id`, `name`), `OptionJobMapItem` (`option_id`, `job_id`), `QuizData` (`questions`, `jobs`, `optionJobMap`)
- **Scoring**: `ScoringResults` (`counts: Record<job_name, score>`, `topJobs: TopJob[]`, `sortedScores: ScoreEntry[]`)
- **API Types**: `UploadResponse`, `QuestionnaireSubmission`, `QuestionnaireResponse`, `StatusResponse`, `CloudinaryUploadResponse`
- **Status Enums**: `ProcessingStatus` for the polling states

> No more `JobKey` — that type and `src/data/jobs.ts` were deleted when the quiz was rebuilt (v2.0.0).

### 📁 **PROJECT STRUCTURE**

```
Community-Workers-Job-Quizzes/
├── CLAUDE.md                  # This file - rules and guidelines
├── README.md                  # Project overview
├── CHANGELOG.md               # Version history
├── DESIGN_SYSTEM.md           # UI/UX design tokens and component rules
├── package.json               # Single root package — server has NO own package.json
├── vite.config.ts             # Vite (proxy /api → :4000, alias @/* → repo root)
├── tsconfig.json              # Shared by client + server, "@/*" path alias
├── tailwind.config.js         # Tailwind config
├── postcss.config.js          # PostCSS config
├── Dockerfile                 # Single-service deploy (Node 22-alpine, builds + serves)
├── zbpack.json                # Zeabur build/start commands
├── index.html                 # Entry HTML (loads /src/index.tsx)
├── metadata.json              # App metadata
├── .env.example               # Environment variables template
├── .env.local                 # Local env (gitignored, holds BOTH frontend + backend vars)
├── .env.production.example    # Production env template
├── src/                       # Frontend source — App/index/types live HERE, not root
│   ├── App.tsx                # 5-state machine (Loading / Start / Quiz / Submitting / Results)
│   ├── App.test.tsx           # State-machine integration test
│   ├── index.tsx              # React entry point
│   ├── index.css              # Tailwind directives + globals
│   ├── types.ts               # GameState, quiz/scoring types, API submission/response types
│   ├── data/
│   │   ├── jobIcons.ts        # job_id → lucide-react icon name, DEFAULT_JOB_ICON fallback
│   │   └── jobIcons.test.ts
│   ├── styles/
│   │   └── clay.css           # Claymorphism keyframes + prefers-reduced-motion overrides
│   └── test/
│       ├── setup.ts           # Vitest + RTL global setup
│       └── smoke.test.ts
├── components/                # React components (imported by src/App.tsx)
│   ├── StartScreen.tsx        # Start — name + class + embedded live camera
│   ├── QuizScreen.tsx         # Quiz — one question at a time, 2×2 image option grid
│   ├── OptionCard.tsx         # One quiz option: image card with automatic text fallback
│   ├── BusyScreen.tsx         # Loading / Submitting spinner + error/Try-again card
│   ├── CameraCapture.tsx      # Live getUserMedia + canvas snapshot + Cloudinary upload
│   ├── ProcessingStatus.tsx   # Polls /api/check-status, renders portrait + Start-over overlay
│   ├── ResultsScreen.tsx      # Heading + job cards + description + ProcessingStatus + Next student
│   └── *.test.tsx             # One Vitest file per component
├── config/
│   ├── api.ts                 # API_BASE_URL resolution (env-aware)
│   └── quiz.ts                # SPREADSHEET_ID for the Google Sheet
├── utils/                     # Frontend utilities
│   ├── api.ts                 # API client + pollProcessingStatus()
│   ├── googleSheetParser.ts   # getQuizData() — fetches + assembles the 4 sheets
│   ├── googleSheetParser.test.ts
│   ├── scoring.ts             # computeScores(selectedOptionIds, jobs, optionJobMap)
│   └── scoring.test.ts
├── server/                    # Backend Express server (run via tsx, no own package.json)
│   ├── index.ts               # Express app + production static-file serving
│   ├── routes/
│   │   ├── upload.ts          # POST /api/upload
│   │   ├── questionnaire.ts   # POST /api/submit-questionnaire
│   │   ├── status.ts          # GET  /api/check-status/:recordId
│   │   └── gemini.ts          # POST /api/generate-description (gemini-2.5-flash + fallbackDescription)
│   └── utils/
│       ├── airtable.ts
│       ├── webhook.ts
│       ├── fallbackDescription.ts     # Builds the no-Gemini description from the top job name
│       └── fallbackDescription.test.ts
├── dist/                      # Production build output (gitignored)
└── Documentation/
    ├── README_SETUP.md
    ├── ZEABUR-DEPLOYMENT-GUIDE.md
    └── Security/              # Audit reports, fix plan, testing checklist
```

**Module-resolution gotchas:**
- Server runs as native ESM via `tsx`. Imports inside `server/` use `.js` extensions even though sources are `.ts` (e.g. `import uploadRouter from './routes/upload.js'`) — required by Node ESM resolution. Drop the `.js` and the server crashes at startup.
- Frontend can use `@/*` to import from project root (e.g. `@/components/StartScreen`). Configured in both `vite.config.ts` and `tsconfig.json`.
- There is **no separate `server/tsconfig.json` or `server/package.json`** — the root `tsconfig.json` and root `package.json` cover both client and server.

## 🚀 COMMON COMMANDS

> **Runtime requirement:** Node **22** (pinned in `package.json` `engines`).
>
> **Tests**: `npm test` runs Vitest 1.6 + @testing-library/react 16 (config in `vitest.config.ts`, setup in `src/test/setup.ts`). 48 tests across 11 files cover the Google Sheet parser, `computeScores`, the fallback-description builder, the job-icon lookup, every screen (Start / Quiz / OptionCard / BusyScreen / Results), and the App state machine.
>
> **No lint or standalone typecheck scripts** are defined. Use `npx tsc --noEmit` for an ad-hoc frontend type check. At HEAD it reports 5 known pre-existing errors, all parked / not this task's scope: one in `vitest.config.ts` (Vite/Vitest version-mismatch) plus four on the kindergarten base — two `import.meta.env` errors in `components/CameraCapture.tsx` and two Airtable field-typing errors in `server/utils/airtable.ts`.

### Local Development

```bash
# Install dependencies
npm install

# Start both frontend (3000) and backend (4000) concurrently
npm run dev

# Start services separately
npm run dev:client    # Frontend only (port 3000, Vite)
npm run dev:server    # Backend only (port 4000, tsx server/index.ts)
```

### Production Build

```bash
# Build frontend (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Start production server (Monorepo: builds frontend then runs Express)
# Equivalent to: npm run build && NODE_ENV=production tsx server/index.ts
npm start
```

### Tests, type-check, one-off scripts

```bash
# Run all 48 Vitest tests (jsdom env)
npm test

# Vitest watch mode
npm run test:watch

# Frontend type-check
npx tsc --noEmit

# Run a single file with the same loader the server uses
npx tsx <path-to-script.ts>
```

### Environment Setup

Required environment variables (see [.env.example](.env.example)):

**Frontend (.env.local):**
```bash
GEMINI_API_KEY=xxx                          # Backend route consumes it; ⚠️ vite.config.ts also leaks it into the client bundle
VITE_CLOUDINARY_CLOUD_NAME=xxx              # Photo upload
VITE_CLOUDINARY_UPLOAD_PRESET=xxx           # Cloudinary preset
VITE_API_BASE_URL=                          # Leave empty for the single-service deploy (same origin). Only set if frontend and backend live on different origins.
```

**Backend (same `.env.local`):**
```bash
AIRTABLE_API_KEY=xxx         # Airtable API token
AIRTABLE_BASE_ID=xxx         # Airtable base ID
AIRTABLE_TABLE_NAME=Students # Table name
N8N_WEBHOOK_URL=xxx          # Image processing webhook
PORT=4000                    # Optional, defaults to 4000
```

> ⚠️ **`GEMINI_API_KEY` security note:** The key is consumed by the backend route `server/routes/gemini.ts`, **but** `vite.config.ts` also injects it into the frontend bundle via `define: { 'process.env.GEMINI_API_KEY': ... }`. Anything referencing `process.env.GEMINI_API_KEY` from frontend code therefore ships to the browser. The "API key only on backend" claim in earlier docs is aspirational — verify before assuming. See `Documentation/Security/SECURITY_AUDIT_2025-10-14.md` (this is one of the open High-risk findings).

## 🚀 DEPLOYMENT (ZEABUR)

### Zeabur Architecture (single service via Dockerfile)

Deployment is **one Zeabur service** built from the project root using [Dockerfile](Dockerfile) + [zbpack.json](zbpack.json):

1. `npm install --production=false` (build needs devDeps)
2. `VITE_*` build args are injected as ENV so Vite picks them up
3. `npm run build` produces `dist/`
4. `npm start` launches Express on port 4000, which serves `dist/` as static + `/api/*` as routes

**Branch model:** Active work on the elementary quiz happens on `quiz` (see the branch table in the GitHub section above). `kindergarten` holds the v1.2.0 preschool app; `development` / `main` are deprecated aliases; `quiz-version` is the frozen v1.1.0 snapshot. When setting up the Zeabur service for this app, select the `quiz` branch.

**Build-time vs runtime env vars:**
- `VITE_*` are **build-time** — must be set as Zeabur build args before the Docker build, and a re-deploy is required after changing them.
- Backend vars (`AIRTABLE_*`, `N8N_WEBHOOK_URL`, `GEMINI_API_KEY`) are **runtime** — change without rebuilding.

### Key Implementation Details

#### API Configuration Pattern

[config/api.ts](config/api.ts) provides environment-aware API URLs:

```typescript
// Local dev: '' (uses Vite proxy to localhost:4000)
// Production: same origin as frontend (Express serves both — empty string works)
// Override only if you split services: VITE_API_BASE_URL=https://backend.example
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

#### CORS Configuration

[server/index.ts](server/index.ts) currently uses `app.use(cors())` — **fully open, no origin allowlist**. This is intentional for the single-service Monorepo deploy (frontend and backend share an origin, so CORS is moot in production), but it means any origin can call the backend if the URL is leaked. If splitting into multiple services, lock this down with an `origin:` callback before deploying.

#### Async Image Processing

`ProcessingStatus` (mounted by `ResultsScreen`) uses the polling pattern in [utils/api.ts](utils/api.ts):

```typescript
pollProcessingStatus(recordId, onUpdate, onComplete, onError, onTimeout)
// Polls every 3s, max 40 attempts (~120s timeout)
// Stops when status === '完成' or '失敗'
```

#### Scoring (`computeScores`)

[utils/scoring.ts](utils/scoring.ts) tallies one point per (chosen option → job) mapping from the sheet and returns the top job(s), with ties supported:

```typescript
// computeScores(selectedOptionIds: string[], jobs: Job[], optionJobMap: OptionJobMapItem[]): ScoringResults
// {
//   counts: Record<string, number>,   // job_name → score, for QuestionnaireSubmission.scores
//   topJobs: TopJob[],                // every job tied for the highest score
//   sortedScores: ScoreEntry[],       // every scored job, highest first
// }
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
- **Cause:** Only relevant if you split into separate frontend/backend services. The default deploy uses `app.use(cors())` (fully open) because frontend and backend share an origin.
- **Fix (when splitting services):** Lock down [server/index.ts](server/index.ts) with an explicit `cors({ origin: [...] })` allowlist before deploying.

#### Cloudinary Upload Fails
- **Cause:** Missing `VITE_CLOUDINARY_*` variables
- **Fix:** Set variables, redeploy frontend (build-time vars)

#### Airtable Connection Fails
- **Cause:** Invalid API key or permissions
- **Fix:** Verify API key has `data.records:write` scope

### Testing Workflow

1. `npm test` — 48 unit/component tests (fast, headless)
2. `npm run dev` — start frontend + backend (Vite picks the next free port if 3000 is busy)
3. Open the URL Vite prints (typically `http://localhost:3000`)
4. Type a name + class → grant camera permission → snap a photo → **Start quiz!** enables → answer all 10 questions
5. Watch the Network tab: `/api/upload` (200, returns `recordId`) → `/api/generate-description` → `/api/submit-questionnaire` (n8n webhook fires)
6. On the Result screen, watch `/api/check-status/:recordId` poll every 3s until `處理狀態` → `完成` and `結果URL` populates

## 📋 NEED HELP? START HERE

- **Setup Guide**: [Documentation/README_SETUP.md](Documentation/README_SETUP.md)
- **Zeabur Deployment**: [Documentation/ZEABUR-DEPLOYMENT-GUIDE.md](Documentation/ZEABUR-DEPLOYMENT-GUIDE.md)
- **Design System**: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- **v1.2.0 Spec & Plan**: [docs/superpowers/](docs/superpowers/)

## 🔒 SECURITY DOCUMENTATION

- **Security Audit (2025-10-14)**: [Documentation/Security/SECURITY_AUDIT_2025-10-14.md](Documentation/Security/SECURITY_AUDIT_2025-10-14.md)
- **Security Fix Plan**: [Documentation/Security/SECURITY_FIX_PLAN.md](Documentation/Security/SECURITY_FIX_PLAN.md)
- **Security Testing Checklist**: [Documentation/Security/SECURITY_TESTING_CHECKLIST.md](Documentation/Security/SECURITY_TESTING_CHECKLIST.md)

**Security Status**:
- **Last Audit**: 2025-10-14 (Zeabur Security Insights)
- **Risk Level**: 🟡 Medium (1 High + 2 Medium issues identified)
- **Fix Status**: 📝 Documented, scheduled for a future security release. v1.2.0 was the kindergarten redesign and did **not** address these findings; tracked in `CHANGELOG.md` under `[Unreleased] - v1.2.0-security (Planned)`.

## 🎯 RULE COMPLIANCE CHECK

Before starting ANY task, verify:
- [ ] ✅ I acknowledge all critical rules above
- [ ] Files go in proper module structure (not root)
- [ ] Use Task agents for >30 second operations
- [ ] TodoWrite for 3+ step tasks
- [ ] Commit after each completed task
- [ ] Push to GitHub (quiz branch) after each commit

---

**⚠️ Prevention is better than consolidation - build clean from the start.**
**🎯 Focus on single source of truth and extending existing functionality.**
**📈 Each task should maintain clean architecture and prevent technical debt.**

---

**🎯 Template by Chang Ho Chien | HC AI 說人話channel | v1.0.0**
**📺 Tutorial**: https://youtu.be/8Q1bRZaHH24
