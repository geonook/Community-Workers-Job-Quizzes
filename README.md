<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Community Workers Job Quizzes

An elementary-school career-exploration app. A student types their name and class, takes a photo, answers 10 questions pulled live from a teacher-editable Google Sheet (2×2 image option cards per question), and watches a scored job recommendation, an AI-written description, and an AI-generated portrait appear.

## 📌 Current Version

**v2.0.0-quiz-redesign** (Latest)
- ✅ Elementary quiz rebuilt on the kindergarten codebase's Claymorphism UI (branch `quiz`)
- ✅ 10-question sheet-driven quiz: 2×2 image option cards, automatic text fallback when an image fails
- ✅ Progress ("Question N of 10" + dots) and Back, live camera on Start, Next-student reset
- ✅ Scored job recommendation with tie handling, AI description, AI portrait polling
- ✅ 48 Vitest + RTL tests, full RWD at 375 / 768 / 1280, `prefers-reduced-motion` honored

[查看完整變更記錄](CHANGELOG.md)

## 🎯 Features

- 📸 **Live camera capture**: `getUserMedia` + canvas snapshot on the Start screen, gated behind a valid name + class
- 📋 **Sheet-driven quiz**: 10 questions × 4 image options from a Google Sheet the teacher edits — no code change to add or reorder a question
- 🎯 **Scored recommendation with tie handling**: `computeScores` tallies every answer and surfaces all jobs tied for the top score
- 🤖 **AI career description**: Gemini API generates a 50-70 word description, shown on the Result screen and saved to Airtable for teachers
- 🖼️ **AI portrait**: n8n workflow generates the student as their top job, polled live on the result screen
- ☁️ **Cloud storage**: Cloudinary for the original photo, Google Drive (via n8n) for the portrait
- 📊 **Single-source state**: Airtable Students table tracks 問卷中 → 待處理 → 處理中 → 完成
- 📱 **RWD**: Verified at iPhone SE (375), iPad (768), Desktop (1280); landscape OK
- ♿ **Accessibility**: H1 per route, form `<label for>`, 3px focus rings, `prefers-reduced-motion` disables slide animations

## 🏗️ Architecture

**Monorepo Single-Service (Express + React)**

```
Development:
  Frontend (Vite)         Backend (Express)
      ↓                        ↓
  Port 3000              Port 4000
      ↓ Proxy /api/*            ↓
  React SPA              API Routes

Production:
  Express Server (Port 4000)
      ├── Static Files: dist/ (Frontend)
      └── API Routes: /api/* (Backend)
```

## 🚀 Quick Start

### Prerequisites

<!-- AUTO-GENERATED: from package.json engines + dependencies -->
- Node.js **22** (pinned in `package.json` `engines.node`)
- Airtable account
- Cloudinary account
- Google Gemini API key
- n8n instance (optional, for image processing)
<!-- END AUTO-GENERATED -->

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Community-Workers-Job-Quizzes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy [`.env.example`](.env.example) to `.env.local` in the project root and fill in real values.

   <!-- AUTO-GENERATED: from .env.example -->
   | Variable | Required | Scope | Purpose |
   |---|---|---|---|
   | `GEMINI_API_KEY` | Yes (for AI description) | Backend (also leaks into bundle via `vite.config.ts` define — see security note) | Google Gemini API key |
   | `VITE_CLOUDINARY_CLOUD_NAME` | Yes | Frontend (build-time) | Cloudinary cloud name |
   | `VITE_CLOUDINARY_UPLOAD_PRESET` | Yes | Frontend (build-time) | Cloudinary unsigned upload preset |
   | `AIRTABLE_API_KEY` | Yes | Backend | Airtable API token (`data.records:write` scope) |
   | `AIRTABLE_BASE_ID` | Yes | Backend | Airtable base ID (`appXXXXXXXXXXXXXX`) |
   | `AIRTABLE_TABLE_NAME` | Yes | Backend | Table name (e.g. `Students`) |
   | `N8N_WEBHOOK_URL` | Yes (for image processing) | Backend | n8n webhook URL — fires async portrait generation |
   | `PORT` | No (default `4000`) | Backend | Express listen port |
   | `NODE_ENV` | No (auto-set by `npm start`) | Backend | `production` enables static-file serving from `dist/` |
   | `VITE_API_BASE_URL` | No | Frontend (build-time) | Override only when frontend and backend live on different origins; defaults to same-origin |
   <!-- END AUTO-GENERATED -->

