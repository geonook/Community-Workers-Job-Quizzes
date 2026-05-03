<!-- Generated: 2026-05-03 | Files scanned: 17 | Token estimate: ~700 -->

# Architecture

## System Type
Fullstack monorepo. **One Node service** (Express via `tsx`) serves the React SPA + `/api/*` from the same origin. Single root `package.json`, no separate `server/` package.

## High-Level Diagram
```
Kindergarten iPad
      │
      ▼
[ React SPA — App.tsx 4-state machine ]
   Welcome → Selection → Photo → Results
      │
      ▼ (browser)
   Cloudinary unsigned upload   ← original photo
      │
      ▼ (Vite proxy in dev / same origin in prod)
[ Express server (port 4000) ]
   /api/upload                → Airtable.createRecord
   /api/generate-description  → Gemini (gemini-2.5-flash) → song-lyric fallback
   /api/submit-questionnaire  → Airtable.updateRecord → n8n webhook
   /api/check-status/:id      → Airtable.getRecordStatus
      │
      ▼
[ Airtable Students table ]   ←──── n8n workflow writes 結果URL
      │
      ▼
[ n8n ]  →  Gemini portrait gen  →  Google Drive
```

## Boundaries
| Layer | Folder | Entry | Lines |
|-------|--------|-------|-------|
| SPA UI | `components/` + `src/` | `src/index.tsx` → `src/App.tsx` | 794 |
| Frontend utilities | `utils/`, `config/` | `utils/api.ts` | 175 |
| Express API | `server/routes/` | `server/index.ts` | 286 |
| Backend integrations | `server/utils/` | `airtable.ts`, `webhook.ts` | 168 |

## Build & Deploy
- Dev: `npm run dev` → Vite (3000) + Express (4000) via `concurrently`. Vite proxies `/api/*` → :4000.
- Prod: `npm start` → `vite build` → `dist/`, then Express serves `dist/` as static + `/api/*` as routes.
- Container: `Dockerfile` (Node 22-alpine) + `zbpack.json`. Single Zeabur service. `VITE_*` are **build-time** ARGs; backend vars are runtime ENV.

## State Machine
```
Welcome ──onStart──▶ Selection ──onPick──▶ Photo ──onComplete──▶ Results
                       ▲   │
                       └──onBack (carousel position restored via initialJobKey)
                                                                     │
                                                              onRestart
                                                                     ▼
                                                                 Welcome
```

`pickedJob` survives Selection→Photo→Selection round trip. Reset on Start over.
