# Expense Splitter Bot

Settle group expenses over **WhatsApp** or a **web chat** with a single command. Add what each person paid, type `split`, and instantly see who owes whom and how much.

No spreadsheets. No sign-ups. Just chat.

🔗 **Live demo:** https://expense-splitter-bot-kgsa.vercel.app

## Demo

<p align="center">
  <img src="docs/demo.gif" alt="Expense Splitter Bot demo" width="360" />
</p>

## Why

Splitting bills after a trip, dinner, or shared rent usually turns into awkward math, half-remembered Venmo-ing, and one person eating the rounding error. This bot reduces it to three commands — `add`, `list`, `split` — and always produces the minimum number of transactions needed to settle up fairly.

## How It Works

Everyone's paid amounts go in. The bot:

1. Computes each person's **equal share** of the total.
2. Marks each person as a **creditor** (overpaid) or **debtor** (underpaid).
3. Greedily matches the biggest creditor with the biggest debtor until everyone is square — producing the fewest possible transfers.

**Example**

```
add John 1000
add Mark 500
add Steve 500
split
```

**Output**

```
💸 Expense Summary
👥 People: 3
💰 Total:  PKR 2000.00
📊 Share:  PKR 666.67 each

Settlements:
➡️ Mark pays John:  PKR 166.67
➡️ Steve pays John: PKR 166.67
```

Two transactions, not three. No one has to chase anyone for odd amounts.

## Commands

| Command | Description |
|---------|-------------|
| `hi` / `hello` / `start` | Welcome message + instructions |
| `add <Name> <Amount>` | Add a person with their paid amount (re-adding updates) |
| `list` | See all current entries and the running total |
| `split` | Calculate who owes whom |
| `reset` | Clear the session and start a new split |

## Features

- Works on WhatsApp **and** a web chat, sharing identical command logic
- WhatsApp-style web UI — bubbles, ticks, typing indicator, doodle background
- Per-user sessions so multiple groups can use the same bot without colliding
- Persistent session storage (Redis) so in-progress splits survive restarts
- Minimum-transactions settlement algorithm

## Two Ways to Use It

**WhatsApp**
Message the bot on your WhatsApp Business number. Each sender gets their own private expense session keyed by phone number.

**Web chat**
Open the deployed URL. Your session persists in the browser via `localStorage`, so refreshes don't wipe your list.

Both surfaces hit the same backend handler, so behavior stays consistent.

## Architecture

```
┌─────────────┐      ┌─────────────┐
│  WhatsApp   │      │   Browser   │
│   (Meta)    │      │  (React)    │
└──────┬──────┘      └──────┬──────┘
       │ webhook            │ /api/message
       ▼                    ▼
   ┌───────────────────────────┐
   │  Shared handler (Node.js) │
   │  add / list / split / …   │
   └──────────────┬────────────┘
                  │
                  ▼
          ┌───────────────┐
          │ Upstash Redis │  per-user sessions
          └───────────────┘
```

Deployed as a single Vercel project — the web app and the WhatsApp webhook live at the same domain.

## Project Structure

```
expense-splitter-bot/
├── backend/            # All server logic
│   ├── webhook.js      # WhatsApp webhook (verify + incoming messages)
│   ├── message.js      # Web chat endpoint
│   ├── reset.js        # Clear session endpoint
│   ├── handler.js      # Shared command handler
│   ├── splitter.js     # Settlement algorithm
│   ├── session.js      # Redis / in-memory store
│   └── whatsapp.js     # Outbound WhatsApp sender
├── api/                # Thin shims re-exporting from backend/ (Vercel convention)
├── frontend/           # React + Vite web chat
├── docs/               # README assets (demo GIF, screenshots)
└── dev-server.js       # Local Express server for development
```

## Tech Stack

- **Backend:** Node.js serverless functions (Vercel), Upstash Redis
- **Frontend:** React 18, Vite
- **Messaging:** Meta WhatsApp Business Cloud API
