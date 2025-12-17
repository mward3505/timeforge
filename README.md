# TimeForge

TimeForge is a full stack web app that helps you turn your available time into a realistic plan. You add what you want to work on (activities), set how much time you actually have, and TimeForge generates a schedule that fits your day instead of overloading it.

## Current status

MVP in progress. This week’s focus is improving first impressions with a landing page and adding authentication so the app feels like a real product.

## Tech stack

-   Frontend: React + TypeScript (Vite)
-   UI: Tailwind CSS + shadcn/ui (Week 1)
-   Backend: Python + FastAPI (REST)
-   Database: Postgres (planned)
-   Deploy: Netlify (frontend) + Railway (backend)

## Repo structure

-   `frontend/` React app
-   `backend/` FastAPI app

## Run it locally

### Backend

```bash
cd backend
# activate venv (Mac/Linux)
source venv/bin/activate
# (Windows PowerShell)
# .\venv\Scripts\Activate.ps1

uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at the URL Vite prints (usually `http://localhost:5173`).

## Deploy notes

-   Production backend: Railway
-   Production frontend: Netlify
-   The frontend `api.ts` auto-switches between local and production based on hostname (`localhost` vs deployed domain).
