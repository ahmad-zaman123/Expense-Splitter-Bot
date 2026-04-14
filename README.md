# Expense Splitter Bot

An expense splitter that calculates who owes whom in a group. Available on two surfaces:

- **WhatsApp** — powered by the Meta WhatsApp Business Cloud API
- **Web chat** — a React + Vite frontend with a WhatsApp-style UI

Both surfaces share the same message handler, so commands behave identically. Designed to deploy as a single Vercel project.

## Features

- Add people and their expenses via simple chat commands
- Automatically calculates equal share per person
- Shows exactly who needs to pay whom and how much
- Per-user session management (persistent via Upstash Redis in production)
- Update an existing person's amount by adding them again

## Commands

| Command | Description |
|---------|-------------|
| `hi` / `hello` / `start` | Show welcome message and instructions |
| `add <Name> <Amount>` | Add a person with their paid amount |
| `list` | View all current entries and total |
| `split` | Calculate and show settlements |
| `reset` | Clear your session and start over |

## Project Structure

```
expense-splitter-bot/
├── backend/            # All server logic lives here
│   ├── webhook.js      # WhatsApp webhook (GET verify + POST messages)
│   ├── message.js      # Web chat: POST /api/message
│   ├── reset.js        # Web chat: POST /api/reset
│   ├── health.js       # GET /api/health
│   ├── handler.js      # Shared command handler
│   ├── splitter.js     # Core split math
│   ├── session.js      # Redis / in-memory session store
│   └── whatsapp.js     # WhatsApp Cloud API sender
├── api/                # Thin Vercel shims — each file just re-exports from backend/
├── frontend/           # React + Vite web chat UI
├── dev-server.js       # Local Express server that mounts the backend handlers
├── vercel.json
└── package.json
```

## Running Locally

1. Copy env file: `cp .env.example .env` and fill in values (all optional for local web testing).
2. Install deps:
   ```
   npm install
   cd frontend && npm install && cd ..
   ```
3. In one terminal: `npm run dev` (API on http://localhost:3000)
4. In another: `npm run dev:web` (Web on http://localhost:5173, proxies `/api` to 3000)

Without Upstash env vars, sessions use an in-memory store — fine for local dev.

## Deploying to Vercel

1. Push repo to GitHub.
2. Create an [Upstash Redis](https://upstash.com/) database (free tier). Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. Import the repo on Vercel → framework: **Other**. The included `vercel.json` handles the rest.
4. Set environment variables on Vercel:
   - `WHATSAPP_TOKEN`
   - `PHONE_NUMBER_ID`
   - `VERIFY_TOKEN`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Deploy.
6. In the Meta Developer Dashboard → WhatsApp → Configuration:
   - Callback URL: `https://<your-app>.vercel.app/api/webhook`
   - Verify token: same as `VERIFY_TOKEN`
   - Subscribe to `messages`
7. Add test phone numbers under WhatsApp → API Setup → Recipient phone numbers.

Your Vercel URL now serves both the web chat (at `/`) and the WhatsApp webhook (at `/api/webhook`).

## Tech Stack

- **Backend:** Node.js serverless functions on Vercel, Upstash Redis for sessions
- **Frontend:** React 18, Vite, WhatsApp-style UI
- **API:** Meta WhatsApp Business Cloud API
