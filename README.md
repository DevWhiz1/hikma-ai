# Hikmah AI

An authenticated Islamic guidance platform providing:
- AI Scholar Chat (Gemini) with persistent sessions
- Hadith Explorer with intelligent fuzzy/NLP search (excludes weak / specified books)
- Prayer Times & Qibla Finder
- Tasbih (Dhikr) Counter
- Secure user authentication (JWT) & session management

## Recent Updates (Scholar Workflow & UI/UX Improvements)

### Scholar Workflow
- Scholar application form: all fields required, YouTube demo link + photo; backend validates blanks and YouTube URLs.
- Scholar listing cards redesigned (photo, bio, pills, compact actions); "Chat with Scholar" appears after enrollment and opens a mirrored direct chat (student ↔ scholar), always creating a fresh chat if requested.
- Approved scholars can edit their profile at `/scholars/profile/edit`.
- Enroll flow now denormalizes into `user.enrolledScholars` for instant rendering in "New Scholar Chat" sidebar; endpoint `GET /api/scholars/my-enrollments` returns names (and backfills if needed).
- Meeting system implemented with direct chat-based scheduling and guidance messages.

### Admin Features
- Approving a scholar updates the `User.role` to `scholar`.
- Admin message endpoint opens a direct chat on both the user and admin ends.

### Meeting Framework
- **Direct Chat-Based Scheduling**: Students and scholars can schedule meetings through direct chat conversations
- **Meeting Request System**: Students can request meetings with enrolled scholars through the chat interface
- **Scholar Dashboard**: Scholars can view and manage meeting requests, schedule meetings, and send meeting links
- **Meeting Chat Component**: Dedicated chat interface for meeting-related conversations with:
  - Meeting request handling
  - Meeting link generation and sharing
  - Meeting scheduling with date/time selection
  - Meeting status tracking (requested, scheduled, completed)
- **Admin Dashboard**: Administrators can monitor meeting activities and scholar interactions
- **Meeting Link Management**: Secure meeting link generation and sharing between students and scholars
- **Real-time Chat**: WebSocket-based real-time messaging for instant communication during meetings

### UI/UX Theme Improvements
- **Warm Modern Earth Color Palette**: Implemented natural, calming color scheme with terracotta (#E76F51), sage green (#2A9D8F), and sand beige (#F4A261) accents
- **Enhanced Chat Interface**: 
  - Selected chat items now have deep olive background (#264653) with pale white text for better visibility
  - Chat links and buttons updated with solid black text for improved readability
  - Meeting link buttons styled with emerald backgrounds and white text
- **Sidebar Improvements**: 
  - Static sidebar with independent content scrolling
  - Enhanced hover effects with white text on dashboard pages
  - Improved z-index management for top bar and sidebar layering
- **Button Styling**: 
  - "Apply as Scholar" and "Return to Main" buttons styled with sidebar colors
  - Red buttons converted to orange theme for consistency
  - Demo video and action buttons updated with white text and no transparency
- **Responsive Design**: 
  - Smooth transitions for sidebar open/close animations
  - Improved mobile hamburger menu functionality
  - Better spacing and positioning for all screen sizes

## Tech Stack
### Frontend
- React 18 + TypeScript + Vite
- React Router
- Shadcn Library
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
MEET_ENCRYPT_SECRET=yourstrongsecret

# Email notifications (Gmail SMTP)
GMAIL_USER=yourgmail@gmail.com
GMAIL_PASS=your_gmail_app_password
APP_BASE_URL=https://hikmah.ai

# Optional: debounce duplicate emails (ms). 120000 = 2 min, 0 disables
NOTIFY_DEBOUNCE_MS=120000
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

## Notification Agent (Gmail)
- Sends email notifications for human messages and meetings:
  - Student → Scholar (chat): Scholar receives email
  - Scholar → Student (chat): Student receives email
  - Student requests meeting: Scholar receives email
  - Scholar schedules/reschedules meeting: Both receive confirmation
  - Meeting link sent (auto): Both receive link
- AI messages are ignored.
- Debounce prevents duplicate emails within `NOTIFY_DEBOUNCE_MS` per recipient/session/type.
- Critical events (meeting requests/schedules/link) bypass debounce.

Backend mailer files:
- `backend/utils/mailer.js` — Nodemailer (Gmail SMTP)
- `backend/agents/notificationAgent.js` — formats and sends notifications
- Integrated in:
  - `backend/routes/chatRoutes.js`
  - `backend/routes/adminRoutes.js`
  - `backend/controllers/meetingController.js`
  - `backend/index.js` (cron link sender)

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
