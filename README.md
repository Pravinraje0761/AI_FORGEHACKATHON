# AI Interview Readiness Platform

Holistic, recruiter-style evaluation in a fast demo flow: **resume + ATS-style keyword fit**, **5 role-specific technical questions**, **communication heuristics** (including optional Web Speech dictation), **portfolio/GitHub signals** (optional GitHub API lookup), **weighted overall score**, **shortlist simulation (Yes / Maybe / No)**, **3-week improvement roadmap**, and **mock interview prompts**.

## Monorepo layout

| Path | Purpose |
|------|---------|
| `web/` | Vite + React + TypeScript + Tailwind v4 + Framer Motion + Recharts UI |
| `server/` | Express API: resume PDF/DOCX text extraction, scoring engine, optional OpenAI narrative |

## Quick start (local)

**Terminal 1 — API**

```powershell
cd "C:\Users\pravi\OneDrive\Desktop\dev-project\server"
copy .env.example .env
npm install
npm run dev
```

**Terminal 2 — Web**

```powershell
cd "C:\Users\pravi\OneDrive\Desktop\dev-project\web"
npm install
npm run dev
```

Open the URL Vite prints (default **http://localhost:5173/**). The dev server proxies `/api` to **http://127.0.0.1:4000**.

### Optional: richer AI copy

Add an OpenAI key to `server/.env`:

```env
OPENAI_API_KEY=sk-...
```

When set, the server asks **gpt-4o-mini** for extra recruiter-style narrative and roadmap bullets. Scores stay anchored to the deterministic engine.

### Production API URL

Build the web app with:

```env
VITE_API_URL=https://your-api-host.example.com
```

Leave it empty for local development (Vite proxy).

## Architecture (high level)

```text
Candidate (browser)
   → POST /api/evaluate (multipart: resume + fields + MCQ answers)
        → Resume parser (pdf-parse / mammoth)
        → Heuristic scoring (resume / comm / portfolio / technical)
        → Optional OpenAI narrative merge
   → JSON dashboard payload (scores, radar, roadmap, mock questions)
```

## Scoring weights (default)

- Resume **25%**
- Technical **35%**
- Communication **20%**
- Portfolio **20%**

## Tech stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Framer Motion, Recharts  
- **Backend:** Node.js, Express, Multer, pdf-parse, mammoth, OpenAI SDK (optional)  
- **Speech:** Web Speech API (`webkitSpeechRecognition` where supported)

## Scripts

| Command | Where | Action |
|---------|-------|--------|
| `npm run dev` | `web/` | Vite dev server |
| `npm run build` | `web/` | Typecheck + production bundle |
| `npm run dev` | `server/` | API with `--watch` |
| `npm start` | `server/` | API without watch |

## Open in Cursor

Open the folder `dev-project` (this repo root) as the workspace — not your entire user profile — so search, Git, and paths stay scoped.
