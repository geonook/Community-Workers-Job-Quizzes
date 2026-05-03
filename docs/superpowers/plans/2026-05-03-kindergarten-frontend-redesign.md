# Kindergarten Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Google-Sheets-driven quiz UI with a kindergarten-friendly direct-pick flow (Welcome → Selection → Photo → Result) styled in Claymorphism, while leaving every backend/n8n contract identical.

**Architecture:** React 19 + Vite 6 + TailwindCSS, hardcoded 11-job const replaces Sheets parser, single-card carousel for selection, existing `CameraCapture` reused inside new `PhotoScreen`, polling/Gemini call sites moved but payload shapes preserved. `submit-questionnaire` payload still has `answers/recommendedJobs/scores/geminiDescription` keys — only values shrink to one job.

**Tech Stack:** React 19, TypeScript ~5.8, Vite 6, TailwindCSS 3.4, lucide-react (new), Google Fonts (Baloo 2, Comic Neue), Vitest 1.x + @testing-library/react + jsdom (new dev deps for the small TDD surface).

**Spec:** `docs/superpowers/specs/2026-05-03-kindergarten-frontend-redesign-design.md` (commit `ef9303a`)

**Pre-flight checks per task:** All work happens on the `development` branch (current). Each task ends with a green build (`npm run build`) and a commit. After every commit: `git push origin development` per project policy.

---

## Background the implementer needs

### Repo layout (NOT the React-Native default)

- Components live at the **repo root** under `components/` (not `src/components/`).
- App entry, types, styles live under `src/`.
- Server lives under `server/` and uses **`.js` import suffixes on `.ts` source** (Node ESM quirk).
- Single `package.json` and `tsconfig.json` at the repo root cover both client + server.
- Vite resolves `@/*` → repo root.

### What MUST stay identical so n8n + Airtable keep working

`POST /api/submit-questionnaire` body:

```ts
{
  recordId: string,
  studentName: string,
  studentClass: string,                         // send "" — UI no longer collects it
  answers: string[],                            // existing route reads as string[]; send [pickedJob]
  recommendedJobs: string,                      // existing route reads as string; send pickedJobDisplayName
  scores: Record<string, number>,               // send { [pickedJob]: 1 }
  geminiDescription?: string,
}
```

**Important:** Look at `src/types.ts` — `QuestionnaireSubmission.answers` is `string[]` and `recommendedJobs` is `string` (not `string[]`). The spec section 6.2 shows the conceptual mapping; this plan uses the actual existing types so n8n is byte-identical.

`POST /api/upload` body (created by `CameraCapture`, do not touch):

```ts
{ photoUrl: string, studentName: string, studentClass: string }
```

`POST /api/generate-description` body (existing — keep shape):

```ts
{ studentName: string, topJobs: { job_id: string; job_name: string }[], sortedScores: ScoreEntry[] }
```

For direct-pick: send `topJobs: [{ job_id: pickedJob, job_name: displayName }]`, `sortedScores: [{ job_id: pickedJob, job_name: displayName, score: 1 }]`.

### What the spec says to do that needs care

- **Hardcode the 11 jobs** with full sentences ("I want to be a musician and play music.") — they go on cards AND get sent to Gemini for vocabulary-aware descriptions.
- **Lucide icons only.** No emojis anywhere — strip them from `CameraCapture` / `ProcessingStatus` too.
- **Dynamic CTA text** on selection: "I want to be a musician!" (changes per current carousel position).
- **BGM toggle** on Welcome — off by default; mobile autoplay restrictions mean we never auto-start.
- **`prefers-reduced-motion`** disables idle wiggle + slide transitions.
- **Viewport meta** in `index.html` currently has `maximum-scale=1.0, user-scalable=no` — relax this; no zoom block per accessibility rules.
- **Drop `班級`/`studentClass` from UI** but still send `""` in the submit body so the existing route doesn't choke.

---

## File Structure (decomposition)

**Create:**
- `src/data/jobs.ts` — hardcoded 11-job const, single source of truth.
- `src/styles/clay.css` — Claymorphism utility classes (imported once from `src/index.tsx`).
- `components/PhotoScreen.tsx` — orchestrates Cloudinary upload → `/api/upload` → `/api/generate-description` → `/api/submit-questionnaire` → advance.
- `components/BgmToggle.tsx` — small standalone toggle for the welcome BGM (keeps `WelcomeScreen` focused).
- `vitest.config.ts` — test runner config.
- `src/test/setup.ts` — RTL + jest-dom setup.
- Test files alongside the units they test (see each task).

**Rewrite (replace internals, keep filename):**
- `components/StartScreen.tsx` → WelcomeScreen.
- `components/QuizScreen.tsx` → SelectionScreen (single-card carousel).
- `components/ResultsScreen.tsx` → new ResultScreen.
- `utils/scoring.ts` → thin direct-pick adapter.
- `src/App.tsx` → new state machine.
- `src/types.ts` → drop quiz types, add `JobKey`/`PickedJobPayload`, extend `GameState` with `Selection`/`Photo`.

**Restyle only (no logic change):**
- `components/CameraCapture.tsx` — replace emoji + indigo classes with Lucide icons + clay tokens.
- `components/ProcessingStatus.tsx` — same restyle.

**Delete:**
- `utils/googleSheetParser.ts`
- `components/ProgressBar.tsx` (no progress bar in direct-pick flow)
- `components/ScorePanel.tsx` (empty stub, never used)
- `components/ReportModal.tsx` (spec drops "View Report")

**Modify:**
- `package.json` — add `lucide-react`, vitest stack, `test` script.
- `tailwind.config.js` — add color/font/shadow tokens.
- `index.html` — add Google Fonts links, relax viewport zoom block.

---

## Task 0: Add test infrastructure (Vitest + RTL)

**Why first:** Subsequent tasks use TDD on the small set of pure logic (jobs data, scoring adapter, payload mapping). Without a runner, those tasks can't run their failing test first.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.ts`

- [ ] **Step 1: Install dev deps**

```bash
npm install --save-dev vitest@^1.6.0 @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.4.0 @testing-library/user-event@^14.5.0 jsdom@^24.0.0 @types/node
```

Expected: `package-lock.json` updated, no errors.

- [ ] **Step 2: Add `test` script to `package.json`**

In `package.json` `scripts`, add (right after `start`):

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts` at repo root**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Write the smoke test**

Create `src/test/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test**

Run: `npm test`
Expected: `1 passed`. If jsdom or vitest not found, re-check Step 1 install.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/
git commit -m "chore: add vitest + react-testing-library test infra"
git push origin development
```

---

## Task 1: Add lucide-react, Google Fonts, relax viewport

**Files:**
- Modify: `package.json`
- Modify: `index.html`

- [ ] **Step 1: Install `lucide-react`**

```bash
npm install lucide-react@^0.460.0
```

- [ ] **Step 2: Add Google Fonts + relax viewport in `index.html`**

In `index.html`, replace the existing `<meta name="viewport" ...>` line with:

```html
    <!-- Mobile-first viewport, allow zoom for accessibility -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Then, immediately after the `<title>` line, add:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Comic+Neue:wght@400;700&display=swap"
    />
```

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json index.html
git commit -m "chore: add lucide-react + Baloo 2 / Comic Neue fonts; relax viewport zoom"
git push origin development
```

---

