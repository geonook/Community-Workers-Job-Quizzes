<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Community Workers Job Quizzes

An interactive career exploration quiz app for elementary school students. Students take a photo, answer questions, and receive personalized career recommendations with AI-generated portraits.

## 📌 Current Version

**v1.0.0-scroll-fix** (Latest Stable)
- ✅ 完整修正 iPad 捲動與顯示問題
- ✅ 優化所有頁面的響應式設計
- ✅ 修正 ProcessingStatus 圖片全螢幕顯示
- ✅ 統一設計系統 (Indigo 主題色)

[查看完整變更記錄](CHANGELOG.md)

## 🎯 Features

- 📸 **Camera Integration**: iPad camera support for student photos
- 🎨 **Interactive Quiz**: Engaging circular UI with image-based questions
- 🤖 **AI-Powered**: Gemini API generates personalized career guidance
- 🖼️ **Image Processing**: n8n workflow automation with AI portrait generation
- ☁️ **Cloud Storage**: Cloudinary for photo hosting
- 📊 **Data Management**: Airtable database with real-time status tracking
- 📱 **Responsive Design**: Optimized for iPad Air (820x1180) and mobile devices
- ♿ **Accessibility**: Full scrolling support, form labels, and keyboard navigation

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
├── src/                     # Frontend entry + shared types (App, index, types, constants, styles)
├── components/              # React UI components (StartScreen, QuizScreen, ResultsScreen, …)
├── utils/                   # Frontend utilities (api client, scoring, googleSheetParser)
├── config/                  # API_BASE_URL resolution
├── server/                  # Express backend (run via tsx; no separate package.json)
│   ├── index.ts             # App entry — also serves dist/ in production
│   ├── routes/              # upload, questionnaire, status, gemini
│   └── utils/               # airtable, webhook
├── Dockerfile               # Single-service deploy image (Node 22-alpine)
├── zbpack.json              # Zeabur build/start commands
├── vite.config.ts           # Vite (proxy, alias, env injection)
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
- React 19 + TypeScript
- Vite 6
- TailwindCSS (`tailwind.config.js` + `postcss.config.js` — full PostCSS pipeline, not the CDN)

**Backend:**
- Express 5 + TypeScript
- Airtable (database)
- Google Gemini API (AI)

**Infrastructure:**
- Cloudinary (image storage)
- n8n (workflow automation)
- Zeabur (deployment)

## 📚 Documentation

- [Documentation/ZEABUR-DEPLOYMENT-GUIDE.md](Documentation/ZEABUR-DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [Documentation/README_SETUP.md](Documentation/README_SETUP.md) - Detailed setup instructions
- [Documentation/Security/](Documentation/Security/) - Security audit, fix plan, testing checklist
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) - UI/UX design system and component guidelines
- [CHANGELOG.md](CHANGELOG.md) - Version history and change log
- [CLAUDE.md](CLAUDE.md) - Development rules and architecture overview

## 🔄 Workflow

1. **Student takes photo** → Uploaded to Cloudinary
2. **Photo URL saved to Airtable** → Record created (狀態: "問卷中")
3. **Student completes quiz** → Frontend calculates scores
4. **AI description generated** → Gemini API creates personalized career guidance
5. **Results submitted to backend** → Answers, scores, and AI description saved to Airtable
6. **Backend triggers n8n webhook** → Image processing starts (狀態: "待處理")
7. **n8n workflow**:
   - Reads student data and recommended jobs from Airtable
   - Calls Gemini API for portrait generation
   - Uploads result to Google Drive / Cloudinary
   - Updates Airtable with result URL (狀態: "完成")
8. **Frontend polls status** → Shows AI-generated portrait when ready

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
