# AI Assignments (Gemini + MongoDB + Crew-style agents)

This feature lets scholars create assignments with AI, students submit answers, and an AI agent grades submissions. Human override is supported. Everything uses your existing stack (Node/Express/MongoDB, React/Vite) and Google Gemini.

## Backend overview

- Models
  - `backend/models/Assignment.js` — assignment with generated `questions` and optional `aiSpec`.
  - `backend/models/Submission.js` — student answers, AI grading results, and human override.
  - `backend/models/AgentActivity.js` — logs for generation/grading runs.
- Controllers
  - `backend/controllers/assignmentController.js` — create, AI-generate, publish, list, detail.
  - `backend/controllers/submissionController.js` — submit, AI grade, override, listings.
- Routes
  - Mounted in `backend/index.js`:
    - `POST /api/assignments` — create draft
    - `POST /api/assignments/:id/generate` — AI-generate questions
    - `POST /api/assignments/:id/publish` — publish
    - `POST /api/assignments/:id/close` — close
    - `GET /api/assignments` — list (scholar sees own; student sees published)
    - `GET /api/assignments/:id` — detail (published or owner)
    - `POST /api/submissions/assignment/:id/submit` — student submit
    - `POST /api/submissions/:id/grade` — AI grade (owner/admin)
    - `POST /api/submissions/:id/override` — human override (owner/admin)
    - `GET /api/submissions/assignment/:id` — list submissions (owner/admin)
    - `GET /api/submissions/me` — my submissions (student)
- Agents
  - `backend/utils/agentBridge.js` — runs Python agent with JSON I/O and timeouts.
  - `backend/agents-python/assignment_creator.py` — generates questions.
  - `backend/agents-python/assignment_grader.py` — grades submissions.

Both Python agents gracefully fall back to mock outputs if Gemini isn’t configured.

## Frontend overview

- Service: `client/src/services/assignmentService.ts`
- Pages added
  - Scholar: `AssignmentsPage`, `AssignmentCreatePage`, `AssignmentBuilderPage`, `AssignmentSubmissionsPage`
  - Student: `TakeAssignmentPage`, `MySubmissionsPage`
- Routes added in `client/src/MainApp.tsx`:
  - `/scholar/assignments`, `/scholar/assignments/new`, `/scholar/assignments/:id/builder`, `/scholar/assignments/:id/submissions`
  - `/assignments/:id/take`, `/me/submissions`

## Environment and setup

1) Google Gemini
- Set `GEMINI_API_KEY` in `backend/.env`.
- Optional: set `GEMINI_MODEL` (default `gemini-2.5-flash`).

2) Python agents
- Ensure Python 3 is installed and available as `python` (or set `PYTHON_BIN` in backend `.env`).
- Install Python deps:

```powershell
cd "backend/agents-python"
python -m pip install -r requirements.txt
```

Optional: CrewAI orchestration
- The question creator supports CrewAI when `CREWAI_ENABLED=true` in `backend/.env`.
- The grader also supports CrewAI with the same flag.
- Install CrewAI (already listed in requirements.txt). If you installed earlier, re-run the install:

```powershell
cd "backend/agents-python"
python -m pip install -r requirements.txt
```

Notes:
- CrewAI is optional; if not installed or if `CREWAI_ENABLED` is false/missing, agents automatically fall back to Gemini or mock logic.

3) Run app

```powershell
# Backend
cd "backend"
node index.js

# Frontend (in a separate terminal)
cd "client"
npm run dev
```

## Notes
- If Gemini is overloaded (HTTP 503), agents return mock results so you can continue testing.
- We removed a duplicate Mongo index on Payment to fix the previous warning.
- You can harden auth/roles as needed via `backend/middleware/auth.js`.
- For RAG-enhanced questions, you can extend the Python creator to retrieve context from Pinecone and cite sources.
 - Manual authoring: open `Assignments` → `Edit` to add/update/delete questions. MCQ, True/False, Short-answer, and Essay are supported.
 - Manual grading: in `Submissions`, enter a total score and optional feedback, then Save Manual Grade.
