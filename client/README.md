# Islamic Scholar AI Chatbot

A modern web application that allows users to interact with an AI-powered Islamic scholar, find Qibla direction, and access Islamic resources. Built with React, TypeScript, Tailwind CSS, and React Router.

## Features

- **Home Page:** Beautiful landing page introducing the app and its features.
- **AI Chatbot:** Chat with an AI Islamic scholar for answers based on authentic sources (Quran, Hadith, etc.).
- **Qibla Finder:** Find the direction of the Kaaba from your current location using geolocation and compass.
- **Islamic Resources:** (Coming soon) Access to Quran, Hadith, and other scholarly resources.
- **Responsive UI:** Stunning, mobile-friendly design with dark mode support.
- **Sidebar & Topbar:** Easy navigation with a sidebar and topbar, including dark mode toggle.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, React Router DOM, Heroicons, Axios
- **Backend:** (You must provide your own API endpoint for chat functionality)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/islamic-scholar-ai.git
   cd islamic-scholar-ai/client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to `http://localhost:5173` (or the port shown in your terminal).

### API Setup
- The chatbot uses an API endpoint for AI responses. Update the `API_URL` in `src/services/chatService.ts` to your backend endpoint.
- The payload sent is:
  ```json
  {
    "message": "User's question",
    "conversation": [
      { "role": "user", "content": "..." },
      { "role": "assistant", "content": "..." }
    ]
  }
  ```
- The backend should return:
  ```json
  { "response": "AI's answer" }
  ```

## Project Structure

```
client/
├── src/
│   ├── components/         # React components (HomePage, ChatBot, QiblaFinder, Sidebar, TopBar, etc.)
│   ├── hooks/              # Custom React hooks (useChat)
│   ├── services/           # API and utility services (chatService)
│   ├── App.tsx             # Main app component with routing
│   └── ...
├── public/
│   └── assets/             # Static assets (logo, images)
├── tailwind.config.js      # Tailwind CSS config
├── package.json            # Project metadata and scripts
└── ...
```

## Customization
- **Branding:** Update the logo in `public/assets/logo.png` and app name in `Sidebar` and `TopBar`.
- **API:** Integrate your own backend for real AI answers.
- **Resources:** Add more Islamic resources in the Resources section.

## License
MIT

---

### Credits
- [Heroicons](https://heroicons.com/) for icons
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Unsplash](https://unsplash.com/) for demo images

---

**May Allah grant us beneficial knowledge!**
