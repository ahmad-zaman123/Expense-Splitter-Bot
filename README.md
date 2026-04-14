# Expense Splitter Bot

An expense splitter that calculates who owes whom in a group. Available on two surfaces:

- **WhatsApp** — powered by the Meta WhatsApp Business Cloud API
- **Web chat** — a React + Vite frontend that talks to the same backend

Both surfaces share the same message handler, so commands behave identically.

## Links

- **Live Demo:** _coming soon_
- **Replit:** _coming soon_

## Features

- Add people and their expenses via simple chat commands
- Automatically calculates equal share per person
- Shows exactly who needs to pay whom and how much
- Per-user session management (each user has their own expense list)
- Update an existing person's amount by adding them again

## Commands

| Command | Description |
|---------|-------------|
| `hi` / `hello` / `start` | Show welcome message and instructions |
| `add <Name> <Amount>` | Add a person with their paid amount |
| `list` | View all current entries and total |
| `split` | Calculate and show settlements |
| `reset` | Clear your session and start over |

**Example:**
```
add John 1000
add Mark 500
add Steve 500
split
```

**Output:**
```
💸 Expense Summary
👥 People: 3
💰 Total:  PKR 2000.00
📊 Share:  PKR 666.67 each

Settlements:
➡️ Mark pays John: PKR 166.67
➡️ Steve pays John: PKR 166.67
```

## Project Structure

```
expense-splitter-bot/
├── backend/     # Node.js + Express server, WhatsApp webhook, core splitter logic
└── frontend/    # React + Vite web chat UI
```

## Running Locally

Backend:
```
cd backend
npm install
npm run dev
```

Frontend:
```
cd frontend
npm install
npm run dev
```

## Tech Stack

- **Backend:** Node.js, Express, Axios
- **Frontend:** React 18, Vite
- **API:** Meta WhatsApp Business Cloud API
