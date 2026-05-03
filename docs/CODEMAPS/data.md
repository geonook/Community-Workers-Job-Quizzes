<!-- Generated: 2026-05-03 | Files scanned: 4 | Token estimate: ~500 -->

# Data Codemap

No SQL DB. Single Airtable base + Cloudinary + Google Drive (via n8n). No migrations — schema lives in Airtable UI.

## Airtable: `Students` table (single source of student state)

| Column | Type | Written by | Notes |
|--------|------|------------|-------|
| `學生姓名` | Single line text | `/api/upload` | from kid name input |
| `班級` | Single line text | `/api/upload` | frontend always sends `"Kindergarten"` |
| `原始照片` | Attachment | `/api/upload` | Cloudinary URL converted to attachment |
| `推薦職業` | Long text | `/api/submit-questionnaire` | single `displayName` (e.g. `"Doctor"`) — multi-job format kept for back-compat |
| `問卷分數` | Long text | `/api/submit-questionnaire` | JSON `{ [pickedJobKey]: 1 }` |
| `AI職業描述` | Long text | `/api/submit-questionnaire` | Gemini text (~50-70 words) or song-lyric fallback |
| `處理狀態` | Single select | various | `問卷中 \| 待處理 \| 處理中 \| 完成 \| 失敗` |
| `結果照片` | Attachment | n8n workflow | AI portrait (backup) |
| `結果URL` | URL | n8n workflow | Google Drive link (primary display source) |
| `錯誤訊息` | Long text | n8n workflow | populated when 處理狀態 = `失敗` |
| `建立時間` | Created time | Airtable | auto, ISO 8601 |

Type definitions live in [`server/utils/airtable.ts`](../../server/utils/airtable.ts) (`AirtableRecord` interface, line 28).

## Status state machine
```
[record created]                          (set by /api/upload)
       │
       ▼
   問卷中
       │ /api/submit-questionnaire updates
       ▼
   待處理 ──── n8n picks up
       │
       ▼
   處理中 ──── n8n calls Gemini portrait gen
       │
       ▼
    完成   →  結果URL populated, ProcessingStatus shows portrait
       │
       │  on error path
       ▼
    失敗   →  錯誤訊息 populated, ProcessingStatus shows error UI
```

## Job catalogue (`src/data/jobs.ts`)
11 jobs, single source of truth for both UI and Gemini fallback:
```
JOB_KEYS = ['musician','police','hairdresser','firefighter','zookeeper',
            'farmer','pilot','baker','artist','dancer','doctor']
Each Job: { key, sentence, cta, displayName, icon }
```
`server/routes/gemini.ts` derives `SONG_LYRICS` from `JOBS` at module load — no duplication.

## Cloudinary
Unsigned upload preset, frontend-direct. Browser POSTs to `https://api.cloudinary.com/v1_1/<cloud>/image/upload` with `upload_preset=<preset>` and the JPEG blob from canvas. Returned `secure_url` is sent to `/api/upload`.

## Google Drive
Owned by n8n workflow only. App never reads from Drive directly; it reads `結果URL` from Airtable.

## PII surface
- First name (typed by kid)
- Class name (always `"Kindergarten"`)
- Photo of the kid → Cloudinary (original) + Google Drive (AI portrait)
