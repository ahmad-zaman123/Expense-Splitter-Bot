// ─────────────────────────────────────────────
// WhatsApp Expense Splitter Bot
// Meta WhatsApp Business API Integration
// ─────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const axios   = require("axios");
const { splitExpenses } = require("./core/splitter");

const app = express();
app.use(express.json());

const {
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  VERIFY_TOKEN,
  PORT = 3000,
} = process.env;

// ─────────────────────────────────────────────
// In-memory session store
// Keyed by user's WhatsApp phone number
// Each session holds a list of expense entries
// ─────────────────────────────────────────────
const sessions = {};

function getSession(phone) {
  if (!sessions[phone]) sessions[phone] = { expenses: [] };
  return sessions[phone];
}

// ─────────────────────────────────────────────
// STEP 1: Webhook Verification
// Meta calls GET /webhook to verify your server
// ─────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified by Meta.");
    return res.status(200).send(challenge);
  }

  console.warn("❌ Webhook verification failed.");
  res.sendStatus(403);
});

// ─────────────────────────────────────────────
// STEP 2: Receive Incoming Messages
// Meta sends POST /webhook whenever a user messages you
// ─────────────────────────────────────────────
app.post("/webhook", (req, res) => {
  const body = req.body;

  // Confirm it's a WhatsApp message event
  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  const entry   = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value   = changes?.value;
  const message = value?.messages?.[0];

  // Ignore non-text messages (images, audio, etc.)
  if (!message || message.type !== "text") return res.sendStatus(200);

  const from = message.from;               // sender's phone number
  const text = message.text.body.trim();   // message content

  console.log(`📨 From ${from}: ${text}`);

  // Process the message and get a reply
  const reply = handleMessage(from, text);

  // Send the reply back via WhatsApp
  sendMessage(from, reply);

  res.sendStatus(200);
});

// ─────────────────────────────────────────────
// STEP 3: Message Handler
// Parses user commands and manages session state
//
// Commands:
//   hi / hello / start  → welcome + instructions
//   add <Name> <Amount> → add a person
//   list                → show current entries
//   split               → calculate & show results
//   reset               → clear session
// ─────────────────────────────────────────────
function handleMessage(phone, text) {
  const session = getSession(phone);
  const lower   = text.toLowerCase();

  // ── Greeting ──
  if (["hi", "hello", "start", "help"].includes(lower)) {
    return (
      "👋 Welcome to *Expense Splitter Bot*!\n\n" +
      "Here's how to use me:\n\n" +
      "1️⃣ Add people:\n" +
      "   `add Ali 1000`\n" +
      "   `add Ahmad 500`\n" +
      "   `add Sara 500`\n\n" +
      "2️⃣ See your list:\n" +
      "   `list`\n\n" +
      "3️⃣ Calculate who owes whom:\n" +
      "   `split`\n\n" +
      "4️⃣ Start over:\n" +
      "   `reset`"
    );
  }

  // ── Add a person: "add Ali 1000" ──
  if (lower.startsWith("add ")) {
    const parts  = text.trim().split(/\s+/);  // split on any whitespace
    const name   = parts[1];
    const amount = parseFloat(parts[2]);

    if (!name || isNaN(amount) || amount < 0) {
      return (
        '⚠️ Invalid format. Use:\n' +
        '`add <Name> <Amount>`\n\n' +
        'Example: `add Ali 1000`'
      );
    }

    // Check if name already exists — update amount instead of duplicating
    const existing = session.expenses.find(
      e => e.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      existing.amount = amount;
      return `✏️ Updated *${name}* → PKR ${amount.toFixed(2)}`;
    }

    session.expenses.push({ name, amount });
    return `✅ Added *${name}* — PKR ${amount.toFixed(2)}\n\nSend \`list\` to see all, or \`split\` to calculate.`;
  }

  // ── List current entries ──
  if (lower === "list") {
    if (session.expenses.length === 0) {
      return "📋 No entries yet. Use `add <Name> <Amount>` to start.";
    }

    const total = session.expenses.reduce((s, e) => s + e.amount, 0);
    const lines = session.expenses.map(
      (e, i) => `${i + 1}. ${e.name} — PKR ${e.amount.toFixed(2)}`
    );

    return (
      "📋 *Current Entries:*\n\n" +
      lines.join("\n") +
      `\n\n💰 *Total:* PKR ${total.toFixed(2)}\n\n` +
      "Send `split` to calculate settlements."
    );
  }

  // ── Split / Calculate ──
  if (["split", "calculate", "done"].includes(lower)) {
    if (session.expenses.length < 2) {
      return "⚠️ Add at least 2 people before splitting.\n\nUse `add <Name> <Amount>`.";
    }

    const result = splitExpenses(session.expenses);

    if (result.error) return `⚠️ ${result.error}`;

    let response =
      `💸 *Expense Summary*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👥 People: ${session.expenses.length}\n` +
      `💰 Total:  PKR ${result.total.toFixed(2)}\n` +
      `📊 Share:  PKR ${result.share.toFixed(2)} each\n\n`;

    if (result.transactions.length === 0) {
      response += "✅ Everyone paid equally — no settlements needed!";
    } else {
      response += "*Settlements:*\n";
      result.transactions.forEach(t => {
        response += `➡️ *${t.from}* pays *${t.to}*: PKR ${t.amount.toFixed(2)}\n`;
      });
    }

    response += "\n\nSend `reset` to start a new split.";
    return response;
  }

  // ── Reset session ──
  if (lower === "reset") {
    session.expenses = [];
    return "🔄 Session cleared! Send `hi` to start again.";
  }

  // ── Unknown command ──
  return (
    "🤔 I didn't understand that.\n\n" +
    "Send `hi` to see all available commands."
  );
}

// ─────────────────────────────────────────────
// STEP 4: Send a WhatsApp Message
// Calls Meta Cloud API to send a text reply
// ─────────────────────────────────────────────
async function sendMessage(to, body) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ Reply sent to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send message:", err.response?.data || err.message);
  }
}

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Bot running on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
});
