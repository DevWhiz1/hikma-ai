# Hikmah AI

An authenticated Islamic guidance platform providing:
- AI Scholar Chat (Gemini) with persistent sessions
- Hadith Explorer with intelligent fuzzy/NLP search (excludes weak / specified books)
- Prayer Times & Qibla Finder
- Tasbih (Dhikr) Counter
- Secure user authentication (JWT) & session management

## Tech Stack
### Frontend
- React 18 + TypeScript + Vite
- React Router
- Tailwind CSS
- Heroicons / Lucide Icons
- React Markdown (render AI answers with formatting)

### Backend
- Node.js / Express
- MongoDB / Mongoose
- JWT Auth middleware
- Google Generative AI (Gemini) for Islamic guidance answers
- Hadith API integration (hadithapi.com)
- Lightweight NLP (natural / string-similarity) for query expansion & fuzzy book normalization

## Key Features
1. Authentication
   - Signup / Login with JWT
   - Protected API routes using auth middleware
2. AI Scholar Chat
   - Gemini system prompt enforcing Islamic scholarly tone & formatting
   - Persistent chat sessions stored in MongoDB (title auto-derived from first user message)
   - Conversation context sent for multi‑turn reasoning
   - Message limit trimming to keep performance (keeps last N messages)
3. Chat Session Management
   - Create / list / open / delete (soft delete via isActive)
   - Sidebar history sorted by lastActivity
4. Hadith Explorer
   - Book listing (filtered to core authentic collections; excludes blocked slugs)
   - Smart search:
     * Tokenization, stopword removal
     * Synonym & concept expansion (e.g., anger -> rage, temper)
     * Fuzzy book name normalization
     * Multi‑candidate query building with scoring
   - Unified normalization of diverse hadith API JSON shapes
5. Prayer Utilities
   - (Frontend) Prayer times & Qibla direction components (adhan + geolocation logic) — file not shown here but integrated.
6. Tasbih Counter
   - Simple dhikr counting interface (stateful in UI)
7. UI/UX
   - Responsive layout (sidebar pinned on desktop, overlay modal on mobile)
   - Dark mode support (currently default light as per requirement)
   - Quick prompt suggestions when a chat is empty
   - Markdown rendering with semantic styling

## Project Structure (Simplified)
```
backend/
  index.js                # Express bootstrap & Gemini endpoint
  config/db.js            # Mongo connection
  middleware/auth.js      # JWT auth
  controllers/
    authController.js
    chatController.js
    hadithController.js
  routes/
    authRoutes.js
    chatRoutes.js
    hadithRoutes.js
  models/
    User.js
    ChatSession.js
    ChatMessage.js (legacy / history)
client/
  src/
    main.tsx / App.tsx
    components/
      ChatBot.tsx
      ChatHistory.tsx
      PrayerTimes.tsx
      QiblaFinder.tsx
      TasbihCounter.tsx
      HadithExplorer.tsx
    services/
      chatService.ts
```

## Environment Variables
Create `.env` files for both backend & frontend.

Backend `.env` example:
```
PORT=5000
MONGO_URI=<your mongodb uri>
JWT_SECRET=<strong secret>
GEMINI_API_KEY=<google gemini api key>
HADITH_API_KEY=<hadithapi key>
ALLOWED_ORIGINS=https://your-frontend-domain.com, http://localhost:5173
```

Frontend `.env` (at `client/.env`):
```
VITE_API_URL=http://localhost:5000/api
```
(Adjust for production deployment base URL.)

## Installation & Run
### Backend
```
cd backend
npm install
node index.js
```

### Frontend
```
cd client
npm install
npm run dev
```
Visit: http://localhost:5173

## API Overview
### Auth
- POST `/api/auth/signup`
- POST `/api/auth/login`

### Chat Sessions
- GET `/api/chat/sessions` (auth)
- POST `/api/chat/sessions` (auth) -> create session
- GET `/api/chat/sessions/:id` (auth)
- DELETE `/api/chat/sessions/:id` (auth) -> soft delete

### AI Scholar
- POST `/api/scholar-ai` (auth)
  Payload:
  ```json
  {
    "message": "Explain the importance of Salah",
    "conversation": [ {"role":"user","content":"..."}, {"role":"assistant","content":"..."} ],
    "sessionId": "<chatSessionId>"
  }
  ```
  Response:
  ```json
  { "generated_text": "...", "session": {"_id":"...","title":"...","lastActivity":"..."} }
  ```

### Hadith
- GET `/api/hadith/books` (auth)
- POST `/api/hadith/hadith/search` (auth)
  ```json
  { "query": "rights of parents", "book": "bukhari", "limit": 5 }
  ```
- POST `/api/hadith/answer` (auth) – higher level synthesized answer (controller combines search & formatting)

## Chat Persistence Logic
- Each session stores array of `{ role, content, timestamp }`.
- Auto title: derived from first user message (truncated to 50 chars).
- When sending a message, backend appends user + assistant reply and returns updated session summary.
- Client merges session summary to update sidebar without full reload.

## NLP & Hadith Search Details
- Stopword removal (custom list)
- Minimal lemmatization attempt (WordNet if available)
- Synonym expansion via curated map + WordNet
- Concept phrase mapping (maps multi‑word intentions to related tokens)
- Fuzzy book name resolution (string-similarity) while excluding disallowed collections
- Multi strategy candidate queries; selects aggregated results

## Security Considerations
- JWT in Authorization header (Bearer)
- Server validates user ownership on session operations
- Soft delete prevents immediate data loss
- CORS configurable via ALLOWED_ORIGINS
- Environment secrets never committed

## Performance Notes
- Message history trimmed (keep last ~80 messages) to reduce token context size
- Hadith requests time out after 20s to avoid hanging API calls
- Fuzzy/NLP kept lightweight (optional dependency on `natural`)

## Future Improvements
- Stream AI responses (Server-Sent Events)
- Role-based admin dashboard (moderation / analytics)
- Improved hadith citation formatting & grading metadata
- Export / import chat sessions
- Multi-language UI (Arabic/Urdu)
- Offline caching for prayer times & Qibla

## Troubleshooting
| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Ensure Authorization header with valid JWT token |
| Empty AI response | Check GEMINI_API_KEY and model availability |
| Sessions not updating | Confirm `/api/scholar-ai` includes `sessionId` in payload |
| Hadith search empty | Verify HADITH_API_KEY and that book is allowed |

## License
This project is licensed under the MIT License.

---

Contributions & feedback welcome.

Created with ❤️ by team **Cyber Mujahideen Ai Skillbridge**.
