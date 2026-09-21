# Quiz Redesign (Elementary) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the elementary-school 10-question quiz (Google-Sheet-driven, scored recommendation, AI portrait) on top of the kindergarten Claymorphism codebase, on branch `quiz`.

**Architecture:** React 19 + Vite 6 + Tailwind SPA with a 5-state machine (`Loading → Start → Quiz → Submitting → Results`). Quiz content is fetched client-side from the existing public Google Sheet (ported parser). `computeScores` maps chosen option ids to job ids and picks the top job(s). Existing `CameraCapture` and `ProcessingStatus` are reused unchanged except for one button label. The only backend edit is the Gemini fallback sentence, which no longer depends on the deleted kindergarten job constant.

**Tech Stack:** React 19, TypeScript ~5.8, Vite 6, TailwindCSS 3.4, lucide-react 0.460, Vitest 1.6 + @testing-library/react 16 + @testing-library/user-event 14 + jsdom (all already installed). Express 5 via `tsx` for the backend.

**Spec:** `docs/superpowers/specs/2026-09-21-quiz-redesign-design.md` (commit `6a39255`)

## Global Constraints

- Work on branch `quiz` only. After every commit: `git push origin quiz`.
- Commit messages: `<type>: <description>` (feat / fix / refactor / docs / test / chore). No AI attribution trailer.
- Google Sheet id `1E5eZFKRqsm2mR6WwldrkMP_-yyTqPfU5HOnRI9z7sl0`, sheet names `Questions`, `Options`, `Jobs`, `OptionJobMap`, and their column headers (`question_id`, `text`, `order`; `option_id`, `text`, `question_id`, `image_url`; `job_id`, `job_name`; `option_id`, `job_id`) stay exactly as they are.
- Request and response bodies of `/api/upload`, `/api/generate-description`, `/api/submit-questionnaire`, `/api/check-status/:recordId` are unchanged.
- `/api/upload` rejects `studentName` or `studentClass` shorter than 2 characters after trim. The Start screen must enforce `>= 2` on both.
- Visual language: existing `clay-*` Tailwind tokens, `rounded-clay`, `shadow-clay`, `font-heading` (Baloo 2), `font-body` (Comic Neue), Lucide icons only. No emoji as icons.
- All UI text in English.
- Every animation must be neutralised under `@media (prefers-reduced-motion: reduce)` in `src/styles/clay.css`.
- Every interactive element gets the global 3 px `:focus-visible` ring (already in `clay.css`; do not override it with `focus:outline-none`).
- Components live in repo-root `components/`, app entry and types in `src/`, utilities in `utils/`, config in `config/`. Never create files in the repo root.
- Server imports inside `server/` use `.js` suffixes on `.ts` sources (Node ESM). Dropping the suffix crashes the server.
- Node 22 is the pinned runtime (local Node 26 also works). If Vitest ever hangs at worker startup with "Timeout calling fetch /@vite/env", it is a cold module cache on this machine: run `npx vitest run --poolOptions.threads.singleThread` once to warm it, then run normally. Do not change vitest config to work around it.
- Legacy files are expected to be red mid-plan: from Task 3 until Task 11 the old `PhotoScreen`, `QuizScreen`, `ResultsScreen` and `App` tests fail because their subjects are rewritten in later tasks. Run only the test files your task names; the full suite must be green at Task 11 Step 5.

---

## Background the implementer needs

### Repo layout

```
components/        React components (root-level, NOT src/components)
src/App.tsx        state machine
src/types.ts       shared types
src/data/          static presentation data
src/styles/clay.css
utils/             api client, parser, scoring
config/            api.ts (getApiUrl), quiz.ts (new: sheet id)
server/            Express, run via tsx
```

Tests sit next to their subject: `components/Foo.test.tsx`, `utils/foo.test.ts`, `src/App.test.tsx`. Vitest config: `vitest.config.ts` (jsdom, globals, setup `src/test/setup.ts` which loads jest-dom matchers). Run one file with `npx vitest run path/to/file.test.tsx`.

### What is being deleted from the kindergarten base

| File | Why |
|---|---|
| `src/data/jobs.ts`, `src/data/jobs.test.ts` | 11-job constant is kindergarten-only |
| `components/PhotoScreen.tsx`, `components/PhotoScreen.test.tsx` | photo moves into Start |
| `components/QuizScreen.test.tsx` (carousel tests) | replaced by new tests in Task 7 |
| `utils/scoring.test.ts` (single-pick tests) | replaced in Task 3 |

### Existing gviz response shape (what the parser consumes)

`GET https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:json&sheet=<name>&headers=1` returns JSONP text:

```
/*O_o*/
google.visualization.Query.setResponse({"version":"0.6","reqId":"0","status":"ok","sig":"…","table":{"cols":[{"id":"A","label":"job_id","type":"string"},{"id":"B","label":"job_name","type":"string"},{"id":"C","label":"","type":"string"}],"rows":[{"c":[{"v":"t"},{"v":"Teacher"},null]}]}});
```

Empty-label columns exist and must be ignored. Cells can be `null`.

### Live data (2026-09-21)

Jobs sheet: `t` Teacher, `l` Librarian, `do` Doctor, `de` Dentist, `f` Fire Fighter, `b` Builder, `p` Police Officer, `mc` Mail Carrier, `dd` Food Delivery Driver, `a` Ambulance Driver, `n` Nurse, `me` Mechanic, `r` Refuse Collector. 10 questions, 4 options each, every option has an `image_url`.

### Backend contracts (copy exactly)

```ts
// POST /api/upload            (done inside CameraCapture — do not touch)
// POST /api/generate-description
{ studentName: string, topJobs: {job_id,job_name}[], sortedScores: {job_id,job_name,score}[] }
→ { success: true, description: string, fallback?: boolean }

// POST /api/submit-questionnaire   (utils/api.ts submitQuestionnaire)
{ recordId, studentName, studentClass, answers: string[], recommendedJobs: string,
  scores: Record<string, number>, geminiDescription?: string }
→ { success: boolean, recommendedJobs?: string, message?: string }
```

---

## File structure

| Path | Responsibility | Task |
|---|---|---|
| `config/quiz.ts` | `SPREADSHEET_ID` constant | 1 |
| `src/types.ts` | `GameState` (5 states) + quiz domain types + API types | 1 |
| `utils/googleSheetParser.ts` | fetch 4 sheets, build `QuizData` | 2 |
| `utils/scoring.ts` | `computeScores` | 3 |
| `src/data/jobIcons.ts` | job_id → Lucide icon name, with default | 4 |
| `server/utils/fallbackDescription.ts` | pure fallback sentence builder | 5 |
| `server/routes/gemini.ts` | uses the builder; no other change | 5 |
| `tailwind.config.js`, `src/styles/clay.css` | `slide-out` animation + reduced-motion | 6 |
| `components/OptionCard.tsx` | one option, image with text fallback | 6 |
| `components/QuizScreen.tsx` | header/progress, 2×2 grid, Back | 7 |
| `components/StartScreen.tsx` | name + class + camera + Start CTA | 8 |
| `components/BusyScreen.tsx` | spinner / error+retry screen used for Loading and Submitting | 9 |
| `components/ProcessingStatus.tsx` | relabel overlay button "Next student" | 10 |
| `components/ResultsScreen.tsx` | heading, job cards, description, portrait, Next student | 10 |
| `src/App.tsx` | state machine, fetch, scoring/submit pipeline | 11 |
| `CLAUDE.md`, `README.md`, `CHANGELOG.md` | docs for the quiz line | 12 |

---

### Task 1: Types and quiz config

**Files:**
- Create: `config/quiz.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `SPREADSHEET_ID: string`; `GameState` enum with `Loading | Start | Quiz | Submitting | Results`; `Choice`, `Question`, `Job`, `OptionJobMapItem`, `QuizData`, `ScoringResults`, `ScoreEntry`, and the unchanged API types.

- [ ] **Step 1: Create the config constant**

`config/quiz.ts`:

```ts
/** Public Google Sheet that holds Questions / Options / Jobs / OptionJobMap. */
export const SPREADSHEET_ID = '1E5eZFKRqsm2mR6WwldrkMP_-yyTqPfU5HOnRI9z7sl0';
```

- [ ] **Step 2: Rewrite `src/types.ts`**

Replace the whole file with:

```ts
export enum GameState {
    Loading = 'loading',
    Start = 'start',
    Quiz = 'quiz',
    Submitting = 'submitting',
    Results = 'results',
}

// ---- Quiz content (from Google Sheet) ----
export interface Choice {
    id: string;
    text: string;
    imageUrl?: string;
}

export interface Question {
    id: string;
    text: string;
    choices: Choice[];
}

export interface Job {
    id: string;
    name: string;
}

export interface OptionJobMapItem {
    option_id: string;
    job_id: string;
}

export interface QuizData {
    questions: Question[];
    jobs: Job[];
    optionJobMap: OptionJobMapItem[];
}

