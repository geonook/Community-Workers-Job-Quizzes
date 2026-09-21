# Quiz Redesign (Elementary) — Design Spec

**Date:** 2026-09-21
**Project:** Community-Workers-Job-Quizzes
**Branch:** `quiz` (created from `kindergarten` @ `e63ee4c`)
**Scope:** Rebuild the elementary-school multi-question quiz on top of the kindergarten codebase. Backend API contracts, Airtable schema, n8n workflow, and the Google Sheet question format are unchanged. One backend file (`server/routes/gemini.ts`) changes its fallback text source.

---

## 1. Background & Goal

The repo now carries two product lines:

| Branch | Audience | Model |
|---|---|---|
| `kindergarten` | 4-year-olds | Direct pick: swipe 11 job cards, tap one |
| `quiz-version` | Elementary students | 10-question quiz → scored recommendation (frozen at v1.1.0, tag `v1.1.0-ai-description`) |

`quiz-version` is functionally fine but visually dated (indigo theme, circular option layout, emoji icons), has no tests, uses the retired `gemini-2.0-flash-exp` model, and carries dead code. Rather than patch it, we rebuild the quiz flow on the `kindergarten` codebase, which already has the Claymorphism design tokens, Vitest infrastructure, live camera, and the Gemini fix.

**Goal:** Same quiz (same sheet, same scoring, same backend), new body.

**Hard constraints:**
- Google Sheet ID, sheet names (`Questions`, `Options`, `Jobs`, `OptionJobMap`) and column headers stay exactly as they are. Teachers keep editing the sheet the same way.
- `/api/upload`, `/api/generate-description`, `/api/submit-questionnaire`, `/api/check-status/:recordId` request and response bodies unchanged.
- Airtable `Students` table fields unchanged.
- Visual language = the kindergarten Claymorphism system (`clay-*` Tailwind tokens, Baloo 2 + Comic Neue, Lucide icons, `src/styles/clay.css`). No emoji as icons.
- All UI text in English.
- RWD at 375 / 768 / 1280, portrait and landscape.

**Explicitly out of scope** (decided 2026-09-21):
- Fixing the `GEMINI_API_KEY` leak into the frontend bundle (security audit High item). Still tracked under `v1.2.0-security`.
- Moving sheet fetching behind the Express backend.
- Merging the two product lines into one app.
- Score panel / ranking display, report modal, debug panel.

---

## 2. Live data shape (verified 2026-09-21)

Fetched from the public gviz endpoint of the existing sheet:

| Sheet | Columns | Rows |
|---|---|---|
| `Questions` | `question_id`, `text`, `order` | 10 |
| `Options` | `option_id`, `text`, `question_id`, `image_url` | 40 (4 per question, all have `image_url`) |
| `Jobs` | `job_id`, `job_name` | 13 |
| `OptionJobMap` | `option_id`, `job_id` | 125 |

Option images are hot-linked from third-party sites (Google image thumbnails, news sites, vendor blogs). They can break at any time. The UI must degrade gracefully (see §4.2).

Layout assumption: **exactly 4 options per question**. The parser must not enforce this (the sheet may change), but the 2×2 grid is designed for 4 and will wrap to a single column at 5+ or 3 or fewer.

---

## 3. Flow & state machine

`src/types.ts` `GameState` becomes:

```ts
export enum GameState {
    Loading = 'loading',      // fetching sheet data on mount
    Start = 'start',          // name + class + photo
    Quiz = 'quiz',            // 10 questions
    Submitting = 'submitting',// score → Gemini → submit-questionnaire
    Results = 'results',      // recommendation + description + portrait
}
```

`src/App.tsx` state:

```ts
gameState: GameState
quizData: QuizData | null        // from googleSheetParser
loadError: string | null
studentName: string
studentClass: string
recordId: string | null          // from /api/upload
photoUrl: string | null
answers: string[]                // option_ids, index = question index
submitError: string | null
```

### 3.1 Loading

On mount, `fetchQuizData()` runs. Screen shows a clay spinner with "Getting your quiz ready…". On failure: error message + "Try again" button that re-fetches. No timeout beyond fetch's own.

### 3.2 Start

`components/StartScreen.tsx` is rewritten (the kindergarten version only has a name field).

- Two inputs: **Name** and **Class**. Both required; `/api/upload` rejects `studentName` or `studentClass` shorter than 2 characters (after trim), so the client validates both `>= 2` before enabling the camera.
- Below the inputs: `components/CameraCapture.tsx` (reused as-is). It is rendered only once both inputs are valid, because it needs `studentName` and `studentClass` to call `/api/upload` after the Cloudinary upload.
- `CameraCapture.onSuccess(recordId, photoUrl)` stores both in App state and enables the **Start quiz!** CTA.
- `CameraCapture.onError` shows the error inline; the kid can retake.
- Tapping **Start quiz!** → `GameState.Quiz`, `answers = []`.