4. **Run the app**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend:  http://localhost:4000

### Available scripts

<!-- AUTO-GENERATED: from package.json scripts -->
| Command | Description |
|---|---|
| `npm run dev` | Start frontend (Vite, :3000) and backend (Express via `tsx`, :4000) concurrently |
| `npm run dev:client` | Frontend only (Vite dev server, :3000) |
| `npm run dev:server` | Backend only (`tsx server/index.ts`, :4000) |
| `npm run build` | Production build of the frontend → `dist/` |
| `npm run preview` | Serve the built `dist/` via Vite preview (does not start Express) |
| `npm start` | Build frontend, then run Express in production mode (serves `dist/` + `/api/*`) |

> `npm test` runs the 48 Vitest + RTL tests. No `lint` or `typecheck` script is defined; use `npx tsc --noEmit` for an ad-hoc type check.
<!-- END AUTO-GENERATED -->

## 📦 Deployment

### Zeabur (Recommended)

This project is configured for single-service deployment on Zeabur.

1. **Connect GitHub repository**
   - Select the `quiz` branch for the elementary app, `kindergarten` for the preschool app. `quiz-version` is the frozen v1.1.0 snapshot; `development` / `main` are deprecated aliases. See the branch table in [CLAUDE.md](CLAUDE.md).

2. **Set environment variables** in Zeabur dashboard:
   - All `VITE_*` variables (frontend build-time — must be set as Docker build args, requires re-deploy after change)
   - All backend runtime variables
   - See [Documentation/ZEABUR-DEPLOYMENT-GUIDE.md](Documentation/ZEABUR-DEPLOYMENT-GUIDE.md) for details

3. **Deploy**
   - Zeabur builds the [`Dockerfile`](Dockerfile) (commands defined in [`zbpack.json`](zbpack.json)):
     - `npm install --production=false` (devDeps required for build)
     - `npm run build` (builds frontend → `dist/`)
     - `npm start` (Express serves `dist/` + `/api/*` on port 4000)

📖 **Full deployment guide**: [Documentation/ZEABUR-DEPLOYMENT-GUIDE.md](Documentation/ZEABUR-DEPLOYMENT-GUIDE.md)

## ✏️ Editing the quiz

The 10 questions live in a public Google Sheet, not in code — a teacher can edit them without a deploy.

- **Sheet**: ID in `SPREADSHEET_ID`, [config/quiz.ts](config/quiz.ts)
- **Four tabs, required columns**:
  - `Questions` — `question_id`, `text`, `order`
  - `Options` — `option_id`, `text` (or `option_text`), `question_id`, `image_url`
  - `Jobs` — `job_id`, `job_name`
  - `OptionJobMap` — `option_id`, `job_id`
- After editing, the sheet must stay published: **File → Share → Publish to web**
- `image_url` is optional — a missing or broken image falls back to a coloured text card, so a question is never blocked by a bad image link

## 📁 Project Structure

<!-- AUTO-GENERATED: from filesystem layout -->
```
Community-Workers-Job-Quizzes/
├── src/
│   ├── App.tsx              # 5-state machine (Loading → Start → Quiz → Submitting → Results)
│   ├── data/jobIcons.ts     # job_id → lucide-react icon name
│   ├── types.ts             # Shared TS types (GameState, Question/Choice/Job, ScoringResults, …)
│   └── styles/clay.css      # Claymorphism keyframes + reduced-motion overrides
├── components/              # StartScreen, QuizScreen + OptionCard, BusyScreen, CameraCapture, ProcessingStatus, ResultsScreen
├── utils/                   # api client, googleSheetParser (getQuizData), scoring (computeScores)
├── config/                  # api.ts (API_BASE_URL), quiz.ts (SPREADSHEET_ID)
├── server/                  # Express backend (run via tsx; no separate package.json)
│   ├── index.ts             # Express app — also serves dist/ in production
│   ├── routes/              # upload, questionnaire, status, gemini
│   └── utils/               # airtable, webhook, fallbackDescription
├── Dockerfile               # Single-service deploy image (Node 22-alpine)
├── zbpack.json              # Zeabur build/start commands
├── vite.config.ts           # Vite (proxy, alias, env injection)
├── tailwind.config.js       # Clay tokens (clay-primary, clay-bg, …) + wiggle/slide animations
├── docs/superpowers/        # Specs + implementation plans for the kindergarten and quiz redesigns
├── Documentation/           # Setup, deploy, security audits
└── dist/                    # Production build output (gitignored)
```
<!-- END AUTO-GENERATED -->

