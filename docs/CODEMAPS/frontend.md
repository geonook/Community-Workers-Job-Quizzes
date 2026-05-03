<!-- Generated: 2026-05-03 | Files scanned: 10 | Token estimate: ~900 -->

# Frontend Codemap

React 19 + Vite 6 + TS ~5.8 + Tailwind 3.4. SPA, no router (state machine in `App.tsx`).

## Entry
```
index.html
  └─ /src/index.tsx
       └─ <App /> (src/App.tsx)
```

## State Machine — `src/App.tsx` (69 lines)
```
useState:
  gameState: GameState         // Welcome | Selection | Photo | Results
  studentName: string
  pickedJob:   JobKey | null   // survives Selection↔Photo round trip
  recordId:    string | null

callbacks:
  handleWelcomeStart(name)  → setName, gameState=Selection
  handlePickJob(jobKey)     → setPickedJob, gameState=Photo
  handlePhotoBack()         → gameState=Selection (pickedJob preserved)
  handlePhotoComplete(rid)  → setRecordId, gameState=Results
  handleRestart()           → reset all, gameState=Welcome

render switch(gameState):
  Welcome   → <StartScreen onStart=handleWelcomeStart />
  Selection → <QuizScreen onPick=handlePickJob initialJobKey=pickedJob />
  Photo     → <PhotoScreen pickedJob studentName onBack onComplete />
  Results   → <ResultsScreen recordId pickedJob studentName onRestart />
```

## Component Tree
```
<App>
 ├─ <StartScreen>           (66 lines)  — name input + Let's start CTA
 ├─ <QuizScreen>           (113 lines)  — single-card carousel of 11 jobs
 │   └─ lucide icons (per JOBS[i].icon)
 ├─ <PhotoScreen>          (146 lines)  — orchestrates camera + post-upload pipeline
 │   └─ <CameraCapture>    (290 lines)  — getUserMedia + canvas snapshot + Cloudinary upload
 └─ <ResultsScreen>         (54 lines)  — h1(picked.sentence) + ProcessingStatus + Start over
     └─ <ProcessingStatus> (125 lines)  — polls /api/check-status, renders portrait + Start over overlay
```

## Props (key surfaces)
```
StartScreen      ({ onStart: (name: string) => void })
QuizScreen       ({ onPick: (j: JobKey) => void, initialJobKey?: JobKey | null })
PhotoScreen      ({ studentName: string, pickedJob: JobKey, onBack?, onComplete: (recordId) => void })
CameraCapture    ({ studentName, studentClass, onSuccess: (recordId, photoUrl) => void, onError: (msg) => void })
ResultsScreen    ({ recordId, pickedJob, studentName, onRestart })
ProcessingStatus ({ recordId, onComplete?, onError?, onRestart? })
```

## Frontend Utilities
| File | Lines | Exports |
|------|-------|---------|
| `utils/api.ts` | 147 | `submitQuestionnaire`, `checkProcessingStatus`, `pollProcessingStatus(recordId, onUpdate, onComplete, onError, onTimeout)` (3s × 40 attempts ≈ 120s) |
| `utils/scoring.ts` | 29 | `buildPickedJobPayload(jobKey)` → `{answers,recommendedJobs,scores,topJobsForGemini,sortedScoresForGemini}` |
| `config/api.ts` | — | `API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''` |
| `src/data/jobs.ts` | 45 | `JOB_KEYS` (11), `JobKey`, `JOBS`, `getJobByKey(key)` |
| `src/types.ts` | — | `GameState`, `ProcessingStatus`, `UploadResponse`, `QuestionnaireSubmission`, `QuestionnaireResponse`, `StatusResponse`, `CloudinaryUploadResponse`, `ScoreEntry` |

## Styling
- Tailwind tokens in `tailwind.config.js`: `clay-primary` `#F97316`, `clay-bg` `#FFF7ED`, `clay-ink` `#451A03`, `clay-ink-soft` `#92400E`, plus `shadow-clay`, `rounded-clay` (24px)
- Animations: `animate-wiggle`, `animate-slide-in-{left,right}` — disabled by `@media (prefers-reduced-motion: reduce)` in `src/styles/clay.css`
- Fonts (Google Fonts in `index.html`): `Baloo 2` (heading), `Comic Neue` (body)

## Tests (Vitest 1.6 + RTL 16, jsdom)
```
src/test/setup.ts          — jest-dom + global setup
src/test/smoke.test.ts
src/data/jobs.test.ts      (6)
utils/scoring.test.ts      (4)
src/App.test.tsx           (2)
components/StartScreen.test.tsx     (4)
components/QuizScreen.test.tsx      (9)  ← incl. initialJobKey restoration
components/PhotoScreen.test.tsx     (3)
components/ResultsScreen.test.tsx   (3)
total: 32
```

## Pipeline (PhotoScreen)
```
CameraCapture.onSuccess(recordId, photoUrl)
  → setPhase('submitting')
  → fetchGeminiDescription()      // POST /api/generate-description (fallback on error)
  → submitToBackend(recordId, description)  // POST /api/submit-questionnaire
  → onComplete(recordId)          // App advances to Results
on error → setPhase('error') with retry button (preserves pendingRecord)
```
