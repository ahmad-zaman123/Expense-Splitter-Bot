<h1 align="center">💸 Expense Splitter Bot</h1>

<p align="center">
  <b>Settle group expenses over WhatsApp or a web chat with a single command.</b><br/>
  Add what each person paid, type <code>split</code>, and see who owes whom. No spreadsheets, no sign-ups.
</p>

<p align="center">
  <a href="https://expense-splitter-bot-kgsa.vercel.app"><img src="https://img.shields.io/badge/live-expense--splitter--bot-000?logo=vercel&logoColor=white&style=flat-square" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/WhatsApp-Cloud%20API-25D366?logo=whatsapp&logoColor=white&style=flat-square" alt="WhatsApp Cloud API" />
  <img src="https://img.shields.io/badge/Node.js-serverless-5FA04E?logo=nodedotjs&logoColor=white&style=flat-square" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square" alt="React 18" />
  <img src="https://img.shields.io/badge/Upstash-Redis-00E9A3?logo=redis&logoColor=white&style=flat-square" alt="Upstash Redis" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT license" /></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick start</a> ·
  <a href="#-commands">Commands</a> ·
  <a href="#-how-it-works">How it works</a> ·
  <a href="#-connect-whatsapp">Connect WhatsApp</a> ·
  <a href="#-deployment">Deployment</a>
</p>

<p align="center">
  <img src="docs/demo.gif" alt="Expense Splitter Bot demo" width="240" />
</p>

---

## 🧭 What is it?

Splitting a bill after a trip, a dinner or shared rent usually turns into awkward maths and one person eating the rounding error. This bot reduces it to three commands and a clear list of who pays whom. It runs the **same command logic** on a WhatsApp Business number and on a WhatsApp-style web chat.

| ➕ Add | 📋 List | ⚖️ Split |
|---|---|---|
| `add John 1000` for each person who paid | `list` shows everyone and the running total | `split` works out each share and who pays whom |

## ⌨️ Commands

| Command | What it does |
|---|---|
| `hi` / `hello` / `start` | Welcome message and instructions |
| `add <Name> <Amount>` | Record what a person paid. Re-adding the same name updates it. |
| `list` | Show all entries and the running total |
| `split` | Calculate who owes whom |
| `reset` | Clear the session and start a new split |

**Example**

```
add John 1000
add Mark 500
add Steve 500
split
```

```
💸 Expense Summary
👥 People: 3
💰 Total:  PKR 2000.00
📊 Share:  PKR 666.67 each

Settlements:
➡️ Mark pays John:  PKR 166.67
➡️ Steve pays John: PKR 166.67
```

Two transfers, not three, and nobody has to chase anyone for odd amounts.

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 💬 Two surfaces, one brain
WhatsApp and the web chat share a single command handler, so behaviour is identical.

### 🧮 Few transfers
A greedy creditor-to-debtor match settles everyone in at most one fewer transfer than there are people.

</td>
<td width="50%" valign="top">

### 👤 Private sessions
Each WhatsApp sender (by phone number) and each browser gets its own session, so many groups can share one bot without colliding.

### 💾 Survives restarts
Sessions live in Upstash Redis for 24 hours in production, with an in-memory fallback for local dev.

</td>
</tr>
</table>

## 🚀 Quick start

**Prerequisites:** Node.js 18+. No WhatsApp account or Redis is needed to try it locally.

```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env          # defaults are fine for local dev

npm run dev                   # API on http://localhost:3000
npm run dev:web               # web chat on http://localhost:5173 (proxies /api)
```

Try the API directly:

```bash
curl -X POST localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "demo", "text": "add John 1000"}'
# → { "reply": "…" }
```

<details>
<summary><b>🔧 Environment variables</b> (<code>.env</code>)</summary>
<br/>

| Key | Needed for | Notes |
|---|---|---|
| `WHATSAPP_TOKEN` | WhatsApp | Permanent access token from your Meta app. |
| `PHONE_NUMBER_ID` | WhatsApp | The WhatsApp Business phone number's ID. |
| `VERIFY_TOKEN` | WhatsApp | Any secret string. Meta sends it back to verify your webhook. |
| `UPSTASH_REDIS_REST_URL` | production | Leave blank locally to use the in-memory store. |
| `UPSTASH_REDIS_REST_TOKEN` | production | Pair with the URL above. |
| `PORT` | local | Dev server port. Defaults to `3000`. |

</details>

## 🧩 How it works

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
          │ Upstash Redis │  per-user sessions (24h)
          └───────────────┘
```

**The split.** Total the amounts and divide by the number of people to get an equal share. Anyone above it is a *creditor*, anyone below is a *debtor*. Repeatedly match the largest creditor with the largest debtor until everyone is square.

## 📲 Connect WhatsApp

<details>
<summary><b>Steps (Meta WhatsApp Business Cloud API)</b></summary>
<br/>

1. Create an app at [developers.facebook.com](https://developers.facebook.com) and add the **WhatsApp** product.
2. Copy the **phone number ID** and create a **permanent access token**, then put them in `PHONE_NUMBER_ID` and `WHATSAPP_TOKEN`.
3. Choose any secret string for `VERIFY_TOKEN`.
4. Deploy (or tunnel locally with `ngrok http 3000`) so Meta can reach `https://<your-host>/webhook`.
5. In **WhatsApp → Configuration**, set the callback URL to `https://<your-host>/webhook` and the verify token to your `VERIFY_TOKEN`, then subscribe to the **messages** field.
6. Message your WhatsApp Business number `hi`.

</details>

## 🔌 API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/message` | `POST` | Web chat. Body `{ "sessionId", "text" }`, returns `{ "reply" }`. |
| `/api/reset` | `POST` | Clear a session. Body `{ "sessionId" }`. |
| `/api/webhook` (also `/webhook`) | `GET`, `POST` | WhatsApp: `GET` answers Meta's verification, `POST` receives messages. |
| `/api/health` | `GET` | Liveness check, returns `{ "ok": true }`. |

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| **Backend** | Node.js serverless functions (Vercel), Express for local dev |
| **State** | Upstash Redis (in-memory fallback locally) |
| **Frontend** | React 18, Vite |
| **Messaging** | Meta WhatsApp Business Cloud API |

## 🗂️ Project structure

```
Expense-Splitter-Bot/
├── backend/
│   ├── handler.js      shared command handler
│   ├── splitter.js     settlement algorithm
│   ├── session.js      Redis / in-memory store
│   ├── webhook.js      WhatsApp verify + incoming messages
│   ├── message.js      web chat endpoint
│   ├── reset.js        clear a session
│   └── whatsapp.js     outbound WhatsApp sender
├── api/                thin shims re-exporting backend/ (Vercel convention)
├── frontend/           React + Vite web chat
├── docs/               demo GIF
├── dev-server.js       local Express server
└── vercel.json         build + /webhook rewrite
```

## ☁️ Deployment

Deploys as a single **Vercel** project, so the web app and the WhatsApp webhook share one domain. `vercel.json` builds the frontend and rewrites `/webhook` to `/api/webhook`.

1. Create an Upstash Redis database.
2. Import the repo in Vercel and set the environment variables above.
3. Point Meta's webhook at `https://<your-domain>/webhook` (see [Connect WhatsApp](#-connect-whatsapp)).

## 📄 License

[MIT](LICENSE) © 2026 Ahmad Zaman