// ---- Scoring ----
export interface ScoreEntry {
    job_id: string;
    job_name: string;
    score: number;
}

export interface TopJob {
    job_id: string;
    job_name: string;
}

export interface ScoringResults {
    /** job_name → score, for QuestionnaireSubmission.scores */
    counts: Record<string, number>;
    topJobs: TopJob[];
    sortedScores: ScoreEntry[];
}

// ---- API (unchanged contracts) ----
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
```

- [ ] **Step 3: Type-check (expected to fail elsewhere, but this file must be clean)**

Run: `npx tsc --noEmit 2>&1 | grep -c 'src/types.ts'`
Expected: `0` (other files will error until later tasks; ignore them here).

- [ ] **Step 4: Commit**

```bash
git add config/quiz.ts src/types.ts
git commit -m "feat(types): quiz GameState and sheet-driven domain types"
git push origin quiz
```

---

### Task 2: Port the Google Sheet parser

**Files:**
- Create: `utils/googleSheetParser.ts`
- Test: `utils/googleSheetParser.test.ts`

**Interfaces:**
- Consumes: `SPREADSHEET_ID` from `config/quiz.ts`; types from Task 1.
- Produces: `getQuizData(): Promise<QuizData>`; `fetchSheetData(sheetName: string): Promise<Record<string, unknown>[]>` (exported for tests).

- [ ] **Step 1: Write the failing tests**

`utils/googleSheetParser.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getQuizData, fetchSheetData } from './googleSheetParser';

function gviz(cols: string[], rows: (string | number | null)[][]): string {
  const body = JSON.stringify({
    version: '0.6',
    status: 'ok',
    table: {
      cols: cols.map((label, i) => ({ id: String.fromCharCode(65 + i), label, type: 'string' })),
      rows: rows.map((r) => ({ c: r.map((v) => (v === null ? null : { v })) })),
    },
  });
  return `/*O_o*/\ngoogle.visualization.Query.setResponse(${body});`;
}

const SHEETS: Record<string, string> = {
  Questions: gviz(['question_id', 'text', 'order', ''], [
    ['q2', 'Second?', 2, null],
    ['q1', 'First?', 1, null],
  ]),
  Options: gviz(['option_id', 'text', 'question_id', 'image_url'], [
    ['q1_A', 'Inside', 'q1', 'https://x/a.jpg'],
    ['q1_B', 'Outside', 'q1', null],
    ['q2_A', 'Kids', 'q2', 'https://x/c.jpg'],
  ]),
  Jobs: gviz(['job_id', 'job_name', ''], [
    ['t', 'Teacher', null],
    ['n', 'Nurse', null],
  ]),
  OptionJobMap: gviz(['option_id', 'job_id'], [
    ['q1_A', 't'],
    ['q1_B', 'n'],
    ['q2_A', 't'],
  ]),
};

function mockFetch(responder: (url: string) => string) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    text: async () => responder(url),
  })));
}

