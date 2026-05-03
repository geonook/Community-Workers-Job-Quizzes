# Kindergarten Frontend Redesign — Design Spec

**Date:** 2026-05-03
**Project:** Community-Workers-Job-Quizzes
**Scope:** Frontend-only UI/UX renovation. Backend, n8n workflow, Airtable schema, and API contracts unchanged.

---

## 1. Background & Goal

The current app presents an English-language quiz aimed at older students. The actual users are **kindergarten preschoolers (幼稚園小班, ~3–4 years old)** who:

- Cannot read full English sentences fluently
- Are still learning vocabulary like "musician", "firefighter", "doctor"
- Use the app on iPad / phone but the layout should also work on larger screens (RWD)
- Have just watched a teaching video introducing 11 community workers via a song ("When I Grow Up")

Goal: replace the quiz model with a **direct-pick** model where the kid sees jobs one at a time and taps the one they want to be. Visual style shifts to a kid-friendly **Claymorphism** look.

**Hard constraints:**
- API endpoints, request bodies, Airtable fields, and n8n workflow remain untouched.
- All UI text in English (matches teacher's vocabulary lessons).
- No emojis as icons — use Lucide SVG icons only.
- Must be RWD: works on phone, tablet, and desktop.

---

## 2. The 11 Community Workers

Sourced from the teaching video "When I Grow Up" (LV6-5). Each card shows a full sentence to reinforce vocabulary, not just a single word.

| Job key | Display sentence | Lucide icon |
|---|---|---|
| `musician` | I want to be a musician and play music. | `Music` |
| `police` | I want to be a police officer and help people. | `Shield` |
| `hairdresser` | I want to be a hairdresser and cut hair. | `Scissors` |
| `firefighter` | I want to be a firefighter and put out fires. | `Flame` |
| `zookeeper` | I want to be a zookeeper and take care of animals. | `PawPrint` |
| `farmer` | I want to be a farmer and grow plants. | `Sprout` |
| `pilot` | I want to be a pilot and fly airplanes. | `Plane` |
| `baker` | I want to be a baker and bake bread. | `CookingPot` |
| `artist` | I want to be an artist and paint pictures. | `Palette` |
| `dancer` | I want to be a dancer and dance on stage. | `Sparkles` |
| `doctor` | I want to be a doctor and help sick people. | `Stethoscope` |

The job list is hardcoded as a TypeScript const — no Google Sheets parsing for the new flow.

---

## 3. User Flow (4 screens)

```
WelcomeScreen → SelectionScreen → PhotoScreen → ResultScreen
   (name)         (pick a job)      (camera)     (AI portrait + description)
```

No 班級 input. No multi-question quiz. One direct pick.

### 3.1 WelcomeScreen
- Big friendly heading: "What do you want to be when you grow up?"
- Single text input: child's name (or teacher types it).
- Big primary button "Let's start!" — disabled until name is non-empty.
- Optional BGM toggle (off by default — mobile autoplay restrictions + classroom-friendly).

### 3.2 SelectionScreen (core experience)
- **One large card at a time** showing the current job: Lucide icon, full sentence, primary CTA.
- CTA text is dynamic: "I want to be a musician!" — text changes per current job to reinforce the word.
- Secondary controls: ← / → arrow buttons + swipe gesture on touch devices.
- Page indicator dots at bottom (11 dots).
- Tapping the primary CTA selects the current job and advances to PhotoScreen.
- No scoring algorithm — selection is direct.

### 3.3 PhotoScreen
- Camera preview (reuse existing `CameraCapture` component logic).
- Capture button.
- Re-take if needed.
- On confirm:
  1. Upload photo to Cloudinary (existing path).
  2. `POST /api/upload` to create the Airtable record → receives `recordId`.
  3. Generate Gemini description for the picked job (`POST /api/generate-description`).
  4. `POST /api/submit-questionnaire` with `{ recordId, studentName, studentClass: "", answers, recommendedJobs, scores, geminiDescription }`.
  5. Advance to ResultScreen, which begins polling immediately.
- Network errors at any step show a retry button without leaving the screen.

### 3.4 ResultScreen
- Big heading using the chosen job's full sentence: "I want to be a doctor and help sick people!"
- Status states (reuse existing `pollProcessingStatus` polling):
  - **Processing** — friendly waiting animation + Gemini description fades in when ready.
  - **Complete** — AI portrait image + Gemini description.
  - **Failed / timeout** — gentle fallback message + retry button.
- "Start over" button at bottom.

---

## 4. Visual Design System (Claymorphism)

### 4.1 Color tokens
- **Primary:** `#F97316` (warm orange)
- **Primary hover/press:** `#EA580C`
- **Background:** `#FFF7ED` (cream)
- **Surface (cards):** `#FFFFFF`
- **Text-primary:** `#451A03` (deep brown — 4.5:1 on cream)
- **Text-secondary:** `#92400E`
- **Accent (success / star):** `#F59E0B`
- **Error:** `#DC2626`

### 4.2 Typography
- **Heading:** Baloo 2 (700) — round, friendly, kid-readable.
- **Body / button:** Comic Neue (400/700) — gentle handwritten feel without being illegible.
- **Scale:** 14 / 16 / 18 / 24 / 28 / 36
- Body min 16px on mobile to avoid iOS auto-zoom.

### 4.3 Claymorphism style tokens
- **Border-radius:** 24px (cards), 999px (buttons).
- **Shadow stack** (soft, dual-layer):
  - Outer: `0 12px 24px rgba(180, 83, 9, 0.18)`
  - Inner highlight: `inset 0 2px 4px rgba(255, 255, 255, 0.7)`
- **Card padding:** 24px mobile / 32px desktop.
- **Button height:** 64px mobile / 56px desktop.
- **Press feedback:** `transform: scale(0.97)` + shadow reduction (150ms ease-out).

### 4.4 Motion
- Card transitions on selection screen: slide + fade, 250ms ease-out.
- Idle wiggle on the primary CTA (subtle 1deg rotation, 2s loop) — disabled when `prefers-reduced-motion`.
- All animations interruptible.

### 4.5 Iconography
- Lucide React icons only.
- Stroke width 2.5 for friendlier, chunkier silhouette.
- Icon size: 96px on selection card, 32px on buttons, 24px elsewhere.
- Every icon paired with a text label — no icon-only buttons.

---

## 5. Responsive Strategy (RWD)

Mobile-first, but supports tablet and desktop without feeling like a stretched phone app.

| Breakpoint | Target | Container |
|---|---|---|
| `< 640px` | Phone portrait | Full width, 16px padding |
| `640–1024px` | Tablet, phone landscape | Centered, max-w 720px |
| `≥ 1024px` | Desktop, iPad landscape | Centered, max-w 960px |

**Per-screen RWD behavior:**

- **WelcomeScreen** — Phone: vertical stack (heading / illustration / button). Tablet+: two-column with illustration right, text/input left.
- **SelectionScreen** — Phone: single centered card (~80vw, max 360px). Tablet+: centered card + small peek-cards on left/right (scale 0.7, opacity 0.5) to preview neighbors. Desktop: same pattern, just wider container. **Never switch to a grid** — keep the "one decision at a time" rhythm for kids.
- **PhotoScreen** — Phone: full-width camera preview. Tablet+: preview framed at max-w 640px to avoid stretched webcam on desktop.
- **ResultScreen** — Phone: vertical (heading → image → buttons). Tablet+: centered with max-w 480px image, more breathing room.

**Type-scale RWD:** Heading 28px on phone → 36px on desktop. Body stays 16px throughout.

---

## 6. API & Data Contracts (UNCHANGED)

The frontend rewrite must keep all existing endpoints and payload shapes so the n8n workflow continues to work without modification.

### 6.1 Endpoints (unchanged)
- `POST /api/upload` — photo upload (already used by CameraCapture).
- `POST /api/submit-questionnaire` — quiz/selection submission.
- `GET /api/check-status/:recordId` — status polling.
- `POST /api/generate-description` — Gemini description.

### 6.2 Direct-pick → existing payload mapping

The new selection model produces a single picked job. To match the existing `submit-questionnaire` body shape:

```ts
{
  recordId,
  studentName,
  studentClass: "",                      // 班級 dropped from UI; send empty string
  answers: [{ questionId: "direct_pick", optionId: pickedJob }],
  recommendedJobs: [pickedJob],          // single-item list
  scores: { [pickedJob]: 1 },            // single job with score 1
  geminiDescription                      // unchanged: Gemini-generated text
}
```

n8n receives an identical payload shape. Only field values differ (one job instead of weighted scores).

### 6.3 Airtable field mapping (unchanged)
- `學生姓名` ← name input
- `班級` ← `""` (preserved field, not collected by UI)
- `推薦職業` ← picked job display name
- `問卷分數` ← `{ [job]: 1 }` JSON
- `AI職業描述` ← Gemini text
- All other fields written by n8n / backend as before.

---

## 7. Accessibility (must-have)

- Touch targets ≥ 44×44pt.
- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.
- `prefers-reduced-motion` disables wiggle, slide transitions, and idle animations.
- Every Lucide icon has `aria-label`.
- BGM is **off by default** with a clearly visible toggle (mobile autoplay restriction + classroom etiquette).
- All form inputs have visible labels (not placeholder-only).
- Focus rings preserved on all interactive elements.
- Errors (camera failure, submission failure) announced via `role="alert"`.

---

## 8. File-Level Plan (debt prevention)

Reuse existing component files where possible — extend, don't duplicate.

**Rewrite (replace internals, keep filename):**
- `components/StartScreen.tsx` → becomes WelcomeScreen (name input only; camera removed).
- `components/QuizScreen.tsx` → becomes SelectionScreen (single-card carousel).
- `components/ResultsScreen.tsx` → new ResultScreen (status states + AI portrait + Gemini text).

**New file:**
- `components/PhotoScreen.tsx` — wraps existing `CameraCapture` + handles the upload / submit-questionnaire / advance sequence described in §3.3. Splits the camera step out of the old StartScreen.

**Keep mostly intact:**
- `components/CameraCapture.tsx` — visual polish only (claymorphism shell), same Cloudinary logic.
- `components/ProcessingStatus.tsx` — restyled, same logic.
- `utils/api.ts` — unchanged (still uses `pollProcessingStatus`, `submitQuestionnaire`, etc.).
- `src/App.tsx` — extend the GameState enum with `Photo` between `Quiz`/`Selection` and `Results`; route accordingly.

**Adapt:**
- `utils/scoring.ts` — replace weighted-score logic with a thin direct-pick adapter that returns `{ recommendedJobs: [picked], scores: { [picked]: 1 } }`.

**Remove / retire:**
- `utils/googleSheetParser.ts` — no longer needed; jobs are hardcoded.
- `QuizData`, `OptionJobMap` types in `src/types.ts` — replaced with `Job` const + `PickedJob` type.

**New:**
- `src/data/jobs.ts` — hardcoded 11-job const with display sentence + Lucide icon name.
- `src/styles/clay.css` (or Tailwind plugin entries) — Claymorphism shadow utility classes.

---

## 9. Out of Scope (YAGNI)

Explicitly **not** doing in this redesign:

- Song-synced parade mode (deferred; overcomplicated for v1).
- Multi-language support (English only).
- A/B testing infrastructure.
- Admin / teacher dashboard.
- Parent share page.
- Backend / API changes.
- n8n workflow edits.
- Airtable schema changes.
- New state-management library — current `useState` + props is sufficient.
- Persisting selection history across sessions.

---

## 10. Success Criteria

The redesign is complete when:

1. A 4-year-old, with minimal teacher help, can: enter their name → tap a job → take a photo → see their AI portrait.
2. The four screens render correctly across phone (375px), tablet (768px), and desktop (1280px) without horizontal scroll.
3. The same backend / n8n workflow that worked before still works — verified by an end-to-end submission producing a Gemini description and AI portrait in Airtable.
4. Lighthouse accessibility score ≥ 90.
5. No emojis used as icons anywhere in the UI.
6. All 11 jobs are reachable via the carousel and selectable.