## Task 2: Extend Tailwind theme with Claymorphism tokens

**Files:**
- Modify: `tailwind.config.js`
- Create: `src/styles/clay.css`
- Modify: `src/index.tsx`

- [ ] **Step 1: Replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          primary: '#F97316',
          'primary-press': '#EA580C',
          bg: '#FFF7ED',
          surface: '#FFFFFF',
          ink: '#451A03',
          'ink-soft': '#92400E',
          accent: '#F59E0B',
          danger: '#DC2626',
        },
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['"Comic Neue"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        clay: '0 12px 24px rgba(180, 83, 9, 0.18), inset 0 2px 4px rgba(255, 255, 255, 0.7)',
        'clay-press': '0 4px 8px rgba(180, 83, 9, 0.18), inset 0 2px 4px rgba(255, 255, 255, 0.5)',
      },
      borderRadius: {
        clay: '24px',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        wiggle: 'wiggle 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 250ms ease-out',
        'slide-in-left': 'slide-in-left 250ms ease-out',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Create `src/styles/clay.css`**

```css
/* Claymorphism utilities — supplements Tailwind tokens */

/* Press-down effect for any clay button */
.clay-press-fx {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.clay-press-fx:active {
  transform: scale(0.97);
}

/* Reduced-motion: disable wiggle and slide animations */
@media (prefers-reduced-motion: reduce) {
  .animate-wiggle,
  .animate-slide-in-right,
  .animate-slide-in-left {
    animation: none !important;
  }
}

/* Visible focus rings on all interactive elements */
:focus-visible {
  outline: 3px solid #F97316;
  outline-offset: 2px;
}

/* Body baseline */
html, body {
  background-color: #FFF7ED;
  color: #451A03;
  font-family: '"Comic Neue"', system-ui, sans-serif;
}
```

- [ ] **Step 3: Import `clay.css` from `src/index.tsx`**

Open `src/index.tsx`. Add this import directly after the existing `index.css` import (or as the first import if there is none):

```tsx
import './styles/clay.css';
```

- [ ] **Step 4: Verify build still passes**

Run: `npm run build`
Expected: build succeeds. The page won't visibly change yet because no component uses these tokens.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js src/styles/clay.css src/index.tsx
git commit -m "feat(theme): add claymorphism tokens (color/font/shadow/animations)"
git push origin development
```

---

## Task 3: Hardcoded jobs data + new types

**Files:**
- Create: `src/data/jobs.ts`
- Create: `src/data/jobs.test.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/jobs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { JOBS, getJobByKey, JOB_KEYS } from './jobs';

describe('jobs data', () => {
  it('has exactly 11 jobs in canonical order', () => {
    expect(JOBS).toHaveLength(11);
    expect(JOB_KEYS).toEqual([
      'musician', 'police', 'hairdresser', 'firefighter', 'zookeeper',
      'farmer', 'pilot', 'baker', 'artist', 'dancer', 'doctor',
    ]);
  });

  it('every job has a sentence starting with "I want to be"', () => {
    for (const job of JOBS) {
      expect(job.sentence).toMatch(/^I want to be (a|an) /);
    }
  });

  it('every job has a Lucide icon name from the allowed set', () => {
    const allowed = new Set([
      'Music', 'Shield', 'Scissors', 'Flame', 'PawPrint',
      'Sprout', 'Plane', 'CookingPot', 'Palette', 'Sparkles', 'Stethoscope',
    ]);
    for (const job of JOBS) {
      expect(allowed.has(job.icon)).toBe(true);
    }
  });

  it('every job has a short CTA label', () => {
    for (const job of JOBS) {
      expect(job.cta).toMatch(/^I want to be (a|an) [a-z]+!$/);
    }
  });

  it('getJobByKey returns the matching job', () => {
    expect(getJobByKey('doctor')?.icon).toBe('Stethoscope');
    expect(getJobByKey('musician')?.sentence).toBe('I want to be a musician and play music.');
  });

  it('getJobByKey returns undefined for unknown key', () => {
    expect(getJobByKey('astronaut' as never)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `./jobs` not found.

- [ ] **Step 3: Implement `src/data/jobs.ts`**

```ts
export const JOB_KEYS = [
  'musician',
  'police',
  'hairdresser',
  'firefighter',
  'zookeeper',
  'farmer',
  'pilot',
  'baker',
  'artist',
  'dancer',
  'doctor',
] as const;

export type JobKey = typeof JOB_KEYS[number];

export interface Job {
  key: JobKey;
  /** Full sentence shown on the selection card (vocab reinforcement). */
  sentence: string;
  /** Short button label shown on primary CTA. */
  cta: string;
  /** Display name sent to backend in `recommendedJobs`. */
  displayName: string;
  /** Lucide icon component name. */
  icon: string;
}

export const JOBS: readonly Job[] = [
  { key: 'musician',    sentence: 'I want to be a musician and play music.',           cta: 'I want to be a musician!',    displayName: 'Musician',       icon: 'Music' },
  { key: 'police',      sentence: 'I want to be a police officer and help people.',    cta: 'I want to be a police!',      displayName: 'Police Officer', icon: 'Shield' },
  { key: 'hairdresser', sentence: 'I want to be a hairdresser and cut hair.',          cta: 'I want to be a hairdresser!', displayName: 'Hairdresser',    icon: 'Scissors' },
  { key: 'firefighter', sentence: 'I want to be a firefighter and put out fires.',     cta: 'I want to be a firefighter!', displayName: 'Firefighter',    icon: 'Flame' },
  { key: 'zookeeper',   sentence: 'I want to be a zookeeper and take care of animals.',cta: 'I want to be a zookeeper!',   displayName: 'Zookeeper',      icon: 'PawPrint' },
  { key: 'farmer',      sentence: 'I want to be a farmer and grow plants.',            cta: 'I want to be a farmer!',      displayName: 'Farmer',         icon: 'Sprout' },
  { key: 'pilot',       sentence: 'I want to be a pilot and fly airplanes.',           cta: 'I want to be a pilot!',       displayName: 'Pilot',          icon: 'Plane' },
  { key: 'baker',       sentence: 'I want to be a baker and bake bread.',              cta: 'I want to be a baker!',       displayName: 'Baker',          icon: 'CookingPot' },
  { key: 'artist',      sentence: 'I want to be an artist and paint pictures.',        cta: 'I want to be an artist!',     displayName: 'Artist',         icon: 'Palette' },
  { key: 'dancer',      sentence: 'I want to be a dancer and dance on stage.',         cta: 'I want to be a dancer!',      displayName: 'Dancer',         icon: 'Sparkles' },
  { key: 'doctor',      sentence: 'I want to be a doctor and help sick people.',       cta: 'I want to be a doctor!',      displayName: 'Doctor',         icon: 'Stethoscope' },
] as const;

export function getJobByKey(key: JobKey | string): Job | undefined {
  return JOBS.find((j) => j.key === key);
}
```

- [ ] **Step 4: Update `src/types.ts`**

Replace the entire file contents with:

```ts
export enum GameState {
    Welcome = 'welcome',
    Selection = 'selection',
    Photo = 'photo',
    Results = 'results',
}

// Photo upload
export interface UploadResponse {
    success: boolean;
    recordId: string;
    message?: string;
    photoUrl?: string;
}

export interface CloudinaryUploadResponse {
    secure_url: string;
    public_id: string;
    [key: string]: any;
}

export enum CaptureStatus {
    Idle = 'idle',
    Capturing = 'capturing',
    Preview = 'preview',
    Uploading = 'uploading',
    Success = 'success',
    Error = 'error',
}

// Submission to backend — shape preserved so n8n + Airtable see no change
export interface QuestionnaireSubmission {
    recordId: string;
    answers: string[];
    recommendedJobs: string;
    scores: Record<string, number>;
    studentName: string;
    studentClass: string;
    geminiDescription?: string;
}

export interface QuestionnaireResponse {
    success: boolean;
    recommendedJobs?: string;
    message?: string;
}

export interface StatusResponse {
    success: boolean;
    status: '問卷中' | '待處理' | '處理中' | '完成' | '失敗';
    resultUrl?: string;
    error?: string;
}

export enum ProcessingStatus {
    Idle = 'idle',
    Submitting = 'submitting',
    Polling = 'polling',
    Completed = 'completed',
    Failed = 'failed',
    Timeout = 'timeout',
}

// Used by /api/generate-description body — preserved shape
export interface ScoreEntry {
    job_id: string;
    job_name: string;
    score: number;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: jobs tests PASS. Other source files may fail to typecheck because they import deleted types — that's fine; we'll fix them in subsequent tasks. `npm run build` will still fail until Task 11. Vitest only runs the test files we created, so it should be green.

- [ ] **Step 6: Commit**

```bash
git add src/data/ src/types.ts
git commit -m "feat(data): add 11-job const + JobKey type; simplify GameState enum"
git push origin development
```

---

## Task 4: Direct-pick scoring adapter

**Files:**
- Modify: `utils/scoring.ts`
- Create: `utils/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

Create `utils/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildPickedJobPayload } from './scoring';
import { JOBS } from '../src/data/jobs';

describe('buildPickedJobPayload', () => {
  it('returns the canonical n8n-compatible payload for a picked job', () => {
    const result = buildPickedJobPayload('doctor');
    expect(result).toEqual({
      answers: ['doctor'],
      recommendedJobs: 'Doctor',
      scores: { doctor: 1 },
      topJobsForGemini: [{ job_id: 'doctor', job_name: 'Doctor' }],
      sortedScoresForGemini: [{ job_id: 'doctor', job_name: 'Doctor', score: 1 }],
    });
  });

  it('uses the displayName from JOBS for recommendedJobs', () => {
    const result = buildPickedJobPayload('police');
    expect(result.recommendedJobs).toBe('Police Officer');
  });

  it('throws on unknown job key', () => {
    expect(() => buildPickedJobPayload('astronaut' as never)).toThrow(/unknown job key/i);
  });

  it('produces consistent output for every known job', () => {
    for (const job of JOBS) {
      const result = buildPickedJobPayload(job.key);
      expect(result.answers).toEqual([job.key]);
      expect(result.recommendedJobs).toBe(job.displayName);
      expect(result.scores).toEqual({ [job.key]: 1 });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test utils/scoring.test.ts`
Expected: FAIL — `buildPickedJobPayload` not exported.

- [ ] **Step 3: Replace `utils/scoring.ts`**

```ts
import { JobKey, getJobByKey } from '../src/data/jobs';
import { ScoreEntry } from '../src/types';

export interface PickedJobPayload {
    /** Goes into QuestionnaireSubmission.answers */
    answers: string[];
    /** Goes into QuestionnaireSubmission.recommendedJobs */
    recommendedJobs: string;
    /** Goes into QuestionnaireSubmission.scores */
    scores: Record<string, number>;
    /** Goes into POST /api/generate-description body.topJobs */
    topJobsForGemini: { job_id: string; job_name: string }[];
    /** Goes into POST /api/generate-description body.sortedScores */
    sortedScoresForGemini: ScoreEntry[];
}

export function buildPickedJobPayload(jobKey: JobKey): PickedJobPayload {
    const job = getJobByKey(jobKey);
    if (!job) {
        throw new Error(`Unknown job key: ${jobKey}`);
    }
    return {
        answers: [job.key],
        recommendedJobs: job.displayName,
        scores: { [job.key]: 1 },
        topJobsForGemini: [{ job_id: job.key, job_name: job.displayName }],
        sortedScoresForGemini: [{ job_id: job.key, job_name: job.displayName, score: 1 }],
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test utils/scoring.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add utils/scoring.ts utils/scoring.test.ts
git commit -m "feat(scoring): replace weighted-quiz scoring with direct-pick adapter"
git push origin development
```

---

## Task 5: Rewrite `StartScreen.tsx` as WelcomeScreen + BgmToggle

**Files:**
- Create: `components/BgmToggle.tsx`
- Modify: `components/StartScreen.tsx` (replace contents)
- Create: `components/StartScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/StartScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartScreen from './StartScreen';

describe('WelcomeScreen', () => {
  it('renders the heading', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /what do you want to be when you grow up/i })
    ).toBeInTheDocument();
  });

  it('disables Start button when name is empty', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /let's start/i })).toBeDisabled();
  });

  it('enables Start button once a name is typed', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={() => {}} />);
    await user.type(screen.getByLabelText(/your name/i), 'Mia');
    expect(screen.getByRole('button', { name: /let's start/i })).toBeEnabled();
  });

  it('calls onStart with trimmed name', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<StartScreen onStart={onStart} />);
    await user.type(screen.getByLabelText(/your name/i), '  Mia  ');
    await user.click(screen.getByRole('button', { name: /let's start/i }));
    expect(onStart).toHaveBeenCalledWith('Mia');
  });

  it('renders a BGM toggle that is off by default', () => {
    render(<StartScreen onStart={() => {}} />);
    const toggle = screen.getByRole('switch', { name: /background music/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test components/StartScreen.test.tsx`
Expected: FAIL — current `StartScreen` requires `onPhotoCapture` prop, has `Class` input, etc.

- [ ] **Step 3: Create `components/BgmToggle.tsx`**

```tsx
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface BgmToggleProps {
  on: boolean;
  onToggle: (next: boolean) => void;
}

const BgmToggle: React.FC<BgmToggleProps> = ({ on, onToggle }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? 'Background music: turn off' : 'Background music: turn on'}
      onClick={() => onToggle(!on)}
      className="clay-press-fx inline-flex items-center gap-2 rounded-full bg-clay-surface px-4 py-2 text-clay-ink-soft shadow-clay font-body text-sm"
    >
      {on ? <Volume2 size={20} strokeWidth={2.5} aria-hidden /> : <VolumeX size={20} strokeWidth={2.5} aria-hidden />}
      <span>Background music</span>
    </button>
  );
};

export default BgmToggle;
```

- [ ] **Step 4: Replace `components/StartScreen.tsx`**

```tsx
import React, { useState } from 'react';
import BgmToggle from './BgmToggle';

interface StartScreenProps {
    onStart: (name: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [bgmOn, setBgmOn] = useState(false);

    const trimmed = name.trim();
    const canStart = trimmed.length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (canStart) {
            onStart(trimmed);
        }
    };

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md md:max-w-2xl">
                <div className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-10">
                    <div className="flex justify-end mb-4">
                        <BgmToggle on={bgmOn} onToggle={setBgmOn} />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="font-heading font-bold text-clay-ink text-3xl md:text-4xl leading-tight">
                            What do you want to be when you grow up?
                        </h1>
                        <p className="font-body text-clay-ink-soft mt-3 text-base md:text-lg">
                            Type your name to begin.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="welcome-name"
                                className="block font-body font-bold text-clay-ink mb-2 text-base"
                            >
                                Your Name
                            </label>
                            <input
                                id="welcome-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-4 rounded-clay border-2 border-orange-200 bg-white text-clay-ink font-body text-lg shadow-clay focus:border-clay-primary"
                                placeholder="e.g. Mia"
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!canStart}
                            className="clay-press-fx w-full rounded-full bg-clay-primary text-white font-heading font-bold text-xl py-5 shadow-clay hover:bg-clay-primary-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Let's start!
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default StartScreen;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test components/StartScreen.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add components/StartScreen.tsx components/StartScreen.test.tsx components/BgmToggle.tsx
git commit -m "feat(welcome): rewrite StartScreen as kid-friendly WelcomeScreen + BGM toggle"
git push origin development
```

---

## Task 6: Rewrite `QuizScreen.tsx` as SelectionScreen (single-card carousel)

**Files:**
- Modify: `components/QuizScreen.tsx` (replace contents)
- Create: `components/QuizScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/QuizScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizScreen from './QuizScreen';

describe('SelectionScreen', () => {
  it('renders the first job by default', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getByText(/i want to be a musician and play music\./i)).toBeInTheDocument();
  });

  it('shows dynamic CTA matching the current job', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getByRole('button', { name: /i want to be a musician!/i })).toBeInTheDocument();
  });

  it('Next button advances to the second job', async () => {
    const user = userEvent.setup();
    render(<QuizScreen onPick={() => {}} />);
    await user.click(screen.getByRole('button', { name: /next job/i }));
    expect(screen.getByText(/i want to be a police officer/i)).toBeInTheDocument();
  });

  it('Previous button at index 0 is disabled', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getByRole('button', { name: /previous job/i })).toBeDisabled();
  });

  it('Next button at the last job is disabled', async () => {
    const user = userEvent.setup();
    render(<QuizScreen onPick={() => {}} />);
    const next = screen.getByRole('button', { name: /next job/i });
    for (let i = 0; i < 10; i++) await user.click(next);
    expect(screen.getByText(/i want to be a doctor and help sick people/i)).toBeInTheDocument();
    expect(next).toBeDisabled();
  });

  it('clicking the primary CTA picks the current job', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<QuizScreen onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: /next job/i }));
    await user.click(screen.getByRole('button', { name: /i want to be a police!/i }));
    expect(onPick).toHaveBeenCalledWith('police');
  });

  it('renders 11 page-indicator dots', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getAllByRole('listitem', { name: /job indicator/i })).toHaveLength(11);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test components/QuizScreen.test.tsx`
Expected: FAIL — current QuizScreen takes `question`/`onSelectChoice`, not `onPick`.

- [ ] **Step 3: Replace `components/QuizScreen.tsx`**

```tsx
import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { JOBS, JobKey } from '../src/data/jobs';

interface QuizScreenProps {
    onPick: (jobKey: JobKey) => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onPick }) => {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');

    const current = JOBS[index];
    const Icon = (LucideIcons as Record<string, React.ComponentType<any>>)[current.icon];

    const goPrev = () => {
        if (index > 0) {
            setDirection('left');
            setIndex(index - 1);
        }
    };
    const goNext = () => {
        if (index < JOBS.length - 1) {
            setDirection('right');
            setIndex(index + 1);
        }
    };
    const handlePick = () => onPick(current.key);

    const animationClass =
        direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center justify-between px-4 py-6">
            <header className="text-center pt-2 pb-4">
                <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl">
                    Pick your dream job
                </h1>
            </header>

            <section className="flex-1 w-full max-w-md md:max-w-2xl flex items-center justify-center">
                <div
                    key={current.key}
                    className={`bg-clay-surface rounded-clay shadow-clay p-8 md:p-10 w-full text-center ${animationClass}`}
                >
                    <div className="flex items-center justify-center mb-6">
                        {Icon ? (
                            <Icon size={96} strokeWidth={2.5} className="text-clay-primary" aria-hidden />
                        ) : (
                            <div className="w-24 h-24" />
                        )}
                    </div>

                    <p className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug mb-6">
                        {current.sentence}
                    </p>

                    <button
                        type="button"
                        onClick={handlePick}
                        className="clay-press-fx animate-wiggle w-full rounded-full bg-clay-primary text-white font-heading font-bold text-lg md:text-xl py-5 shadow-clay hover:bg-clay-primary-press"
                    >
                        {current.cta}
                    </button>
                </div>
            </section>

            <nav className="w-full max-w-md md:max-w-2xl flex items-center justify-between mt-6">
                <button
                    type="button"
                    onClick={goPrev}
                    disabled={index === 0}
                    aria-label="Previous job"
                    className="clay-press-fx flex items-center justify-center w-14 h-14 rounded-full bg-clay-surface text-clay-ink shadow-clay disabled:opacity-40"
                >
                    <LucideIcons.ChevronLeft size={28} strokeWidth={2.5} aria-hidden />
                </button>

                <ul className="flex items-center gap-2" aria-label="Job carousel position">
                    {JOBS.map((job, i) => (
                        <li
                            key={job.key}
                            aria-label={`Job indicator ${i + 1}`}
                            className={`rounded-full transition-all ${
                                i === index
                                    ? 'w-6 h-2 bg-clay-primary'
                                    : 'w-2 h-2 bg-orange-200'
                            }`}
                        />
                    ))}
                </ul>

                <button
                    type="button"
                    onClick={goNext}
                    disabled={index === JOBS.length - 1}
                    aria-label="Next job"
                    className="clay-press-fx flex items-center justify-center w-14 h-14 rounded-full bg-clay-surface text-clay-ink shadow-clay disabled:opacity-40"
                >
                    <LucideIcons.ChevronRight size={28} strokeWidth={2.5} aria-hidden />
                </button>
            </nav>
        </main>
    );
};

export default QuizScreen;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test components/QuizScreen.test.tsx`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add components/QuizScreen.tsx components/QuizScreen.test.tsx
git commit -m "feat(selection): rewrite QuizScreen as single-card carousel for direct-pick"
git push origin development
```

---

## Task 7: Restyle `CameraCapture.tsx` (no logic change)

**Files:**
- Modify: `components/CameraCapture.tsx`

We are not changing behavior — just swapping the indigo/emoji visual layer for clay tokens + Lucide icons. No tests are added; existing tests in later tasks indirectly cover the integration.

- [ ] **Step 1: Replace `components/CameraCapture.tsx`**

```tsx
import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CaptureStatus, UploadResponse, CloudinaryUploadResponse } from '../src/types';
import { getApiUrl } from '../config/api';

interface CameraCaptureProps {
    studentName: string;
    studentClass: string;
    onSuccess: (recordId: string, photoUrl: string) => void;
    onError?: (error: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
    studentName,
    studentClass,
    onSuccess,
    onError,
}) => {
    const [status, setStatus] = useState<CaptureStatus>(CaptureStatus.Idle);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const validateFile = (file: File): string | null => {
        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) return 'Only JPG or PNG images are allowed';
        if (file.size > maxSize) return 'Image too large! Please choose a photo under 5MB';
        return null;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setStatus(CaptureStatus.Error);
            onError?.(validationError);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setPhotoFile(file);
            setStatus(CaptureStatus.Preview);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const triggerCamera = () => fileInputRef.current?.click();

    const handleRetake = () => {
        setPreview(null);
        setPhotoFile(null);
        setStatus(CaptureStatus.Idle);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary setup incomplete, please contact your teacher');
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );
        if (!response.ok) throw new Error('Photo upload failed, please try again');
        const data: CloudinaryUploadResponse = await response.json();
        return data.secure_url;
    };

    const createAirtableRecord = async (photoUrl: string): Promise<string> => {
        const response = await fetch(getApiUrl('/api/upload'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoUrl, studentName, studentClass }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save record, please try again');
        }
        const data: UploadResponse = await response.json();
        if (!data.success) throw new Error(data.message || 'Save failed');
        return data.recordId;
    };

    const handleConfirm = async () => {
        if (!photoFile) return;
        setStatus(CaptureStatus.Uploading);
        setError(null);
        try {
            const photoUrl = await uploadToCloudinary(photoFile);
            const recordId = await createAirtableRecord(photoUrl);
            setStatus(CaptureStatus.Success);
            onSuccess(recordId, photoUrl);
        } catch (err: any) {
            const errorMessage = err.message || 'Upload failed, please try again';
            setError(errorMessage);
            setStatus(CaptureStatus.Error);
            onError?.(errorMessage);
        }
    };

    if (status === CaptureStatus.Success) {
        return (
            <div className="text-center p-6 bg-clay-surface rounded-clay shadow-clay">
                <CheckCircle2 size={56} strokeWidth={2.5} className="mx-auto mb-3 text-green-600" aria-hidden />
                <p className="font-heading font-bold text-clay-ink text-xl">Photo uploaded!</p>
                {preview && (
                    <img
                        src={preview}
                        alt="Your captured photo"
                        className="w-32 h-32 object-cover rounded-clay mx-auto mt-4 shadow-clay"
                    />
                )}
            </div>
        );
    }

    if (status === CaptureStatus.Uploading) {
        return (
            <div className="text-center p-8 bg-clay-surface rounded-clay shadow-clay" role="status" aria-live="polite">
                <Loader2 size={56} strokeWidth={2.5} className="mx-auto mb-3 text-clay-primary animate-spin" aria-hidden />
                <p className="font-heading font-bold text-clay-ink text-xl">Uploading…</p>
            </div>
        );
    }

    if (status === CaptureStatus.Preview && preview) {
        return (
            <div className="space-y-5">
                <img
                    src={preview}
                    alt="Photo preview"
                    className="w-full max-h-72 object-contain rounded-clay shadow-clay bg-clay-surface"
                />
                <div className="flex gap-3">
                    <button
                        onClick={handleRetake}
                        className="clay-press-fx flex-1 rounded-full bg-clay-surface text-clay-ink font-heading font-bold py-4 shadow-clay"
                    >
                        Retake
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="clay-press-fx flex-1 rounded-full bg-clay-primary text-white font-heading font-bold py-4 shadow-clay hover:bg-clay-primary-press"
                    >
                        Use this photo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                onClick={triggerCamera}
                className="clay-press-fx w-full bg-clay-primary text-white font-heading font-bold text-xl py-6 rounded-clay shadow-clay hover:bg-clay-primary-press flex items-center justify-center gap-3"
            >
                <Camera size={32} strokeWidth={2.5} aria-hidden />
                Take a photo
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
            />
            {error && (
                <div role="alert" className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-clay flex items-start gap-2">
                    <AlertCircle size={20} strokeWidth={2.5} className="mt-0.5 flex-shrink-0" aria-hidden />
                    <p className="font-body">{error}</p>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/CameraCapture.tsx
git commit -m "style(camera): swap indigo+emoji UI for claymorphism + lucide icons"
git push origin development
```

---

## Task 8: Restyle `ProcessingStatus.tsx` (no logic change)

**Files:**
- Modify: `components/ProcessingStatus.tsx`

- [ ] **Step 1: Replace `components/ProcessingStatus.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, Loader2, Download } from 'lucide-react';
import { ProcessingStatus as ProcessingStatusEnum, StatusResponse } from '../src/types';
import { pollProcessingStatus } from '../utils/api';

interface ProcessingStatusProps {
    recordId: string;
    onComplete?: (resultUrl: string) => void;
    onError?: (error: string) => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ recordId, onComplete, onError }) => {
    const [status, setStatus] = useState<ProcessingStatusEnum>(ProcessingStatusEnum.Polling);
    const [currentStatus, setCurrentStatus] = useState<string>('Pending');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);

    useEffect(() => {
        const cleanup = pollProcessingStatus(
            recordId,
            (statusData: StatusResponse) => {
                setCurrentStatus(statusData.status);
                setPollCount((prev) => prev + 1);
            },
            (statusData: StatusResponse) => {
                setStatus(ProcessingStatusEnum.Completed);
                if (statusData.resultUrl) {
                    setResultUrl(statusData.resultUrl);
                    onComplete?.(statusData.resultUrl);
                }
            },
            (error: string) => {
                setStatus(ProcessingStatusEnum.Failed);
                setErrorMessage(error);
                onError?.(error);
            },
            () => {
                setStatus(ProcessingStatusEnum.Timeout);
            }
        );
        return cleanup;
    }, [recordId, onComplete, onError]);

    if (status === ProcessingStatusEnum.Completed && resultUrl) {
        return (
            <div className="fixed inset-0 z-50 bg-clay-bg flex flex-col">
                <div className="text-center pt-8 pb-4 px-4">
                    <CheckCircle2 size={64} strokeWidth={2.5} className="mx-auto mb-3 text-green-600" aria-hidden />
                    <h2 className="font-heading font-bold text-clay-ink text-3xl md:text-4xl">
                        Your career photo is ready!
                    </h2>
                </div>
                <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
                    <img
                        src={resultUrl}
                        alt="Your career portrait"
                        className="max-w-full max-h-full object-contain rounded-clay shadow-clay"
                    />
                </div>
                <div className="flex justify-center pb-8 px-4">
                    <a
                        href={resultUrl}
                        download
                        className="clay-press-fx inline-flex items-center gap-3 rounded-full bg-clay-primary text-white font-heading font-bold text-lg py-4 px-8 shadow-clay"
                    >
                        <Download size={24} strokeWidth={2.5} aria-hidden />
                        Download photo
                    </a>
                </div>
            </div>
        );
    }

    if (status === ProcessingStatusEnum.Failed) {
        return (
            <div role="alert" className="text-center p-6 bg-red-50 rounded-clay border-2 border-red-200 space-y-3">
                <AlertCircle size={56} strokeWidth={2.5} className="mx-auto text-red-600" aria-hidden />
                <h3 className="font-heading font-bold text-red-800 text-2xl">Photo processing failed</h3>
                <p className="font-body text-red-700">{errorMessage || 'Something went wrong'}</p>
                <p className="font-body text-red-600 text-sm">Please tell your teacher — we'll try again.</p>
            </div>
        );
    }

    if (status === ProcessingStatusEnum.Timeout) {
        return (
            <div role="alert" className="text-center p-6 bg-amber-50 rounded-clay border-2 border-amber-200 space-y-3">
                <Clock size={56} strokeWidth={2.5} className="mx-auto text-amber-600" aria-hidden />
                <h3 className="font-heading font-bold text-amber-800 text-2xl">Still working…</h3>
                <p className="font-body text-amber-700">
                    Your photo is taking longer than usual. Refresh later or ask your teacher for help.
                </p>
                <code className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">
                    Record ID: {recordId}
                </code>
            </div>
        );
    }

    return (
        <div className="text-center p-8 bg-clay-surface rounded-clay shadow-clay space-y-4" role="status" aria-live="polite">
            <Loader2 size={64} strokeWidth={2.5} className="mx-auto text-clay-primary animate-spin" aria-hidden />
            <h3 className="font-heading font-bold text-clay-ink text-2xl">
                Creating your career photo…
            </h3>
            <p className="font-body text-clay-ink-soft">
                {(currentStatus === '待處理' || currentStatus === 'Pending') && 'Getting ready…'}
                {(currentStatus === '處理中' || currentStatus === 'Processing') && 'Working hard on it…'}
                {(currentStatus === '問卷中' || currentStatus === 'In Quiz') && 'Preparing…'}
            </p>
            <p className="font-body text-clay-ink-soft text-sm">Checked {pollCount} times.</p>
        </div>
    );
};

export default ProcessingStatus;
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/ProcessingStatus.tsx
git commit -m "style(processing): swap indigo+emoji UI for claymorphism + lucide icons"
git push origin development
```

---

## Task 9: Create `PhotoScreen.tsx` orchestrator

**Files:**
- Create: `components/PhotoScreen.tsx`
- Create: `components/PhotoScreen.test.tsx`

**Behavior (per spec §3.3):**

When user confirms a photo, `CameraCapture` already does steps 1+2 (Cloudinary upload, `/api/upload`) and gives us `recordId` + `photoUrl`. After that, this screen does:

3. `POST /api/generate-description` with the picked job → get description text.
4. `POST /api/submit-questionnaire` with the full payload.
5. Call `onComplete(recordId, geminiDescription)` so the parent can render Result.

If steps 3–5 fail, show retry button without leaving the screen.

- [ ] **Step 1: Write the failing test**

Create `components/PhotoScreen.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhotoScreen from './PhotoScreen';

vi.mock('./CameraCapture', () => ({
  default: ({ onSuccess }: any) => (
    <button
      data-testid="mock-camera-confirm"
      onClick={() => onSuccess('rec_123', 'https://cdn.example/photo.jpg')}
    >
      Mock confirm photo
    </button>
  ),
}));

const originalFetch = global.fetch;

describe('PhotoScreen', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('after photo upload, calls generate-description then submit-questionnaire and advances', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/generate-description')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, description: 'You will be a great doctor!' }),
        });
      }
      if (url.includes('/api/submit-questionnaire')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoScreen
        studentName="Mia"
        pickedJob="doctor"
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('mock-camera-confirm'));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith('rec_123', 'You will be a great doctor!')
    );

    const submitCall = (global.fetch as any).mock.calls.find(
      ([url]: [string]) => url.includes('/api/submit-questionnaire')
    );
    const submittedBody = JSON.parse(submitCall[1].body);
    expect(submittedBody).toMatchObject({
      recordId: 'rec_123',
      studentName: 'Mia',
      studentClass: '',
      answers: ['doctor'],
      recommendedJobs: 'Doctor',
      scores: { doctor: 1 },
      geminiDescription: 'You will be a great doctor!',
    });
  });

  it('shows a retry button when submit-questionnaire fails', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/generate-description')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, description: 'desc' }),
        });
      }
      if (url.includes('/api/submit-questionnaire')) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const user = userEvent.setup();
    render(
      <PhotoScreen
        studentName="Mia"
        pickedJob="doctor"
        onComplete={() => {}}
      />
    );

    await user.click(screen.getByTestId('mock-camera-confirm'));

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('uses fallback description when generate-description fails but still submits', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/generate-description')) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      }
      if (url.includes('/api/submit-questionnaire')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoScreen
        studentName="Mia"
        pickedJob="doctor"
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('mock-camera-confirm'));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    const [, geminiText] = onComplete.mock.calls[0];
    expect(typeof geminiText).toBe('string');
    expect(geminiText.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test components/PhotoScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/PhotoScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import CameraCapture from './CameraCapture';
import { JobKey, getJobByKey } from '../src/data/jobs';
import { buildPickedJobPayload } from '../utils/scoring';
import { submitQuestionnaire } from '../utils/api';
import { getApiUrl } from '../config/api';
import { QuestionnaireSubmission } from '../src/types';

interface PhotoScreenProps {
    studentName: string;
    pickedJob: JobKey;
    onBack?: () => void;
    onComplete: (recordId: string, geminiDescription: string) => void;
}

type Phase = 'capture' | 'submitting' | 'error';

const FALLBACK_DESCRIPTION =
    'You have a great future ahead — keep dreaming big and trying new things every day!';

const PhotoScreen: React.FC<PhotoScreenProps> = ({ studentName, pickedJob, onBack, onComplete }) => {
    const [phase, setPhase] = useState<Phase>('capture');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pendingRecord, setPendingRecord] = useState<{ recordId: string; photoUrl: string } | null>(null);

    const job = getJobByKey(pickedJob);

    const fetchGeminiDescription = async (): Promise<string> => {
        const payload = buildPickedJobPayload(pickedJob);
        try {
            const response = await fetch(getApiUrl('/api/generate-description'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentName,
                    topJobs: payload.topJobsForGemini,
                    sortedScores: payload.sortedScoresForGemini,
                }),
            });
            if (!response.ok) return FALLBACK_DESCRIPTION;
            const data = await response.json();
            return data.success && data.description ? data.description : FALLBACK_DESCRIPTION;
        } catch {
            return FALLBACK_DESCRIPTION;
        }
    };

    const submitToBackend = async (recordId: string, geminiDescription: string) => {
        const payload = buildPickedJobPayload(pickedJob);
        const submission: QuestionnaireSubmission = {
            recordId,
            studentName,
            studentClass: '',
            answers: payload.answers,
            recommendedJobs: payload.recommendedJobs,
            scores: payload.scores,
            geminiDescription,
        };
        await submitQuestionnaire(submission);
    };

    const runPostUploadPipeline = async (recordId: string, photoUrl: string) => {
        setPhase('submitting');
        setErrorMessage(null);
        setPendingRecord({ recordId, photoUrl });
        try {
            const description = await fetchGeminiDescription();
            await submitToBackend(recordId, description);
            onComplete(recordId, description);
        } catch (err: any) {
            setErrorMessage(err?.message ?? 'Could not save your answer. Please try again.');
            setPhase('error');
        }
    };

    const handleCameraSuccess = (recordId: string, photoUrl: string) => {
        runPostUploadPipeline(recordId, photoUrl);
    };

    const handleRetry = () => {
        if (pendingRecord) {
            runPostUploadPipeline(pendingRecord.recordId, pendingRecord.photoUrl);
        }
    };

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <header className="w-full max-w-md md:max-w-2xl flex items-center justify-between mb-6">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Go back to job selection"
                        className="clay-press-fx inline-flex items-center gap-2 rounded-full bg-clay-surface text-clay-ink shadow-clay px-4 py-2 font-body"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} aria-hidden />
                        Back
                    </button>
                ) : <span />}
                <p className="font-heading font-bold text-clay-ink text-lg md:text-xl">
                    {job ? job.cta : 'Take your photo!'}
                </p>
            </header>

            <section className="w-full max-w-md md:max-w-2xl">
                {phase === 'capture' && (
                    <CameraCapture
                        studentName={studentName}
                        studentClass=""
                        onSuccess={handleCameraSuccess}
                        onError={(msg) => {
                            setErrorMessage(msg);
                            setPhase('error');
                        }}
                    />
                )}

                {phase === 'submitting' && (
                    <div className="bg-clay-surface rounded-clay shadow-clay p-8 text-center" role="status" aria-live="polite">
                        <div className="font-heading font-bold text-clay-ink text-xl">Saving your answer…</div>
                        <p className="font-body text-clay-ink-soft mt-2">Please wait a moment.</p>
                    </div>
                )}

                {phase === 'error' && (
                    <div role="alert" className="bg-clay-surface rounded-clay shadow-clay p-6 text-center space-y-4">
                        <p className="font-heading font-bold text-clay-danger text-xl">Hmm, that didn't work.</p>
                        <p className="font-body text-clay-ink-soft">
                            {errorMessage ?? 'Please try again in a moment.'}
                        </p>
                        <button
                            type="button"
                            onClick={pendingRecord ? handleRetry : () => setPhase('capture')}
                            className="clay-press-fx rounded-full bg-clay-primary text-white font-heading font-bold py-4 px-8 shadow-clay hover:bg-clay-primary-press"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
};

export default PhotoScreen;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test components/PhotoScreen.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/PhotoScreen.tsx components/PhotoScreen.test.tsx
git commit -m "feat(photo): add PhotoScreen orchestrator (camera + Gemini + submit)"
git push origin development
```

---

## Task 10: Rewrite `ResultsScreen.tsx` as ResultScreen

**Files:**
- Modify: `components/ResultsScreen.tsx`
- Create: `components/ResultsScreen.test.tsx`

The new ResultScreen receives `recordId`, `pickedJob`, `studentName`, `geminiDescription`, and `onRestart`. It renders the chosen job's full sentence as the heading, mounts `ProcessingStatus` for the AI portrait polling, and shows the description below. No more `topJobs` / `otherResults` / `ReportModal`.

- [ ] **Step 1: Write the failing test**

Create `components/ResultsScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsScreen from './ResultsScreen';

vi.mock('./ProcessingStatus', () => ({
  default: ({ recordId }: any) => <div data-testid="processing-status">Polling {recordId}</div>,
}));

describe('ResultScreen', () => {
  it('renders the picked job sentence as heading', () => {
    render(
      <ResultsScreen
        recordId="rec_1"
        pickedJob="doctor"
        studentName="Mia"
        geminiDescription="You will help many people."
        onRestart={() => {}}
      />
    );
    expect(
      screen.getByRole('heading', { name: /i want to be a doctor and help sick people/i })
    ).toBeInTheDocument();
  });

  it('renders the gemini description', () => {
    render(
      <ResultsScreen
        recordId="rec_1"
        pickedJob="doctor"
        studentName="Mia"
        geminiDescription="You will help many people."
        onRestart={() => {}}
      />
    );
    expect(screen.getByText(/you will help many people/i)).toBeInTheDocument();
  });

  it('mounts ProcessingStatus for the AI portrait polling', () => {
    render(
      <ResultsScreen
        recordId="rec_1"
        pickedJob="doctor"
        studentName="Mia"
        geminiDescription="ok"
        onRestart={() => {}}
      />
    );
    expect(screen.getByTestId('processing-status')).toHaveTextContent('Polling rec_1');
  });

  it('Start over button calls onRestart', async () => {
    const onRestart = vi.fn();
    const user = userEvent.setup();
    render(
      <ResultsScreen
        recordId="rec_1"
        pickedJob="doctor"
        studentName="Mia"
        geminiDescription="ok"
        onRestart={onRestart}
      />
    );
    await user.click(screen.getByRole('button', { name: /start over/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test components/ResultsScreen.test.tsx`
Expected: FAIL — current component takes `answers`, `quizData`, etc.

- [ ] **Step 3: Replace `components/ResultsScreen.tsx`**

```tsx
import React from 'react';
import { RotateCcw } from 'lucide-react';
import ProcessingStatus from './ProcessingStatus';
import { JobKey, getJobByKey } from '../src/data/jobs';

interface ResultsScreenProps {
    recordId: string;
    pickedJob: JobKey;
    studentName: string;
    geminiDescription: string;
    onRestart: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
    recordId,
    pickedJob,
    studentName,
    geminiDescription,
    onRestart,
}) => {
    const job = getJobByKey(pickedJob);
    const heading = job?.sentence ?? `Great choice, ${studentName}!`;

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <div className="w-full max-w-md md:max-w-2xl space-y-6">
                <header className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-8 text-center">
                    <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug">
                        {heading}
                    </h1>
                    <p className="font-body text-clay-ink-soft mt-2 text-base">
                        Great choice, {studentName}!
                    </p>
                </header>

                <ProcessingStatus
                    recordId={recordId}
                    onComplete={() => { /* result image rendered by ProcessingStatus full-screen overlay */ }}
                    onError={() => { /* error rendered by ProcessingStatus */ }}
                />

                {geminiDescription && (
                    <article className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-8 border-l-8 border-clay-primary">
                        <p className="font-body text-clay-ink leading-relaxed text-base md:text-lg">
                            {geminiDescription}
                        </p>
                    </article>
                )}

                <div className="pb-8">
                    <button
                        type="button"
                        onClick={onRestart}
                        className="clay-press-fx w-full inline-flex items-center justify-center gap-3 rounded-full bg-clay-primary text-white font-heading font-bold text-lg py-5 shadow-clay hover:bg-clay-primary-press"
                    >
                        <RotateCcw size={24} strokeWidth={2.5} aria-hidden />
                        Start over
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ResultsScreen;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test components/ResultsScreen.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ResultsScreen.tsx components/ResultsScreen.test.tsx
git commit -m "feat(result): rewrite ResultsScreen with picked-job heading + clay UI"
git push origin development
```

---

## Task 11: Rewrite `src/App.tsx` to wire the new flow

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

After this task, the app should run end-to-end with the new UI.

- [ ] **Step 1: Write the failing test**

Create `src/App.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

vi.mock('../components/PhotoScreen', () => ({
  default: ({ onComplete }: any) => (
    <button data-testid="mock-photo-done" onClick={() => onComplete('rec_xx', 'Gemini desc.')}>
      mock photo done
    </button>
  ),
}));
vi.mock('../components/ResultsScreen', () => ({
  default: ({ pickedJob, geminiDescription }: any) => (
    <div data-testid="result-screen">
      result for {pickedJob} — {geminiDescription}
    </div>
  ),
}));

describe('App state machine', () => {
  it('starts on the welcome screen', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /what do you want to be when you grow up/i })
    ).toBeInTheDocument();
  });

  it('flows welcome → selection → photo → result', async () => {
    const user = userEvent.setup();
    render(<App />);

    // welcome
    await user.type(screen.getByLabelText(/your name/i), 'Mia');
    await user.click(screen.getByRole('button', { name: /let's start/i }));

    // selection — pick first job (musician)
    await user.click(screen.getByRole('button', { name: /i want to be a musician!/i }));

    // photo
    await user.click(screen.getByTestId('mock-photo-done'));

    // result
    expect(screen.getByTestId('result-screen')).toHaveTextContent('result for musician');
    expect(screen.getByTestId('result-screen')).toHaveTextContent('Gemini desc.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/App.test.tsx`
Expected: FAIL — old App still depends on Google Sheets data fetching.

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import { JobKey } from './data/jobs';
import StartScreen from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import PhotoScreen from '../components/PhotoScreen';
import ResultsScreen from '../components/ResultsScreen';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Welcome);
    const [studentName, setStudentName] = useState('');
    const [pickedJob, setPickedJob] = useState<JobKey | null>(null);
    const [recordId, setRecordId] = useState<string | null>(null);
    const [geminiDescription, setGeminiDescription] = useState<string>('');

    const handleWelcomeStart = useCallback((name: string) => {
        setStudentName(name);
        setGameState(GameState.Selection);
    }, []);

    const handlePickJob = useCallback((jobKey: JobKey) => {
        setPickedJob(jobKey);
        setGameState(GameState.Photo);
    }, []);

    const handlePhotoBack = useCallback(() => {
        setGameState(GameState.Selection);
    }, []);

    const handlePhotoComplete = useCallback((rid: string, description: string) => {
        setRecordId(rid);
        setGeminiDescription(description);
        setGameState(GameState.Results);
    }, []);

    const handleRestart = useCallback(() => {
        setGameState(GameState.Welcome);
        setStudentName('');
        setPickedJob(null);
        setRecordId(null);
        setGeminiDescription('');
    }, []);

    switch (gameState) {
        case GameState.Welcome:
            return <StartScreen onStart={handleWelcomeStart} />;
        case GameState.Selection:
            return <QuizScreen onPick={handlePickJob} />;
        case GameState.Photo:
            return pickedJob ? (
                <PhotoScreen
                    studentName={studentName}
                    pickedJob={pickedJob}
                    onBack={handlePhotoBack}
                    onComplete={handlePhotoComplete}
                />
            ) : null;
        case GameState.Results:
            return pickedJob && recordId ? (
                <ResultsScreen
                    recordId={recordId}
                    pickedJob={pickedJob}
                    studentName={studentName}
                    geminiDescription={geminiDescription}
                    onRestart={handleRestart}
                />
            ) : null;
        default:
            return null;
    }
};

export default App;
```

- [ ] **Step 4: Run all tests + build**

Run: `npm test`
Expected: every test PASSES.

Run: `npm run build`
Expected: `dist/` produced. If TypeScript errors mention `googleSheetParser` or removed types, those imports remain in deleted files — Task 12 cleans them up.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat(app): rewire App.tsx for Welcome → Selection → Photo → Result flow"
git push origin development
```

---

## Task 12: Delete dead files

**Files:**
- Delete: `utils/googleSheetParser.ts`
- Delete: `components/ProgressBar.tsx`
- Delete: `components/ScorePanel.tsx`
- Delete: `components/ReportModal.tsx`

These are no longer referenced after Task 11. Verify with grep before deleting.

- [ ] **Step 1: Verify nothing imports these files**

Run:
```bash
grep -r "googleSheetParser\|ProgressBar\|ScorePanel\|ReportModal" --include="*.ts" --include="*.tsx" .
```
Expected: only matches inside the files about to be deleted (and possibly inside themselves). If anything else references them, fix that first.

- [ ] **Step 2: Delete the files**

```bash
rm utils/googleSheetParser.ts
rm components/ProgressBar.tsx
rm components/ScorePanel.tsx
rm components/ReportModal.tsx
```

- [ ] **Step 3: Run tests + build**

Run: `npm test && npm run build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove dead quiz code (sheet parser, progress bar, report modal, score panel)"
git push origin development
```

---

## Task 13: Manual end-to-end verification

No code changes. This task is the success-criteria check from spec §10.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: frontend on `http://localhost:3000`, backend on `:4000`.

- [ ] **Step 2: Verify viewport widths in DevTools**

Open DevTools → Device toolbar. Test at:

- iPhone SE (375 × 667)
- iPad (768 × 1024)
- Desktop (1280 × 800)

For each viewport, check:
- No horizontal scroll on any screen.
- WelcomeScreen is centered with comfortable padding.
- SelectionScreen card stays readable (not too wide on desktop).
- PhotoScreen camera preview not stretched.
- ResultScreen text wraps naturally.

- [ ] **Step 3: Run the full happy path on phone viewport**

1. Type a name → "Let's start!" enabled.
2. Pick a job (e.g. tap through the carousel to "doctor", click CTA).
3. Allow camera permission, take a photo, confirm.
4. Wait for "Saving your answer…" to disappear.
5. ResultScreen shows: heading "I want to be a doctor and help sick people.", Gemini description, polling indicator.
6. Wait up to 60s — `ProcessingStatus` renders the AI portrait when n8n finishes.

- [ ] **Step 4: Verify Airtable record has the right shape**

In the Airtable Students table, find the new record. Confirm:
- `學生姓名` = the typed name.
- `班級` is empty.
- `推薦職業` = "Doctor" (or whichever displayName matches the picked job).
- `問卷分數` JSON contains `{ "doctor": 1 }`.
- `AI職業描述` is populated with the Gemini text.
- `處理狀態` advances to `完成`.
- `結果URL` populated when n8n finishes.

- [ ] **Step 5: Verify accessibility quick-check**

In DevTools → Lighthouse:
- Run an Accessibility audit on each screen.
- Target: ≥ 90 per spec §10.
- Common issues to fix on the spot: missing `aria-label`, color contrast, missing form `label for=`.

Spot-check `prefers-reduced-motion`: in DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" → confirm wiggle on the CTA stops.

- [ ] **Step 6: Verify no emojis**

Run:
```bash
grep -rn -P "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" components/ src/ index.html 2>/dev/null
```
Expected: no matches inside the new code (the spec forbids emoji as icons).

- [ ] **Step 7: Sanity check no leftover references**

```bash
grep -rn "googleSheetParser\|optionJobMap\|QuizData" components/ src/ utils/ 2>/dev/null
```
Expected: no matches.

- [ ] **Step 8: Commit any small fixes from this verification**

If steps 2–6 surfaced issues, fix them in small focused commits. If everything passed, no commit needed for this task.

---

## Out-of-band caveats the implementer should know

- **`vite.config.ts` define-leak of `GEMINI_API_KEY`** is a separate, pre-existing security issue (documented in `Documentation/Security/SECURITY_AUDIT_2025-10-14.md`). Not in scope for this plan, but if the implementer notices it during work, mention it back to the user — don't silently fix.
- **`importmap` in `index.html`** maps React + `@google/genai` to a CDN. Vite still bundles its own React because it's installed in `package.json`. The importmap is harmless but legacy. Leave it alone in this plan; removing it is a separate cleanup.
- **Backend route `submit-questionnaire` accepts `recommendedJobs` as a string.** The plan sends `Job.displayName` (e.g. `"Doctor"`). If the implementer finds the route concatenates with `" / "`, that's only a concern with multiple jobs; single-job submission is unaffected.
- **No CI pipeline** runs these tests automatically. Tests have to be run locally before each commit. If the user later sets up GitHub Actions, this plan's tests should drop straight in.