beforeEach(() => {
  mockFetch((url) => {
    const name = decodeURIComponent(url.match(/sheet=([^&]+)/)?.[1] ?? '');
    return SHEETS[name] ?? '';
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSheetData', () => {
  it('turns gviz JSONP into row objects keyed by trimmed header, ignoring empty headers', async () => {
    const rows = await fetchSheetData('Jobs');
    expect(rows).toEqual([
      { job_id: 't', job_name: 'Teacher' },
      { job_id: 'n', job_name: 'Nurse' },
    ]);
  });

  it('returns [] for an empty sheet', async () => {
    mockFetch(() => gviz([], []));
    expect(await fetchSheetData('Jobs')).toEqual([]);
  });

  it('throws a readable error when the sheet is not published', async () => {
    mockFetch(() => '<html>access_denied</html>');
    await expect(fetchSheetData('Jobs')).rejects.toThrow(/publish to web/i);
  });
});

describe('getQuizData', () => {
  it('builds questions sorted by order, with their choices', async () => {
    const data = await getQuizData();
    expect(data.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
    expect(data.questions[0].choices).toEqual([
      { id: 'q1_A', text: 'Inside', imageUrl: 'https://x/a.jpg' },
      { id: 'q1_B', text: 'Outside', imageUrl: undefined },
    ]);
  });

  it('returns jobs and optionJobMap', async () => {
    const data = await getQuizData();
    expect(data.jobs).toEqual([{ id: 't', name: 'Teacher' }, { id: 'n', name: 'Nurse' }]);
    expect(data.optionJobMap).toHaveLength(3);
  });

  it('matches headers case-insensitively', async () => {
    mockFetch((url) => {
      if (url.includes('sheet=Jobs')) return gviz(['JOB_ID', 'Job_Name'], [['t', 'Teacher']]);
      const name = decodeURIComponent(url.match(/sheet=([^&]+)/)?.[1] ?? '');
      return SHEETS[name];
    });
    const data = await getQuizData();
    expect(data.jobs).toEqual([{ id: 't', name: 'Teacher' }]);
  });

  it('throws when Questions sheet is empty', async () => {
    mockFetch((url) => (url.includes('sheet=Questions') ? gviz([], []) : SHEETS.Options));
    await expect(getQuizData()).rejects.toThrow(/Questions/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run utils/googleSheetParser.test.ts`
Expected: FAIL — cannot resolve `./googleSheetParser`.

- [ ] **Step 3: Write the parser**

`utils/googleSheetParser.ts` (ported from `quiz-version` @ `7ee8469`, debug helpers dropped, `Job` narrowed to id + name, `icon` dropped from `Choice`):

```ts
import { QuizData, Question, Choice, Job, OptionJobMapItem } from '../src/types';
import { SPREADSHEET_ID } from '../config/quiz';

type Row = Record<string, unknown>;

function getValueCaseInsensitive<T = unknown>(obj: Row, key: string): T | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const keyToFind = key.toLowerCase();
    const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === keyToFind);
    return foundKey ? (obj[foundKey] as T) : undefined;
}

function sheetUrl(sheetName: string): string {
    const timestamp = Date.now();
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&headers=1&t=${timestamp}`;
}

/** Fetch one sheet via the gviz endpoint and return one object per non-empty row. */
export async function fetchSheetData(sheetName: string): Promise<Row[]> {
    const res = await fetch(sheetUrl(sheetName));
    // gviz returns error details in the body on 4xx, so do not throw on !res.ok
    const text = await res.text();

    const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s)?.[1];
    if (!jsonString) {
        if (text.includes('access_denied')) {
            throw new Error(`Could not access Google Sheet "${sheetName}". Please make sure your spreadsheet is public by going to "File" > "Share" > "Publish to web" in Google Sheets.`);
        }
        if (text.toLowerCase().includes('invalid sheet name')) {
            throw new Error(`Could not find a sheet named "${sheetName}". Please check for typos or case-sensitivity (e.g., "Options" vs "options").`);
        }
        throw new Error(`Invalid response for sheet "${sheetName}". Please check if the sheet name is correct and the spreadsheet is published to the web.`);
    }

    const data = JSON.parse(jsonString);

    if (data.status === 'error') {
        const errorMessage: string = data.errors?.[0]?.detailed_message || `An error occurred while loading sheet "${sheetName}".`;
        if (errorMessage.toLowerCase().includes('invalid sheet name')) {
            throw new Error(`Could not find a sheet named "${sheetName}". Please check for typos or case-sensitivity (e.g., "Options" vs "options").`);
        }
        throw new Error(errorMessage);
    }

    if (!data.table || !data.table.cols || data.table.cols.length === 0 || !data.table.rows) {
        return [];
    }

    const headers: string[] = data.table.cols.map((col: { label?: string }) => String(col.label || '').trim());
    const rows: Row[] = (data.table.rows || []).map((row: { c?: ({ v?: unknown } | null)[] }) => {
        const rowData: Row = {};
        (row.c || []).forEach((cell, index) => {
            const header = headers[index];
            if (header) {
                rowData[header] = cell?.v ?? null;
            }
        });
        return rowData;
    });
    return rows.filter((r) => Object.values(r).some((val) => val !== null && val !== ''));
}

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/** Fetch all four sheets and assemble the quiz. Throws readable errors for teacher-fixable problems. */
export async function getQuizData(): Promise<QuizData> {
    const [rawQuestions, rawOptions, rawJobs, rawOptionJobMap] = await Promise.all([
        fetchSheetData('Questions'),
        fetchSheetData('Options'),
        fetchSheetData('Jobs'),
        fetchSheetData('OptionJobMap'),
    ]);

    const sheetIdError = (sheetName: string) =>
        `Failed to load any data from the '${sheetName}' sheet in the spreadsheet with ID: '${SPREADSHEET_ID}'. Please verify: 1. The sheet is named '${sheetName}' (case matters). 2. The sheet contains data.`;

    if (rawQuestions.length === 0) throw new Error(sheetIdError('Questions'));
    if (rawOptions.length === 0) throw new Error(sheetIdError('Options'));

    const jobs: Job[] = rawJobs
        .map((j) => ({
            id: str(getValueCaseInsensitive(j, 'job_id')).trim(),
            name: str(getValueCaseInsensitive(j, 'job_name')),
        }))
        .filter((j) => j.id);

    const optionJobMap: OptionJobMapItem[] = rawOptionJobMap
        .map((m) => ({
            option_id: str(getValueCaseInsensitive(m, 'option_id')).trim(),
            job_id: str(getValueCaseInsensitive(m, 'job_id')).trim(),
        }))
        .filter((m) => m.option_id && m.job_id);

    const optionsByQuestion = rawOptions.reduce<Record<string, Choice[]>>((acc, opt) => {
        const qId = str(getValueCaseInsensitive(opt, 'question_id')).trim();
        const optionId = str(getValueCaseInsensitive(opt, 'option_id')).trim();
        if (qId && optionId) {
            if (!acc[qId]) acc[qId] = [];
            const choiceText =
                getValueCaseInsensitive<string>(opt, 'option_text') ??
                getValueCaseInsensitive<string>(opt, 'text') ??
                '';
            const imageUrl = getValueCaseInsensitive<string | null>(opt, 'image_url');
            acc[qId].push({
                id: optionId,
                text: str(choiceText),
                imageUrl: imageUrl ? String(imageUrl) : undefined,
            });
        }
        return acc;
    }, {});

    const questions: Question[] = rawQuestions
        .slice()
        .sort((a, b) => Number(getValueCaseInsensitive(a, 'order')) - Number(getValueCaseInsensitive(b, 'order')))
        .map((q) => {
            const qId = str(getValueCaseInsensitive(q, 'question_id')).trim();
            return { id: qId, text: str(getValueCaseInsensitive(q, 'text')), choices: optionsByQuestion[qId] || [] };
        })
        .filter((q) => q.id)
        .filter((q) => q.choices.length > 0);

    if (questions.length === 0) {
        const questionIds = [...new Set(rawQuestions.map((q) => str(getValueCaseInsensitive(q, 'question_id')).trim()))].filter(Boolean);
        const optionQuestionIds = [...new Set(rawOptions.map((o) => str(getValueCaseInsensitive(o, 'question_id')).trim()))].filter(Boolean);
        throw new Error(
            `Failed to link questions to answers. IDs in 'Questions': [${questionIds.join(', ')}]. ` +
            `Linking IDs in 'Options': [${optionQuestionIds.join(', ')}]. ` +
            `At least one ID must match exactly, and the 'Options' sheet needs a 'question_id' column.`,
        );
    }

    return { questions, jobs, optionJobMap };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run utils/googleSheetParser.test.ts`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add utils/googleSheetParser.ts utils/googleSheetParser.test.ts
git commit -m "feat(data): port Google Sheet quiz parser with tests"
git push origin quiz
```

---

### Task 3: Scoring

**Files:**
- Modify: `utils/scoring.ts` (full rewrite)
- Modify: `utils/scoring.test.ts` (full rewrite)

**Interfaces:**
- Consumes: `Job`, `OptionJobMapItem`, `ScoringResults` from Task 1.
- Produces: `computeScores(selectedOptionIds: string[], jobs: Job[], optionJobMap: OptionJobMapItem[]): ScoringResults`.

- [ ] **Step 1: Replace the test file**

`utils/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeScores } from './scoring';

const jobs = [
  { id: 't', name: 'Teacher' },
  { id: 'n', name: 'Nurse' },
  { id: 'f', name: 'Fire Fighter' },
];
const map = [
  { option_id: 'q1_A', job_id: 't' },
  { option_id: 'q1_A', job_id: 'n' },
  { option_id: 'q1_B', job_id: 'f' },
  { option_id: 'q2_A', job_id: 't' },
];

describe('computeScores', () => {
  it('picks the single highest-scoring job', () => {
    const r = computeScores(['q1_A', 'q2_A'], jobs, map);
    expect(r.topJobs).toEqual([{ job_id: 't', job_name: 'Teacher' }]);
    expect(r.counts).toEqual({ Teacher: 2, Nurse: 1 });
    expect(r.sortedScores[0]).toEqual({ job_id: 't', job_name: 'Teacher', score: 2 });
  });

  it('returns every tied job on a tie', () => {
    const r = computeScores(['q1_A'], jobs, map);
    expect(r.topJobs.map((j) => j.job_id).sort()).toEqual(['n', 't']);
  });

  it('ignores option ids that are not in the map', () => {
    const r = computeScores(['nope', 'q1_B'], jobs, map);
    expect(r.topJobs).toEqual([{ job_id: 'f', job_name: 'Fire Fighter' }]);
  });

  it('returns empty results when nothing was answered', () => {
    expect(computeScores([], jobs, map)).toEqual({ counts: {}, topJobs: [], sortedScores: [] });
  });

  it('labels unknown job ids instead of crashing', () => {
    const r = computeScores(['q1_B'], [], map);
    expect(r.topJobs[0].job_name).toMatch(/unknown job \(f\)/i);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run utils/scoring.test.ts`
Expected: FAIL — `computeScores` is not exported.

- [ ] **Step 3: Rewrite `utils/scoring.ts`**

```ts
import { Job, OptionJobMapItem, ScoringResults, ScoreEntry, TopJob } from '../src/types';

/**
 * Count one point per (chosen option → job) mapping and return the top job(s).
 * Ported from v1.1.0; output shape feeds /api/generate-description and /api/submit-questionnaire.
 */
export function computeScores(
    selectedOptionIds: string[],
    jobs: Job[],
    optionJobMap: OptionJobMapItem[],
): ScoringResults {
    const optToJobs = optionJobMap.reduce<Record<string, string[]>>((acc, item) => {
        (acc[item.option_id] ??= []).push(item.job_id);
        return acc;
    }, {});

    const countsById: Record<string, number> = {};
    for (const optionId of selectedOptionIds) {
        for (const jobId of optToJobs[optionId] ?? []) {
            countsById[jobId] = (countsById[jobId] ?? 0) + 1;
        }
    }

    const entries = Object.entries(countsById);
    if (entries.length === 0) {
        return { counts: {}, topJobs: [], sortedScores: [] };
    }

    const idToName = Object.fromEntries(jobs.map((j) => [j.id, j.name]));
    const nameOf = (jobId: string) => idToName[jobId] ?? `Unknown Job (${jobId})`;

    const sortedScores: ScoreEntry[] = entries
        .map(([job_id, score]) => ({ job_id, job_name: nameOf(job_id), score }))
        .sort((a, b) => b.score - a.score);

    const maxScore = sortedScores[0].score;
    const topJobs: TopJob[] = sortedScores
        .filter((s) => s.score === maxScore)
        .map(({ job_id, job_name }) => ({ job_id, job_name }));

    const counts = Object.fromEntries(sortedScores.map((s) => [s.job_name, s.score]));

    return { counts, topJobs, sortedScores };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run utils/scoring.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add utils/scoring.ts utils/scoring.test.ts
git commit -m "feat(scoring): restore computeScores for multi-question quiz"
git push origin quiz
```

---

### Task 4: Job icon map

**Files:**
- Create: `src/data/jobIcons.ts`
- Test: `src/data/jobIcons.test.ts`

**Interfaces:**
- Produces: `getJobIconName(jobId: string): string` returning a `lucide-react` export name; `DEFAULT_JOB_ICON = 'Briefcase'`.

- [ ] **Step 1: Write the failing test**

`src/data/jobIcons.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import * as LucideIcons from 'lucide-react';
import { getJobIconName, JOB_ICONS, DEFAULT_JOB_ICON } from './jobIcons';

describe('jobIcons', () => {
  it('maps every known sheet job id to a real Lucide icon', () => {
    for (const [jobId, iconName] of Object.entries(JOB_ICONS)) {
      expect((LucideIcons as Record<string, unknown>)[iconName], `${jobId} → ${iconName}`).toBeDefined();
    }
  });

  it('covers the 13 ids currently in the sheet', () => {
    expect(Object.keys(JOB_ICONS).sort()).toEqual(
      ['a', 'b', 'dd', 'de', 'do', 'f', 'l', 'mc', 'me', 'n', 'p', 'r', 't'].sort(),
    );
  });

  it('falls back to the default icon for unknown ids', () => {
    expect(getJobIconName('zzz')).toBe(DEFAULT_JOB_ICON);
    expect((LucideIcons as Record<string, unknown>)[DEFAULT_JOB_ICON]).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/jobIcons.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the map**

`src/data/jobIcons.ts`:

```ts
/**
 * Presentation-only: job_id (from the Jobs sheet) → lucide-react icon export name.
 * Unknown ids get DEFAULT_JOB_ICON so a new sheet row never breaks the UI.
 */
export const DEFAULT_JOB_ICON = 'Briefcase';

export const JOB_ICONS: Record<string, string> = {
    t: 'GraduationCap',   // Teacher
    l: 'BookOpen',        // Librarian
    do: 'Stethoscope',    // Doctor
    de: 'Smile',          // Dentist
    f: 'Flame',           // Fire Fighter
    b: 'Hammer',          // Builder
    p: 'Shield',          // Police Officer
    mc: 'Mail',           // Mail Carrier
    dd: 'Bike',           // Food Delivery Driver
    a: 'Ambulance',       // Ambulance Driver
    n: 'HeartPulse',      // Nurse
    me: 'Wrench',         // Mechanic
    r: 'Trash2',          // Refuse Collector
};

export function getJobIconName(jobId: string): string {
    return JOB_ICONS[jobId] ?? DEFAULT_JOB_ICON;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/data/jobIcons.test.ts`
Expected: 3 passed. If an icon name is missing in lucide-react 0.460, swap it for one that exists (check with `node -e "console.log(Object.keys(require('lucide-react')).filter(k=>/Ambul|Bike|Hammer/.test(k)))"`) and keep the test green.

- [ ] **Step 5: Commit**

```bash
git add src/data/jobIcons.ts src/data/jobIcons.test.ts
git commit -m "feat(data): job_id to Lucide icon map with default"
git push origin quiz
```

---

### Task 5: Backend fallback no longer depends on the kindergarten job list

**Files:**
- Create: `server/utils/fallbackDescription.ts`
- Test: `server/utils/fallbackDescription.test.ts`
- Modify: `server/routes/gemini.ts`
- Delete: `src/data/jobs.ts`, `src/data/jobs.test.ts`

**Interfaces:**
- Produces: `buildFallbackDescription(studentName: string | undefined, topJobs: { job_name: string }[] | undefined): string`.

- [ ] **Step 1: Write the failing test**

`server/utils/fallbackDescription.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildFallbackDescription } from './fallbackDescription';

describe('buildFallbackDescription', () => {
  it('uses the top job name and the student name', () => {
    const s = buildFallbackDescription('Mia', [{ job_name: 'Teacher' }]);
    expect(s).toBe('Teacher — a great choice! Mia, you can grow up to help people every day.');
  });

  it('works without a student name', () => {
    expect(buildFallbackDescription(undefined, [{ job_name: 'Nurse' }]))
      .toBe('Nurse — a great choice! You can grow up to help people every day.');
  });

  it('has a generic sentence when there is no top job', () => {
    expect(buildFallbackDescription('Mia', [])).toMatch(/many different jobs/i);
    expect(buildFallbackDescription('Mia', undefined)).toMatch(/many different jobs/i);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run server/utils/fallbackDescription.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the builder**

`server/utils/fallbackDescription.ts`:

```ts
/** Used when Gemini is unavailable. Pure, no imports, so it is trivially testable. */
export function buildFallbackDescription(
    studentName: string | undefined,
    topJobs: { job_name: string }[] | undefined,
): string {
    const job = topJobs?.[0]?.job_name;
    if (!job) {
        return 'You could be great at many different jobs! Keep exploring what you enjoy.';
    }
    const who = studentName?.trim() ? `${studentName.trim()}, you` : 'You';
    return `${job} — a great choice! ${who} can grow up to help people every day.`;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run server/utils/fallbackDescription.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Wire it into the route**

In `server/routes/gemini.ts`:

1. Replace `import { JOBS } from '../../src/data/jobs.js';` with `import { buildFallbackDescription } from '../utils/fallbackDescription.js';`
2. Delete the `SONG_LYRICS`, `SONG_OUTRO`, `SONG_INTRO` constants and the `songFallback` function (lines 17–31 in the current file, from the `// Echo back…` comment through the closing `}` of `songFallback`).
3. Replace the two calls `songFallback(topJobs)` and `songFallback(req.body?.topJobs)` with `buildFallbackDescription(studentName, topJobs)` and `buildFallbackDescription(req.body?.studentName, req.body?.topJobs)` respectively.
4. Update the two comments that mention "song-lyric fallback" / "歌詞 fallback" to say "generic fallback".

Nothing else in the file changes.

- [ ] **Step 6: Delete the kindergarten job constant**

```bash
git rm src/data/jobs.ts src/data/jobs.test.ts
```

- [ ] **Step 7: Verify the server boots**

Run: `timeout 8 npx tsx server/index.ts; echo "exit=$?"`
Expected: log lines showing the server listening on port 4000, then `exit=124` (killed by timeout). Any `ERR_MODULE_NOT_FOUND` means a `.js` suffix or path is wrong.

- [ ] **Step 8: Commit**

```bash
git add server/utils/fallbackDescription.ts server/utils/fallbackDescription.test.ts server/routes/gemini.ts
git commit -m "refactor(server): generic Gemini fallback, drop kindergarten job constant"
git push origin quiz
```

---

### Task 6: Slide-out animation and OptionCard

**Files:**
- Modify: `tailwind.config.js` (keyframes + animation)
- Modify: `src/styles/clay.css` (reduced-motion list)
- Create: `components/OptionCard.tsx`
- Test: `components/OptionCard.test.tsx`

**Interfaces:**
- Consumes: `Choice` from Task 1.
- Produces: `<OptionCard choice index onSelect />` with `OptionCardProps { choice: Choice; index: number; onSelect: (optionId: string) => void }`. Renders a `<button>` whose accessible name is the choice text.

- [ ] **Step 1: Add the animation tokens**

In `tailwind.config.js` inside `keyframes` add:

```js
        'slide-out': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-40px)' },
        },
```

and inside `animation` add:

```js
        'slide-out': 'slide-out 200ms ease-in forwards',
```

In `src/styles/clay.css`, change the reduced-motion selector list to:

```css
  .animate-wiggle,
  .animate-slide-in-right,
  .animate-slide-in-left,
  .animate-slide-out {
    animation: none !important;
  }
```

- [ ] **Step 2: Write the failing tests**

`components/OptionCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionCard from './OptionCard';

const choice = { id: 'q1_A', text: 'Inside', imageUrl: 'https://x/a.jpg' };

describe('OptionCard', () => {
  it('renders the image and the text', () => {
    render(<OptionCard choice={choice} index={0} onSelect={() => {}} />);
    expect(screen.getByRole('img', { name: 'Inside' })).toHaveAttribute('src', 'https://x/a.jpg');
    expect(screen.getByRole('button', { name: /inside/i })).toBeInTheDocument();
  });

  it('calls onSelect with the option id', async () => {
    const onSelect = vi.fn();
    render(<OptionCard choice={choice} index={0} onSelect={onSelect} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /inside/i }));
    expect(onSelect).toHaveBeenCalledWith('q1_A');
  });

  it('swaps to a text-only card when the image fails to load', () => {
    render(<OptionCard choice={choice} index={0} onSelect={() => {}} />);
    fireEvent.error(screen.getByRole('img', { name: 'Inside' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('option-text-fallback')).toHaveTextContent('Inside');
  });

  it('renders text-only when there is no imageUrl', () => {
    render(<OptionCard choice={{ id: 'q1_B', text: 'Outside' }} index={1} onSelect={() => {}} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('option-text-fallback')).toHaveTextContent('Outside');
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run components/OptionCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Create the component**

`components/OptionCard.tsx`:

```tsx
import React, { useState } from 'react';
import { Choice } from '../src/types';

export interface OptionCardProps {
    choice: Choice;
    index: number;
    onSelect: (optionId: string) => void;
}

/** Rotating clay backgrounds for text-only cards, picked by index % 4. */
const FALLBACK_BG = ['bg-orange-200', 'bg-amber-200', 'bg-yellow-200', 'bg-rose-200'];

const OptionCard: React.FC<OptionCardProps> = ({ choice, index, onSelect }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const showImage = Boolean(choice.imageUrl) && !imgFailed;

    return (
        <button
            type="button"
            onClick={() => onSelect(choice.id)}
            className="clay-press-fx w-full aspect-[4/3] rounded-clay shadow-clay bg-clay-surface overflow-hidden flex flex-col text-left hover:scale-[1.03] active:scale-[0.97] transition-transform motion-reduce:transform-none"
        >
            {showImage ? (
                <>
                    <img
                        src={choice.imageUrl}
                        alt={choice.text}
                        loading="eager"
                        onError={() => setImgFailed(true)}
                        className="w-full flex-1 min-h-0 object-cover"
                    />
                    <span className="block w-full px-3 py-2 bg-clay-bg text-clay-ink font-heading font-bold text-base md:text-lg text-center leading-tight">
                        {choice.text}
                    </span>
                </>
            ) : (
                <span
                    data-testid="option-text-fallback"
                    className={`flex-1 w-full flex items-center justify-center px-4 text-center font-heading font-bold text-clay-ink text-xl md:text-2xl leading-snug ${FALLBACK_BG[index % FALLBACK_BG.length]}`}
                >
                    {choice.text}
                </span>
            )}
        </button>
    );
};

export default OptionCard;
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run components/OptionCard.test.tsx`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js src/styles/clay.css components/OptionCard.tsx components/OptionCard.test.tsx
git commit -m "feat(ui): OptionCard with image fallback and slide-out animation"
git push origin quiz
```

---

### Task 7: QuizScreen (progress, 2×2 grid, Back)

**Files:**
- Modify: `components/QuizScreen.tsx` (full rewrite)
- Modify: `components/QuizScreen.test.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Question` from Task 1; `OptionCard` from Task 6.
- Produces: `QuizScreenProps { question: Question; questionIndex: number; totalQuestions: number; onSelectChoice: (optionId: string) => void; onBack: () => void }`.

- [ ] **Step 1: Replace the test file**

`components/QuizScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizScreen from './QuizScreen';

const question = {
  id: 'q3',
  text: 'What makes you most excited?',
  choices: [
    { id: 'q3_A', text: 'Helping', imageUrl: 'https://x/1.jpg' },
    { id: 'q3_B', text: 'Building' },
    { id: 'q3_C', text: 'Driving' },
    { id: 'q3_D', text: 'Fixing' },
  ],
};

function setup(overrides: Partial<React.ComponentProps<typeof QuizScreen>> = {}) {
  const props = {
    question,
    questionIndex: 2,
    totalQuestions: 10,
    onSelectChoice: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  };
  render(<QuizScreen {...props} />);
  return props;
}

describe('QuizScreen', () => {
  it('shows the question as the page heading and the progress text', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: /what makes you most excited/i })).toBeInTheDocument();
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument();
  });

  it('renders one indicator per question', () => {
    setup();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('renders all four options as buttons', () => {
    setup();
    for (const text of ['Helping', 'Building', 'Driving', 'Fixing']) {
      expect(screen.getByRole('button', { name: new RegExp(text, 'i') })).toBeInTheDocument();
    }
  });

  it('calls onSelectChoice with the option id', async () => {
    const props = setup();
    await userEvent.setup().click(screen.getByRole('button', { name: /building/i }));
    expect(props.onSelectChoice).toHaveBeenCalledWith('q3_B');
  });

  it('shows Back and calls onBack when not on the first question', async () => {
    const props = setup();
    await userEvent.setup().click(screen.getByRole('button', { name: /back/i }));
    expect(props.onBack).toHaveBeenCalled();
  });

  it('hides Back on the first question', () => {
    setup({ questionIndex: 0 });
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run components/QuizScreen.test.tsx`
Expected: FAIL — props mismatch / heading not found.

- [ ] **Step 3: Rewrite the component**

`components/QuizScreen.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Question } from '../src/types';
import OptionCard from './OptionCard';

export interface QuizScreenProps {
    question: Question;
    questionIndex: number;      // 0-based
    totalQuestions: number;
    onSelectChoice: (optionId: string) => void;
    onBack: () => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({
    question,
    questionIndex,
    totalQuestions,
    onSelectChoice,
    onBack,
}) => {
    const [leaving, setLeaving] = useState(false);

    // New question mounted → reset the leaving animation
    useEffect(() => {
        setLeaving(false);
    }, [question.id]);

    const handleSelect = (optionId: string) => {
        if (leaving) return;
        setLeaving(true);
        onSelectChoice(optionId);
    };

    const gridCols = question.choices.length === 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2';

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <header className="w-full max-w-md md:max-w-3xl text-center space-y-3">
                <p className="font-body font-bold text-clay-ink-soft text-base md:text-lg">
                    Question {questionIndex + 1} of {totalQuestions}
                </p>
                <ul className="flex items-center justify-center gap-2" aria-label="Quiz progress">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                        <li
                            key={i}
                            aria-label={`Question ${i + 1}${i === questionIndex ? ' (current)' : i < questionIndex ? ' (answered)' : ''}`}
                            className={`rounded-full transition-all ${
                                i === questionIndex
                                    ? 'w-6 h-2 bg-clay-primary'
                                    : i < questionIndex
                                    ? 'w-2 h-2 bg-clay-ink'
                                    : 'w-2 h-2 border-2 border-orange-300'
                            }`}
                        />
                    ))}
                </ul>
                <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug pt-2">
                    {question.text}
                </h1>
            </header>

            <section
                key={question.id}
                className={`w-full max-w-md md:max-w-3xl grid ${gridCols} gap-4 mt-6 ${leaving ? 'animate-slide-out' : 'animate-slide-in-right'}`}
            >
                {question.choices.map((choice, index) => (
                    <OptionCard key={choice.id} choice={choice} index={index} onSelect={handleSelect} />
                ))}
            </section>

            <nav className="w-full max-w-md md:max-w-3xl flex items-center justify-start mt-6">
                {questionIndex > 0 && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="clay-press-fx inline-flex items-center gap-2 rounded-full bg-clay-surface text-clay-ink font-heading font-bold shadow-clay px-5 py-3"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} aria-hidden />
                        Back
                    </button>
                )}
            </nav>
        </main>
    );
};

export default QuizScreen;
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/QuizScreen.test.tsx components/OptionCard.test.tsx`
Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add components/QuizScreen.tsx components/QuizScreen.test.tsx
git commit -m "feat(quiz): 2x2 option grid with progress dots and Back"
git push origin quiz
```

---

### Task 8: StartScreen (name + class + camera)

**Files:**
- Modify: `components/StartScreen.tsx` (full rewrite)
- Modify: `components/StartScreen.test.tsx` (full rewrite)

**Interfaces:**
- Consumes: `CameraCapture` (unchanged; props `studentName`, `studentClass`, `onSuccess(recordId, photoUrl)`, `onError?(msg)`).
- Produces: `StartScreenProps { onStart: (payload: { studentName: string; studentClass: string; recordId: string; photoUrl: string }) => void }`.

- [ ] **Step 1: Replace the test file**

`components/StartScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartScreen from './StartScreen';

vi.mock('./CameraCapture', () => ({
  default: ({ studentName, studentClass, onSuccess }: any) => (
    <button
      data-testid="mock-camera"
      onClick={() => onSuccess('rec_123', 'https://cdn/photo.jpg')}
    >
      camera for {studentName} / {studentClass}
    </button>
  ),
}));

async function fillNameAndClass(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/your name/i), 'Mia');
  await user.type(screen.getByLabelText(/your class/i), '3A');
}

describe('StartScreen', () => {
  it('renders the heading', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument();
  });

  it('does not show the camera until name and class are valid', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={() => {}} />);
    expect(screen.queryByTestId('mock-camera')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/your name/i), 'Mia');
    await user.type(screen.getByLabelText(/your class/i), '3');
    expect(screen.queryByTestId('mock-camera')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/your class/i), 'A');
    expect(screen.getByTestId('mock-camera')).toHaveTextContent('camera for Mia / 3A');
  });

  it('keeps Start disabled until a photo has been uploaded', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={() => {}} />);
    await fillNameAndClass(user);
    expect(screen.getByRole('button', { name: /start quiz/i })).toBeDisabled();
    await user.click(screen.getByTestId('mock-camera'));
    expect(screen.getByRole('button', { name: /start quiz/i })).toBeEnabled();
  });

  it('calls onStart with trimmed values and the upload result', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<StartScreen onStart={onStart} />);
    await user.type(screen.getByLabelText(/your name/i), '  Mia ');
    await user.type(screen.getByLabelText(/your class/i), ' 3A ');
    await user.click(screen.getByTestId('mock-camera'));
    await user.click(screen.getByRole('button', { name: /start quiz/i }));
    expect(onStart).toHaveBeenCalledWith({
      studentName: 'Mia',
      studentClass: '3A',
      recordId: 'rec_123',
      photoUrl: 'https://cdn/photo.jpg',
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run components/StartScreen.test.tsx`
Expected: FAIL — heading text / labels not found.

- [ ] **Step 3: Rewrite the component**

`components/StartScreen.tsx`:

```tsx
import React, { useState } from 'react';
import CameraCapture from './CameraCapture';

export interface StartPayload {
    studentName: string;
    studentClass: string;
    recordId: string;
    photoUrl: string;
}

interface StartScreenProps {
    onStart: (payload: StartPayload) => void;
}

/** /api/upload rejects either field shorter than 2 chars after trim. */
const MIN_LEN = 2;

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [upload, setUpload] = useState<{ recordId: string; photoUrl: string } | null>(null);

    const trimmedName = name.trim();
    const trimmedClass = studentClass.trim();
    const inputsValid = trimmedName.length >= MIN_LEN && trimmedClass.length >= MIN_LEN;
    const canStart = inputsValid && upload !== null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canStart || !upload) return;
        onStart({ studentName: trimmedName, studentClass: trimmedClass, ...upload });
    };

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md md:max-w-2xl">
                <div className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="font-heading font-bold text-clay-ink text-3xl md:text-4xl leading-tight">
                            What job is right for you?
                        </h1>
                        <p className="font-body text-clay-ink-soft mt-3 text-base md:text-lg">
                            Tell us who you are, take a photo, then answer 10 quick questions.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="start-name" className="block font-body font-bold text-clay-ink mb-2 text-base">
                                Your Name
                            </label>
                            <input
                                id="start-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-4 rounded-clay border-2 border-orange-200 bg-white text-clay-ink font-body text-lg shadow-clay focus:border-clay-primary"
                                placeholder="e.g. Mia"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label htmlFor="start-class" className="block font-body font-bold text-clay-ink mb-2 text-base">
                                Your Class
                            </label>
                            <input
                                id="start-class"
                                type="text"
                                value={studentClass}
                                onChange={(e) => setStudentClass(e.target.value)}
                                className="w-full px-5 py-4 rounded-clay border-2 border-orange-200 bg-white text-clay-ink font-body text-lg shadow-clay focus:border-clay-primary"
                                placeholder="e.g. 3A"
                                autoComplete="off"
                            />
                        </div>

                        {inputsValid ? (
                            <CameraCapture
                                studentName={trimmedName}
                                studentClass={trimmedClass}
                                onSuccess={(recordId, photoUrl) => setUpload({ recordId, photoUrl })}
                            />
                        ) : (
                            <p className="font-body text-clay-ink-soft text-center text-sm">
                                Type your name and class to unlock the camera.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!canStart}
                            className="clay-press-fx w-full rounded-full bg-clay-primary text-white font-heading font-bold text-xl py-5 shadow-clay hover:bg-clay-primary-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start quiz!
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default StartScreen;
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/StartScreen.test.tsx`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add components/StartScreen.tsx components/StartScreen.test.tsx
git commit -m "feat(start): name, class and live camera on the start screen"
git push origin quiz
```

---

### Task 9: BusyScreen (loading / submitting / error + retry)

**Files:**
- Create: `components/BusyScreen.tsx`
- Test: `components/BusyScreen.test.tsx`

**Interfaces:**
- Produces: `BusyScreenProps { title: string; subtitle?: string; error?: string | null; onRetry?: () => void }`. Shows a spinner while `error` is falsy; shows the error and a **Try again** button (calls `onRetry`) when `error` is set.

Spec §3.1 and §3.4 describe a Loading screen and a `SubmittingScreen`; this single component serves both with different copy.

- [ ] **Step 1: Write the failing test**

`components/BusyScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BusyScreen from './BusyScreen';

describe('BusyScreen', () => {
  it('shows a live status with the title while busy', () => {
    render(<BusyScreen title="Getting your quiz ready…" subtitle="One moment" />);
    expect(screen.getByRole('status')).toHaveTextContent('Getting your quiz ready…');
    expect(screen.getByText('One moment')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the error and a Try again button when error is set', async () => {
    const onRetry = vi.fn();
    render(<BusyScreen title="Loading" error="Sheet not published" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Sheet not published');
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run components/BusyScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the component**

`components/BusyScreen.tsx`:

```tsx
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export interface BusyScreenProps {
    title: string;
    subtitle?: string;
    error?: string | null;
    onRetry?: () => void;
}

const BusyScreen: React.FC<BusyScreenProps> = ({ title, subtitle, error, onRetry }) => (
    <main className="min-h-dvh w-full bg-clay-bg flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md md:max-w-xl">
            {error ? (
                <div role="alert" className="bg-clay-surface rounded-clay shadow-clay p-8 text-center space-y-4">
                    <AlertCircle size={56} strokeWidth={2.5} className="mx-auto text-clay-danger" aria-hidden />
                    <p className="font-heading font-bold text-clay-danger text-2xl">Hmm, that didn't work.</p>
                    <p className="font-body text-clay-ink-soft whitespace-pre-line">{error}</p>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="clay-press-fx rounded-full bg-clay-primary text-white font-heading font-bold py-4 px-8 shadow-clay hover:bg-clay-primary-press"
                        >
                            Try again
                        </button>
                    )}
                </div>
            ) : (
                <div role="status" aria-live="polite" className="bg-clay-surface rounded-clay shadow-clay p-8 text-center space-y-4">
                    <Loader2 size={64} strokeWidth={2.5} className="mx-auto text-clay-primary animate-spin" aria-hidden />
                    <p className="font-heading font-bold text-clay-ink text-2xl">{title}</p>
                    {subtitle && <p className="font-body text-clay-ink-soft">{subtitle}</p>}
                </div>
            )}
        </div>
    </main>
);

export default BusyScreen;
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/BusyScreen.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add components/BusyScreen.tsx components/BusyScreen.test.tsx
git commit -m "feat(ui): BusyScreen for loading, submitting and retry states"
git push origin quiz
```

---

### Task 10: ResultsScreen and the "Next student" label

**Files:**
- Modify: `components/ProcessingStatus.tsx` (one label)
- Modify: `components/ResultsScreen.tsx` (full rewrite)
- Modify: `components/ResultsScreen.test.tsx` (full rewrite)

**Interfaces:**
- Consumes: `TopJob` from Task 1; `getJobIconName` from Task 4; `ProcessingStatus` (props `recordId`, `onRestart?`).
- Produces: `ResultsScreenProps { studentName: string; topJobs: TopJob[]; description: string; recordId: string; onRestart: () => void }`.

- [ ] **Step 1: Relabel the overlay button**

In `components/ProcessingStatus.tsx`, inside the `onRestart &&` button, change the text `Start over` to `Next student`. Nothing else changes.

- [ ] **Step 2: Replace the test file**

`components/ResultsScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsScreen from './ResultsScreen';

vi.mock('./ProcessingStatus', () => ({
  default: ({ recordId, onRestart }: any) => (
    <div data-testid="processing-status">
      Polling {recordId}
      <button onClick={onRestart}>overlay restart</button>
    </div>
  ),
}));

const base = {
  studentName: 'Mia',
  description: 'You love helping people and learning new things.',
  recordId: 'rec_1',
  onRestart: () => {},
};

describe('ResultsScreen', () => {
  it('renders the single top job in the heading', () => {
    render(<ResultsScreen {...base} topJobs={[{ job_id: 't', job_name: 'Teacher' }]} />);
    expect(screen.getByRole('heading', { level: 1, name: /mia, you'd be a great teacher!/i })).toBeInTheDocument();
  });

  it('joins tied jobs with "or"', () => {
    render(
      <ResultsScreen
        {...base}
        topJobs={[{ job_id: 't', job_name: 'Teacher' }, { job_id: 'l', job_name: 'Librarian' }]}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: /a great teacher or librarian!/i })).toBeInTheDocument();
  });

  it('renders one job card per top job and the AI description', () => {
    render(
      <ResultsScreen
        {...base}
        topJobs={[{ job_id: 't', job_name: 'Teacher' }, { job_id: 'zzz', job_name: 'Astronaut' }]}
      />,
    );
    expect(screen.getAllByTestId('job-card')).toHaveLength(2);
    expect(screen.getByText(base.description)).toBeInTheDocument();
  });

  it('mounts ProcessingStatus with the record id', () => {
    render(<ResultsScreen {...base} topJobs={[{ job_id: 't', job_name: 'Teacher' }]} />);
    expect(screen.getByTestId('processing-status')).toHaveTextContent('Polling rec_1');
  });

  it('Next student (bottom and overlay) calls onRestart', async () => {
    const onRestart = vi.fn();
    const user = userEvent.setup();
    render(<ResultsScreen {...base} onRestart={onRestart} topJobs={[{ job_id: 't', job_name: 'Teacher' }]} />);
    await user.click(screen.getByRole('button', { name: /next student/i }));
    await user.click(screen.getByRole('button', { name: /overlay restart/i }));
    expect(onRestart).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run components/ResultsScreen.test.tsx`
Expected: FAIL — props mismatch.

- [ ] **Step 4: Rewrite the component**

`components/ResultsScreen.tsx`:

```tsx
import React from 'react';
import * as LucideIcons from 'lucide-react';
import ProcessingStatus from './ProcessingStatus';
import { TopJob } from '../src/types';
import { getJobIconName } from '../src/data/jobIcons';

export interface ResultsScreenProps {
    studentName: string;
    topJobs: TopJob[];
    description: string;
    recordId: string;
    onRestart: () => void;
}

const iconFor = (jobId: string): React.ComponentType<any> => {
    const name = getJobIconName(jobId);
    return (LucideIcons as Record<string, React.ComponentType<any>>)[name] ?? LucideIcons.Briefcase;
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({
    studentName,
    topJobs,
    description,
    recordId,
    onRestart,
}) => {
    const jobNames = topJobs.map((j) => j.job_name).join(' or ');
    const heading = jobNames
        ? `${studentName}, you'd be a great ${jobNames}!`
        : `${studentName}, you'd be great at many jobs!`;

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <div className="w-full max-w-md md:max-w-2xl space-y-6">
                <header className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-8 text-center">
                    <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug">
                        {heading}
                    </h1>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Recommended jobs">
                    {topJobs.map((job) => {
                        const Icon = iconFor(job.job_id);
                        return (
                            <div
                                key={job.job_id}
                                data-testid="job-card"
                                className="bg-clay-surface rounded-clay shadow-clay p-6 flex flex-col items-center gap-3"
                            >
                                <Icon size={64} strokeWidth={2.5} className="text-clay-primary" aria-hidden />
                                <p className="font-heading font-bold text-clay-ink text-xl text-center">{job.job_name}</p>
                            </div>
                        );
                    })}
                </section>

                <section className="bg-clay-surface rounded-clay shadow-clay p-6" aria-label="About this job">
                    <p className="font-body text-clay-ink text-base md:text-lg leading-relaxed">{description}</p>
                </section>

                <ProcessingStatus recordId={recordId} onRestart={onRestart} />

                <div className="pb-8">
                    <button
                        type="button"
                        onClick={onRestart}
                        className="clay-press-fx w-full inline-flex items-center justify-center gap-3 rounded-full bg-clay-primary text-white font-heading font-bold text-lg py-5 shadow-clay hover:bg-clay-primary-press"
                    >
                        <LucideIcons.RotateCcw size={24} strokeWidth={2.5} aria-hidden />
                        Next student
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ResultsScreen;
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run components/ResultsScreen.test.tsx`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add components/ProcessingStatus.tsx components/ResultsScreen.tsx components/ResultsScreen.test.tsx
git commit -m "feat(results): top-job cards, AI description and Next student"
git push origin quiz
```

---

### Task 11: App state machine and pipeline

**Files:**
- Modify: `src/App.tsx` (full rewrite)
- Modify: `src/App.test.tsx` (full rewrite)
- Delete: `components/PhotoScreen.tsx`, `components/PhotoScreen.test.tsx`

**Interfaces:**
- Consumes: everything above. `getQuizData`, `computeScores`, `submitQuestionnaire` (existing in `utils/api.ts`), `getApiUrl` (existing in `config/api.ts`), `StartPayload` from Task 8.

- [ ] **Step 1: Delete PhotoScreen**

```bash
git rm components/PhotoScreen.tsx components/PhotoScreen.test.tsx
```

- [ ] **Step 2: Replace the App test**

`src/App.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const quizData = {
  questions: [
    { id: 'q1', text: 'First?', choices: [{ id: 'q1_A', text: 'A1' }, { id: 'q1_B', text: 'B1' }] },
    { id: 'q2', text: 'Second?', choices: [{ id: 'q2_A', text: 'A2' }, { id: 'q2_B', text: 'B2' }] },
  ],
  jobs: [{ id: 't', name: 'Teacher' }, { id: 'n', name: 'Nurse' }],
  optionJobMap: [
    { option_id: 'q1_A', job_id: 't' },
    { option_id: 'q1_B', job_id: 'n' },
    { option_id: 'q2_A', job_id: 't' },
    { option_id: 'q2_B', job_id: 'n' },
  ],
};

const getQuizData = vi.fn();
vi.mock('../utils/googleSheetParser', () => ({ getQuizData: () => getQuizData() }));

vi.mock('../components/CameraCapture', () => ({
  default: ({ onSuccess }: any) => (
    <button data-testid="mock-camera" onClick={() => onSuccess('rec_1', 'https://cdn/p.jpg')}>camera</button>
  ),
}));
vi.mock('../components/ProcessingStatus', () => ({
  default: ({ recordId }: any) => <div data-testid="processing-status">Polling {recordId}</div>,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  getQuizData.mockReset().mockResolvedValue(quizData);
  fetchMock.mockReset().mockImplementation(async (url: string) => {
    if (url.endsWith('/api/generate-description')) {
      return { ok: true, json: async () => ({ success: true, description: 'Nice job text' }) };
    }
    if (url.endsWith('/api/submit-questionnaire')) {
      return { ok: true, json: async () => ({ success: true }) };
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function goToQuiz(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { level: 1, name: /what job is right for you/i });
  await user.type(screen.getByLabelText(/your name/i), 'Mia');
  await user.type(screen.getByLabelText(/your class/i), '3A');
  await user.click(screen.getByTestId('mock-camera'));
  await user.click(screen.getByRole('button', { name: /start quiz/i }));
}

describe('App state machine', () => {
  it('shows a loading state, then the start screen', async () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent(/getting your quiz ready/i);
    expect(await screen.findByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument();
  });

  it('shows the sheet error with retry when loading fails', async () => {
    getQuizData.mockRejectedValueOnce(new Error('Sheet not published'));
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Sheet not published');
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument();
    expect(getQuizData).toHaveBeenCalledTimes(2);
  });

  it('walks start → quiz → submitting → results and submits the right payload', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);

    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^A2$/ }));

    expect(await screen.findByRole('heading', { level: 1, name: /mia, you'd be a great teacher!/i })).toBeInTheDocument();
    expect(screen.getByText('Nice job text')).toBeInTheDocument();
    expect(screen.getByTestId('processing-status')).toHaveTextContent('Polling rec_1');

    const submitCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/submit-questionnaire'));
    expect(JSON.parse(submitCall![1].body)).toEqual({
      recordId: 'rec_1',
      studentName: 'Mia',
      studentClass: '3A',
      answers: ['q1_A', 'q2_A'],
      recommendedJobs: 'Teacher',
      scores: { Teacher: 2 },
      geminiDescription: 'Nice job text',
    });
  });

  it('Back removes the last answer and returns to the previous question', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);
    await user.click(screen.getByRole('button', { name: /^B1$/ }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    await user.click(screen.getByRole('button', { name: /^A2$/ }));
    await screen.findByRole('heading', { level: 1, name: /teacher/i });
    const submitCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/submit-questionnaire'));
    expect(JSON.parse(submitCall![1].body).answers).toEqual(['q1_A', 'q2_A']);
  });

  it('offers Try again when submission fails, then succeeds on retry', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: true, json: async () => ({ success: true, description: 'd' }) }))
             .mockImplementationOnce(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    await user.click(screen.getByRole('button', { name: /^A2$/ }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /teacher/i })).toBeInTheDocument();
  });

  it('Next student resets to Start without refetching the sheet', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    await user.click(screen.getByRole('button', { name: /^A2$/ }));
    await screen.findByRole('heading', { level: 1, name: /teacher/i });
    await user.click(screen.getByRole('button', { name: /next student/i }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/your name/i)).toHaveValue('');
    expect(getQuizData).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — App still imports `./data/jobs` / `PhotoScreen`.

- [ ] **Step 4: Rewrite `src/App.tsx`**

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { GameState, QuizData, ScoringResults, QuestionnaireSubmission } from './types';
import { getQuizData } from '../utils/googleSheetParser';
import { computeScores } from '../utils/scoring';
import { submitQuestionnaire } from '../utils/api';
import { getApiUrl } from '../config/api';
import StartScreen, { StartPayload } from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import BusyScreen from '../components/BusyScreen';
import ResultsScreen from '../components/ResultsScreen';

type Student = StartPayload;

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Loading);
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [answers, setAnswers] = useState<string[]>([]);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [results, setResults] = useState<{ scoring: ScoringResults; description: string } | null>(null);

    // ---- Loading ----
    const loadQuiz = useCallback(async () => {
        setGameState(GameState.Loading);
        setLoadError(null);
        try {
            const data = await getQuizData();
            setQuizData(data);
            setGameState(GameState.Start);
        } catch (err: any) {
            setLoadError(err?.message ?? 'Could not load the quiz.');
        }
    }, []);

    useEffect(() => {
        loadQuiz();
    }, [loadQuiz]);

    // ---- Submitting pipeline ----
    const fetchDescription = async (name: string, scoring: ScoringResults): Promise<string> => {
        const response = await fetch(getApiUrl('/api/generate-description'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentName: name, topJobs: scoring.topJobs, sortedScores: scoring.sortedScores }),
        });
        if (!response.ok) throw new Error('Could not write your job story. Please try again.');
        const data = await response.json();
        if (!data.success || !data.description) throw new Error('Could not write your job story. Please try again.');
        return data.description as string;
    };

    const runSubmission = useCallback(async (finalAnswers: string[]) => {
        if (!quizData || !student) return;
        setGameState(GameState.Submitting);
        setSubmitError(null);
        try {
            const scoring = computeScores(finalAnswers, quizData.jobs, quizData.optionJobMap);
            const description = await fetchDescription(student.studentName, scoring);
            const submission: QuestionnaireSubmission = {
                recordId: student.recordId,
                studentName: student.studentName,
                studentClass: student.studentClass,
                answers: finalAnswers,
                recommendedJobs: scoring.topJobs.map((j) => j.job_name).join(', '),
                scores: scoring.counts,
                geminiDescription: description,
            };
            await submitQuestionnaire(submission);
            setResults({ scoring, description });
            setGameState(GameState.Results);
        } catch (err: any) {
            setSubmitError(err?.message ?? 'Could not save your answers. Please try again.');
        }
    }, [quizData, student]);

    // ---- Handlers ----
    const handleStart = useCallback((payload: StartPayload) => {
        setStudent(payload);
        setAnswers([]);
        setGameState(GameState.Quiz);
    }, []);

    const handleSelectChoice = useCallback((optionId: string) => {
        if (!quizData) return;
        const next = [...answers, optionId];
        setAnswers(next);
        if (next.length >= quizData.questions.length) {
            runSubmission(next);
        }
    }, [answers, quizData, runSubmission]);

    const handleBack = useCallback(() => {
        setAnswers((prev) => prev.slice(0, -1));
    }, []);

    const handleRestart = useCallback(() => {
        setStudent(null);
        setAnswers([]);
        setResults(null);
        setSubmitError(null);
        setGameState(GameState.Start);
    }, []);

    // ---- Render ----
    switch (gameState) {
        case GameState.Loading:
            return (
                <BusyScreen
                    title="Getting your quiz ready…"
                    subtitle="Loading questions from your teacher's sheet."
                    error={loadError}
                    onRetry={loadQuiz}
                />
            );
        case GameState.Start:
            return <StartScreen onStart={handleStart} />;
        case GameState.Quiz: {
            if (!quizData) return null;
            const index = Math.min(answers.length, quizData.questions.length - 1);
            return (
                <QuizScreen
                    question={quizData.questions[index]}
                    questionIndex={index}
                    totalQuestions={quizData.questions.length}
                    onSelectChoice={handleSelectChoice}
                    onBack={handleBack}
                />
            );
        }
        case GameState.Submitting:
            return (
                <BusyScreen
                    title="Figuring out what you'd be great at…"
                    subtitle="This only takes a moment."
                    error={submitError}
                    onRetry={() => runSubmission(answers)}
                />
            );
        case GameState.Results:
            return student && results ? (
                <ResultsScreen
                    studentName={student.studentName}
                    topJobs={results.scoring.topJobs}
                    description={results.description}
                    recordId={student.recordId}
                    onRestart={handleRestart}
                />
            ) : null;
        default:
            return null;
    }
};

export default App;
```

- [ ] **Step 5: Run the whole suite and the type check**

Run: `npx vitest run`
Expected: all files pass (parser 7, scoring 5, jobIcons 3, fallback 3, OptionCard 4, QuizScreen 6, StartScreen 4, BusyScreen 2, ResultsScreen 5, App 6 = 45).

Run: `npx tsc --noEmit`
Expected: no errors in product files (the pre-existing `vitest.config.ts` version-mismatch error is known and ignored).

Run: `npm run build`
Expected: `dist/` built with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat(app): Loading → Start → Quiz → Submitting → Results state machine"
git push origin quiz
```

---

### Task 12: Manual verification, docs, changelog, tag

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `CHANGELOG.md`

- [ ] **Step 1: Run the app against the real sheet**

```bash
npm run dev
```

Open the Vite URL. Check, and fix anything that fails before moving on:
1. Loading screen appears, then Start.
2. Camera unlocks only after name (≥2) and class (≥2). Snap → upload → **Start quiz!** enables.
3. 10 questions load from the real sheet with images. Break one image URL in DevTools (block request) and confirm the text card appears.
4. Back on question 2 returns to question 1 and the dot for question 1 is "current" again.
5. After question 10: Submitting screen, then Results with heading, job card(s), description, and the polling panel.
6. **Next student** returns to an empty Start screen with no network call to Google Sheets.
7. DevTools device toolbar at 375, 768, 1280 wide: no horizontal scroll on any screen.
8. Tab + Enter through Start inputs and Quiz options works; focus rings visible.
9. Enable "Emulate CSS prefers-reduced-motion: reduce" in DevTools rendering panel; option grid does not slide.

- [ ] **Step 2: Update `CLAUDE.md`**

Rewrite these sections to describe the quiz app (keep the rest):
- `Description` line in the header: "Elementary-school career quiz — student enters name + class, takes a photo, answers 10 sheet-driven questions, gets a scored job recommendation, AI description, and AI portrait".
- **Frontend Structure**: replace the 4-state description with the 5-state machine (`Loading → Start → Quiz → Submitting → Results`), listing `StartScreen`, `QuizScreen` + `OptionCard`, `BusyScreen`, `ResultsScreen`, `ProcessingStatus`, `CameraCapture`.
- **Data Flow**: replace the "Job pick" and "Photo capture" blocks with: Start (Cloudinary → `/api/upload`), Quiz (answers array), Submitting (`computeScores` → `/api/generate-description` → `/api/submit-questionnaire`), Results (polling).
- **Type System**: `GameState` 5 values; `Question/Choice/Job/OptionJobMapItem/QuizData/ScoringResults` from `src/types.ts`; remove `JobKey`.
- **Scoring**: replace the `buildPickedJobPayload` block with `computeScores(selectedOptionIds, jobs, optionJobMap)` and its return shape.
- **PROJECT STRUCTURE** tree: remove `src/data/jobs.ts`, `PhotoScreen.tsx`; add `config/quiz.ts`, `src/data/jobIcons.ts`, `utils/googleSheetParser.ts`, `components/OptionCard.tsx`, `components/BusyScreen.tsx`, `server/utils/fallbackDescription.ts`.
- Add a **Google Sheet** subsection under the Airtable schema: sheet id lives in `config/quiz.ts`; four sheets and their columns as listed in Global Constraints; "the sheet must be published to the web".
- Branch table: change the `kindergarten` row's status to "Active — kindergarten line" and add `| quiz | v2 elementary quiz app (this branch) | **Active** — all quiz work goes here |`. Push instructions on this branch say `git push origin quiz`.
- Tests count: update to the number reported by `npx vitest run` in Task 11.

- [ ] **Step 3: Update `README.md`**

- Intro paragraph and **Current Version** block: `v2.0.0-quiz-redesign`, bullets: 10-question sheet-driven quiz, 2×2 image cards with text fallback, progress + Back, Claymorphism UI, live camera on Start, Next-student reset, N Vitest tests.
- **Features** list: replace "Single-card carousel" with "Sheet-driven quiz: 10 questions × 4 image options from a Google Sheet the teacher edits"; add "Scored recommendation with tie handling".
- **Project Structure**: same file changes as CLAUDE.md.
- **Deployment**: "Select the `quiz` branch for the elementary app, `kindergarten` for the preschool app."
- Add a short **Editing the quiz** section: which sheet, the four tabs, required column names, "File → Share → Publish to web", images optional (text card shown if missing or broken).

- [ ] **Step 4: Add the CHANGELOG entry**

Insert above the `[v1.2.0-kindergarten-redesign]` heading in `CHANGELOG.md`:

```markdown
## [v2.0.0-quiz-redesign] - YYYY-MM-DD   <!-- replace with the date you run this step -->

### 🎯 Elementary quiz rebuilt on the kindergarten codebase (branch `quiz`)

Same Google Sheet, same backend and Airtable schema, same n8n workflow. New body: Claymorphism UI, live camera, tests.

### ✨ Added
- `Loading → Start → Quiz → Submitting → Results` state machine (`src/App.tsx`)
- Start screen collects name + class and embeds the live camera; Start enabled only after upload
- `QuizScreen` 2×2 image cards (`OptionCard`) with automatic text fallback when an image fails, "Question N of 10" + progress dots, Back button
- `BusyScreen` for loading / submitting with Try again
- Results: "{name}, you'd be a great {job}!" (ties joined with "or"), job cards with Lucide icons (`src/data/jobIcons.ts`), AI description card, AI portrait polling, **Next student** reset
- Tests for parser, scoring, every screen and the App flow

### 🎨 Changed
- `utils/googleSheetParser.ts` ported from v1.1.0; sheet id moved to `config/quiz.ts`
- `utils/scoring.ts` back to `computeScores` (multi-option scoring with ties)
- `server/routes/gemini.ts` fallback now built by `server/utils/fallbackDescription.ts` from the top job name

### 🗑️ Removed
- `src/data/jobs.ts` (kindergarten job constant), `components/PhotoScreen.tsx`, carousel selection
- Score panel, report modal, debug panel from v1.1.0 (not ported)
```

- [ ] **Step 5: Final checks and commit**

Run: `npx vitest run && npm run build`
Expected: all green, `dist/` builds.

```bash
git add CLAUDE.md README.md CHANGELOG.md
git commit -m "docs: describe the quiz line (v2.0.0-quiz-redesign)"
git push origin quiz
```

- [ ] **Step 6: Tag**

```bash
git tag -a v2.0.0-quiz-redesign -m "v2.0.0 - Elementary quiz rebuilt on the kindergarten Claymorphism base"
git push origin v2.0.0-quiz-redesign
```

Report to Geonook: the tag, the test count, anything from Step 1 that had to be fixed, and that Zeabur's quiz service (if any) must be pointed at branch `quiz`.
