<!-- Generated: 2026-05-03 | Files scanned: 3 | Token estimate: ~600 -->

# Dependencies Codemap

Generated from `package.json` (root, single — no `server/package.json`).

## External Services

| Service | Used by | Purpose | Auth |
|---------|---------|---------|------|
| **Airtable** | backend (`server/utils/airtable.ts`) | Single source of student state — all 11 columns of `Students` table | `AIRTABLE_API_KEY` (token, `data.records:write`) |
| **Cloudinary** | frontend (`components/CameraCapture.tsx`) | Original photo storage, direct browser upload | Unsigned `VITE_CLOUDINARY_UPLOAD_PRESET` |
| **Google Gemini** | backend (`server/routes/gemini.ts`) | Career description text via `gemini-2.5-flash` | `GEMINI_API_KEY` (also leaked to client bundle — see security note) |
| **n8n** | backend (`server/utils/webhook.ts`) | Async AI portrait generation pipeline | Webhook URL (`N8N_WEBHOOK_URL`), no auth on payload |
| **Google Drive** | n8n workflow only | Final AI portrait storage; URL stored in Airtable `結果URL` | n8n credential |
| **Google Fonts** | `index.html` | Baloo 2 + Comic Neue, `display=swap` | none (CDN) |

## Runtime Dependencies (`package.json#dependencies`)
```
@google/genai      ^1.21.0   Gemini SDK
airtable           ^0.12.2   Airtable SDK (used in server/utils/airtable.ts)
cors               ^2.8.5    open CORS middleware
dotenv             ^17.2.3   .env.local loader
express            ^5.1.0    HTTP server
lucide-react       ^0.460.0  SVG icon set (no emoji policy)
react / react-dom  ^19.1.1   UI runtime
```

## Dev Dependencies (`package.json#devDependencies`)
```
vite              ^6.2.0      bundler / dev server (proxy /api → :4000)
@vitejs/plugin-react ^5.0.0
typescript        ~5.8.2
tsx               ^4.20.6     Node ESM runner for server (no compile step)
ts-node           ^10.9.2     legacy fallback (largely unused)
concurrently      ^9.2.1      runs dev:server + dev:client in one terminal
tailwindcss       ^3.4.18     + autoprefixer ^10.4.21 + postcss ^8.5.6
@types/node       ^22.19.17
@types/express    ^5.0.3
@types/cors       ^2.8.19
vitest            ^1.6.1      test runner
@testing-library/react       ^16.3.2
@testing-library/jest-dom    ^6.9.1
@testing-library/user-event  ^14.6.1
jsdom             ^24.1.3     test DOM env
```

## Engine Pin
```
node: 22  (package.json#engines)
```

## Build / Run Tool Chain
```
dev      → concurrently → tsx server/index.ts  (Express :4000)
                       → vite                  (Vite :3000, proxies /api → :4000)
build    → vite build                          (outputs dist/)
preview  → vite preview                        (frontend only, no Express)
start    → vite build && NODE_ENV=production tsx server/index.ts
test     → vitest run                          (jsdom env, 32 tests across 8 files)
```

## Path Aliases
- `@/*` → repo root (configured in `vite.config.ts` and `tsconfig.json`)
- Server imports use `.js` suffix on `.ts` source (Node ESM rule). Dropping `.js` crashes the server at startup.

## Known Drift
- `vitest.config.ts` has a known TS version-mismatch warning when running `npx tsc --noEmit` (Vitest 1.6 bundles its own Vite). Does NOT affect the actual build or test run.
- `GEMINI_API_KEY` leaks into the client bundle via `vite.config.ts` `define` — tracked in `Documentation/Security/SECURITY_AUDIT_2025-10-14.md`, not yet patched.