## 🔐 Security

- ✅ **Backend route for Gemini**: `server/routes/gemini.ts` is the intended call site for AI description.
- ⚠️ **Gemini key still ships to frontend**: `vite.config.ts` injects `process.env.GEMINI_API_KEY` into the client bundle via `define`. Anything referencing `process.env.GEMINI_API_KEY` from frontend code is exposed at runtime. Tracked in [`Documentation/Security/SECURITY_AUDIT_2025-10-14.md`](Documentation/Security/SECURITY_AUDIT_2025-10-14.md).
- ⚠️ **CORS is fully open** (`app.use(cors())` in [`server/index.ts`](server/index.ts)). This is acceptable for the single-service deploy where frontend and backend share an origin, but lock down `origin:` if you ever split services.
- ✅ **Secrets in `.env.local`** (gitignored).

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript ~5.8
- Vite 6
- TailwindCSS 3.4 (`tailwind.config.js` + `postcss.config.js` — full PostCSS pipeline, not the CDN)
- `lucide-react` icons (no emoji)
- Google Fonts: Baloo 2 (heading) + Comic Neue (body)
- Vitest 1.6 + @testing-library/react 16 + jsdom

**Backend:**
- Express 5 + TypeScript via `tsx` (Node ESM, `.js` import suffixes on `.ts` source)
- Airtable (`airtable@0.12`)
- Google Gemini API (`@google/genai`, model `gemini-2.5-flash`)

**Infrastructure:**
- Cloudinary (unsigned upload, original photo)
- n8n (webhook → AI portrait pipeline)
- Zeabur (single-service deploy via `Dockerfile`)

## 📚 Documentation

- [Documentation/ZEABUR-DEPLOYMENT-GUIDE.md](Documentation/ZEABUR-DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [Documentation/README_SETUP.md](Documentation/README_SETUP.md) - Detailed setup instructions
- [Documentation/Security/](Documentation/Security/) - Security audit, fix plan, testing checklist
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) - UI/UX design system and component guidelines
- [CHANGELOG.md](CHANGELOG.md) - Version history and change log
- [CLAUDE.md](CLAUDE.md) - Development rules and architecture overview

## 🔄 Workflow

1. **Loading** → the app fetches the quiz from the Google Sheet (`Questions`, `Options`, `Jobs`, `OptionJobMap`)
2. **Start** → student types name + class (both ≥2 chars) → live camera unlocks → snapshot → upload to Cloudinary → Airtable record created (狀態: `問卷中`) → `Start quiz!` enables
3. **Quiz** → 10 questions, one at a time, 2×2 image option cards (text fallback if an image fails); Back returns to the previous question
4. **Submitting**:
   - `computeScores(answers, jobs, optionJobMap)` tallies the picks and finds the top job(s), with ties allowed
   - Frontend calls `POST /api/generate-description` (Gemini); `server/utils/fallbackDescription.ts` builds the description if Gemini fails
   - Frontend calls `POST /api/submit-questionnaire` with `answers`, `recommendedJobs` (top job names, comma-joined), `scores` (job_name → score), `geminiDescription`
   - Backend updates Airtable (狀態: `待處理`) and fires the n8n webhook
   - On failure, a fixed English error is shown with **Try again**, which re-runs the same submission
5. **n8n** reads the record, generates the AI portrait, writes it to Google Drive, updates Airtable (狀態: `處理中` → `完成` with `結果URL`)
6. **Results** → heading names the top job(s) (joined with "or" when tied), job cards, the AI description, and `ProcessingStatus` polling `GET /api/check-status/:recordId` every 3s to render the portrait; **Next student** resets straight to Start with no Google Sheet re-fetch

> Unlike the kindergarten app, the quiz shows the AI description card to the student. The text is also saved to Airtable's `AI職業描述` field for the teacher.

## 🤝 Contributing

This project follows strict development guidelines defined in [CLAUDE.md](CLAUDE.md):

- Use the `quiz` branch for elementary-quiz work (see branch model in CLAUDE.md)
- Commit frequently with descriptive messages
- No duplicate files or technical debt
- Update documentation when making changes

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ for elementary school students**