Editing name/class after a photo has been uploaded is allowed but does not re-upload; the Airtable record keeps the values sent at upload time. This matches v1.1.0 behaviour and is acceptable.

### 3.3 Quiz

`components/QuizScreen.tsx` is rewritten. Props:

```ts
interface QuizScreenProps {
    question: Question;
    questionIndex: number;   // 0-based
    totalQuestions: number;
    onSelectChoice: (optionId: string) => void;
    onBack: () => void;      // ignored/hidden when questionIndex === 0
}
```

- Header: "Question 3 of 10" + 10 indicator dots (current = filled `clay-primary`, answered = filled `clay-ink`, upcoming = outline).
- Question text as `<h1>`.
- 4 option cards in a 2×2 grid (see §4).
- **Back** button bottom-left (Lucide `ChevronLeft`), hidden on the first question. App handler: `answers.pop()`, `questionIndex - 1`.
- Selecting an option: App handler pushes the option_id and advances; the incoming grid slides in (`animate-slide-in-right`, reduced-motion safe). After the last question App moves to `Submitting`.

### 3.4 Submitting

A shared `components/BusyScreen.tsx` (new, small; also used for the Loading state) shows "Figuring out what you'd be great at…" with the clay spinner. App runs, in order:

1. `computeScores(answers, quizData.jobs, quizData.optionJobMap)` → `{ topJobs, sortedScores, counts }`
2. `POST /api/generate-description` with `{ studentName, topJobs, sortedScores }` → `description` (backend already falls back on error)
3. `POST /api/submit-questionnaire` with `{ recordId, studentName, studentClass, answers, recommendedJobs: topJobs.map(j => j.job_name).join(', '), scores: counts, geminiDescription }`
4. → `GameState.Results`

On any failure: error message + **Try again** button that re-runs from step 1 with the same `answers` and `recordId`. This mirrors the retry pattern in kindergarten's `PhotoScreen`.

### 3.5 Results

`components/ResultsScreen.tsx` is rewritten. Props:

```ts
interface ResultsScreenProps {
    studentName: string;
    topJobs: { job_id: string; job_name: string }[];
    description: string;
    recordId: string;
    onRestart: () => void;
}
```

- `<h1>`: "{name}, you'd be a great {job_name}!" — with ties: "…a great Teacher or Librarian!" (join with " or ").
- Beneath: one clay card per top job with a Lucide icon (§5.2) and the job name.
- AI description card: the Gemini text, body font, max ~70 words as the backend already targets.
- `components/ProcessingStatus.tsx` reused as-is: polls `/api/check-status/:recordId` every 3 s, renders the portrait in its full-screen overlay on `完成`, error on `失敗`, timeout after 40 attempts.
- **Next student** button: one at the bottom of the page, one inside `ProcessingStatus`'s completed overlay (the overlay already has a restart slot from kindergarten; relabel it). Both call `onRestart`.

`onRestart` resets every App field except `quizData` (no refetch) and returns to `Start`.

---

## 4. Option cards & image fallback

### 4.1 Card

- `components/OptionCard.tsx` (new): a `<button>` with `rounded-clay`, clay dual shadow, `aspect-[4/3]`, image covers the top ~70 %, option text in a bottom band in `clay-ink` on `clay-bg`.
- Focus ring 3 px solid (WCAG 2.4.7). Hover/active: `scale-105` / `scale-95`, disabled under `prefers-reduced-motion`.
- Grid: `grid-cols-2 gap-4` from 375 px up; `max-w-3xl` centered on desktop so cards don't become huge.

### 4.2 Image fallback

The `<img>` has `onError`. When it fires, the card sets `imgFailed = true` and renders a text-only variant: the option text at heading size, centered, on a background picked from a 4-colour clay palette by `index % 4`. No broken-image icon, no layout shift (the card keeps its aspect ratio).

Images also get `loading="eager"` for the current question only; there is no prefetch of the next question (YAGNI).

---

## 5. Data & scoring modules

### 5.1 Ported from `quiz-version` (7ee8469) with minimal edits

