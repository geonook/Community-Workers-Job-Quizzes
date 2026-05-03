<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Community Workers Job Quizzes

A kindergarten-friendly career exploration app. A 4-year-old types their name, swipes a single-card carousel of 11 community-worker jobs, picks one, takes a photo, and watches an AI-generated portrait appear in their chosen role.

## 📌 Current Version

**v1.2.0-kindergarten-redesign** (Latest)
- ✅ Frontend rebuilt for kindergarten use — single-pick carousel, no multi-question quiz
- ✅ Claymorphism visual language (orange `clay-*` Tailwind tokens, Baloo 2 + Comic Neue, soft shadows)
- ✅ Live `getUserMedia` camera with in-page preview (was a file picker)
- ✅ 11 community-worker jobs sourced from the LV6-5 "When I Grow Up" teaching video
- ✅ 32 Vitest + RTL tests, full RWD at 375 / 768 / 1280, `prefers-reduced-motion` honored

[查看完整變更記錄](CHANGELOG.md)

## 🎯 Features

- 📸 **Live camera capture**: `getUserMedia` + canvas snapshot, with permission prompt
- 🎴 **Single-card carousel**: 11 community-worker jobs (musician, doctor, baker, …), kid swipes & picks one
- 🤖 **AI career sentence**: Gemini API generates a 50-70 word description for the teacher's Airtable view (no longer shown to the kid)
- 🖼️ **AI portrait**: n8n workflow generates the kid as their chosen worker, polled live on the result screen
- ☁️ **Cloud storage**: Cloudinary for the original photo, Google Drive (via n8n) for the portrait
- 📊 **Single-source state**: Airtable Students table tracks 問卷中 → 待處理 → 處理中 → 完成
- 📱 **RWD**: Verified at iPhone SE (375), iPad (768), Desktop (1280); landscape OK
- ♿ **Accessibility**: H1 per route, form `<label for>`, 3px focus rings, `prefers-reduced-motion` disables wiggle/slide

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

> No `test`, `lint`, or `typecheck` script is defined. Use `npx tsc --noEmit` for an ad-hoc type check.
<!-- END AUTO-GENERATED -->

## 📦 Deployment

### Zeabur (Recommended)

This project is configured for single-service deployment on Zeabur.

1. **Connect GitHub repository**
   - Select `development` branch

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

## 📁 Project Structure

<!-- AUTO-GENERATED: from filesystem layout -->
```
Community-Workers-Job-Quizzes/
├── src/
│   ├── App.tsx              # 4-state machine (Welcome → Selection → Photo → Results)
│   ├── data/jobs.ts         # 11 jobs — single source of truth for sentence/cta/icon
│   ├── types.ts             # Shared TS types
│   └── styles/clay.css      # Claymorphism keyframes + reduced-motion overrides
├── components/              # WelcomeScreen, QuizScreen (carousel), CameraCapture, PhotoScreen, ProcessingStatus, ResultsScreen
├── utils/                   # api client, scoring (single-pick adapter)
├── config/api.ts            # API_BASE_URL resolution
├── server/                  # Express backend (run via tsx; no separate package.json)
│   ├── index.ts             # Express app — also serves dist/ in production
│   ├── routes/              # upload, questionnaire, status, gemini
│   └── utils/               # airtable, webhook
├── Dockerfile               # Single-service deploy image (Node 22-alpine)
├── zbpack.json              # Zeabur build/start commands
├── vite.config.ts           # Vite (proxy, alias, env injection)
├── tailwind.config.js       # Clay tokens (clay-primary, clay-bg, …) + wiggle/slide animations
├── docs/superpowers/        # Spec + implementation plan for the v1.2.0 redesign
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

1. **Welcome** → kid types their name; "Let's start!" enables once non-empty
2. **Selection** → kid swipes the carousel of 11 jobs and taps `I want to be a {job}!`
3. **Photo** → live camera preview → snapshot → upload to Cloudinary → Airtable record created (狀態: `問卷中`)
4. **Submission**:
   - Frontend calls `POST /api/generate-description` (Gemini); fallback echoes the carousel sentence if Gemini fails
   - Frontend calls `POST /api/submit-questionnaire` with `answers: [pickedJobKey]`, `recommendedJobs: <displayName>`, `scores: { [pickedJobKey]: 1 }`, `geminiDescription`
   - Backend updates Airtable (狀態: `待處理`) and fires the n8n webhook
5. **n8n** reads the record, generates the AI portrait, writes it to Google Drive, updates Airtable (狀態: `處理中` → `完成` with `結果URL`)
6. **Result screen** polls `GET /api/check-status/:recordId` every 3s and renders the portrait when ready; `Start over` resets to Welcome

> Kids no longer see the AI description card. The Gemini text still lives in Airtable's `AI職業描述` field for the teacher.

## 🤝 Contributing

This project follows strict development guidelines defined in [CLAUDE.md](CLAUDE.md):

- Use `development` branch for all work
- Commit frequently with descriptive messages
- No duplicate files or technical debt
- Update documentation when making changes

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ for elementary school students**
