<!-- Generated: 2026-05-03 | Files scanned: 7 | Token estimate: ~850 -->

# Backend Codemap

Express 5 + TypeScript via `tsx`. Native Node ESM — imports inside `server/` use `.js` suffixes on `.ts` source.

## Entry & Middleware
`server/index.ts` (lines 1–80)
```
app.use(cors())                        // open by design (single-origin deploy)
app.use(express.json())                // body parser
app.use(req-logger)                    // logs method+path
app.use('/api/upload', uploadRouter)
app.use('/api/submit-questionnaire', questionnaireRouter)
app.use('/api/check-status', statusRouter)
app.use('/api/generate-description', geminiRouter)
app.get('/api/health', () => ok)
[NODE_ENV=production]
  app.use(express.static('dist'))      // serve built SPA
  app.use(spa-fallback)                // non-/api → dist/index.html
app.use(error-handler)
```

## Routes → Service → External

| Route | Handler | Calls | External |
|-------|---------|-------|----------|
| `POST /api/upload` | `routes/upload.ts:10` | `airtable.createRecord({photoUrl,studentName,studentClass})` | Airtable |
| `POST /api/submit-questionnaire` | `routes/questionnaire.ts:11` | `airtable.updateQuestionnaireRecord(id, {...})` → `webhook.triggerN8nWebhook(id)` | Airtable, n8n |
| `GET /api/check-status/:recordId` | `routes/status.ts:10` | `airtable.getRecordStatus(id)` | Airtable |
| `POST /api/generate-description` | `routes/gemini.ts:37` | `@google/genai` `gemini-2.5-flash` (or `songFallback(topJobs)`) | Gemini |
| `GET /api/health` | `index.ts:38` | `{ ok: true }` | — |

## Validation
- `upload`: requires `photoUrl`, `studentName`, `studentClass` (all `length>=2`)
- `submit-questionnaire`: requires `recordId`, `studentName`, `answers[]`, `recommendedJobs`, `scores{}`
- `generate-description`: requires `studentName`, `topJobs[]`, `sortedScores[]`
- Validation failures → `400 { success: false, error }`

## Service Module: `server/utils/airtable.ts`
Exports (line : export)
```
28: AirtableRecord interface
47: createRecord({photoUrl, studentName, studentClass}) → recordId
77: updateQuestionnaireRecord(recordId, {answers, recommendedJobs, scores, geminiDescription}) → void
109: getRecordStatus(recordId) → { status, resultUrl?, error? }
```
Uses `airtable@0.12` SDK keyed by `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE_NAME`.

## Service Module: `server/utils/webhook.ts`
```
4: triggerN8nWebhook(recordId) — POST to N8N_WEBHOOK_URL with { recordId, action: 'process_career' }
```
Fire-and-log; failure does NOT block the questionnaire submission response.

## Gemini Fallback
`routes/gemini.ts` builds `SONG_LYRICS` at module load from `JOBS` (single source of truth — see `src/data/jobs.ts`). On API error or missing key returns `<carousel sentence> + " We can't wait to grow up!"`.

## Error Surface
- 4xx: validation (route-specific)
- 5xx: Airtable / Gemini / network failures, returned as `{ success:false, error: <message> }`
- Top-level error handler at `index.ts:69`

## Env Vars (runtime)
`AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`, `N8N_WEBHOOK_URL`, `GEMINI_API_KEY`, `PORT` (default 4000), `NODE_ENV`.