| File | Change |
|---|---|
| `utils/googleSheetParser.ts` | Copied verbatim, no logic changes. Only edit: `SPREADSHEET_ID` moves to `config/quiz.ts` and is imported, so the sheet id is not buried in the parser. |
| `utils/scoring.ts` | Replace kindergarten's `buildPickedJobPayload` with v1.1.0's `computeScores`. Keep the same return type. |
| `src/types.ts` | Add back `Choice`, `Question`, `Job`, `OptionJobMapItem`, `QuizData`, `ScoringResults`. Keep `ScoreEntry`, all API types, `ProcessingStatus`. Replace `GameState` per §3. |

### 5.2 New: `src/data/jobIcons.ts`

Maps the 13 `job_id`s in the sheet to Lucide icons, with a `default` (Lucide `Briefcase`) for unknown ids. This is presentation only; scoring never reads it. If the teacher adds a job to the sheet it still works, it just gets the default icon.

### 5.3 Removed from this branch

- `src/data/jobs.ts`, `src/data/jobs.test.ts` — the 11-job constant is kindergarten-only.
- `components/PhotoScreen.tsx` and its test — photo now lives in Start.
- Carousel-specific code and tests in `QuizScreen`.

---

## 6. Backend change (one file)

`server/routes/gemini.ts` currently imports `JOBS` from `src/data/jobs.js` to build its fallback sentence. On this branch that file is gone. Change the fallback to:

```
`${topJobName} — a great choice! ${studentName ? studentName + ', you' : 'You'} can grow up to help people every day.`
```

built from the request's `topJobs[0].job_name`. The route signature, request body, response body (`{ description, fallback }`) and error handling are unchanged. Everything else in `server/` is untouched.

---

## 7. Design tokens & styles

No new tokens. Reuse `clay-primary`, `clay-bg`, `clay-ink`, `rounded-clay`, `shadow-clay`, `animate-slide-in-*`, `animate-wiggle` from `tailwind.config.js` and `src/styles/clay.css`.

No additions to `clay.css`; the incoming option grid reuses `animate-slide-in-right`.

---

## 8. Error handling summary

| Where | Failure | UX |
|---|---|---|
| Loading | Sheet fetch / parse error | Message from parser (already human-readable) + Try again |
| Start | Camera permission denied | Inline message from `CameraCapture` + Retry (existing) |
| Start | Cloudinary or `/api/upload` fails | Inline message + Retake (existing) |
| Quiz | Option image 404 | Text-only card (§4.2) |
| Submitting | Gemini fails | Backend returns fallback text; flow continues |
| Submitting | `/api/submit-questionnaire` fails | Message + Try again (re-runs from scoring) |
| Results | n8n `失敗` / timeout | `ProcessingStatus` existing states; Next student still available |

---

## 9. Testing

Vitest + RTL, same config. Target: every screen, the parser, scoring, and the App state machine.

| File | Covers |
|---|---|
| `utils/googleSheetParser.test.ts` | Parses fixture gviz JSONP for all 4 sheets; case-insensitive headers; empty sheet → `[]`; access-denied text → readable error |
| `utils/scoring.test.ts` | Single winner; tie returns both; unknown option id ignored; no answers → empty result |
| `components/StartScreen.test.tsx` | CTA disabled until name, class (≥2 chars) and photo present; camera not rendered until inputs valid |
| `components/QuizScreen.test.tsx` | Renders "Question N of M"; Back hidden on first question; Back calls `onBack`; selecting calls `onSelectChoice(option_id)`; image `onError` swaps to text card |
| `components/OptionCard.test.tsx` | Fallback render on error; text always visible |
| `components/ResultsScreen.test.tsx` | Tie heading uses " or "; description rendered; Next student calls `onRestart` |
| `src/App.test.tsx` | Loading → Start → 10 answers → Submitting (mocked fetch) → Results → Next student resets to Start without refetching the sheet |

`CameraCapture` and `ProcessingStatus` have no unit tests today and are covered by the manual checks below. `jobs.test.ts`, `PhotoScreen.test.tsx`, and the carousel tests are deleted with their subjects.

Manual checks before tagging: `npm run build` clean; no horizontal scroll at 375 / 768 / 1280; keyboard Tab + Enter through Start and Quiz; reduced-motion disables slide animations.

---

## 10. Documentation & branch housekeeping

- `CLAUDE.md` and `README.md` on `quiz` are rewritten to describe the quiz app (flow, sheet format, scoring) and the branch table gets `quiz` as the active elementary line; `quiz-version` stays listed as the frozen v1.1.0 snapshot.
- `CHANGELOG.md` gets `[v2.0.0-quiz-redesign]` when shipped.
- Tag on completion: `v2.0.0-quiz-redesign`.

---

## 11. Open questions

None blocking. Decisions recorded above were made with the product owner on 2026-09-21.
