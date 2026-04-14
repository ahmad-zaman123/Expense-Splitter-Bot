const { splitExpenses } = require("./splitter");
const store = require("./session");

async function handleMessage(sessionId, text) {
  const session = await store.get(sessionId);
  const lower = text.toLowerCase();

  if (["hi", "hello", "start", "help"].includes(lower)) {
    return (
      "👋 Welcome to *Expense Splitter Bot*!\n\n" +
      "Here's how to use me:\n\n" +
      "1️⃣ Add people:\n" +
      "   `add John 1000`\n" +
      "   `add Mark 500`\n" +
      "   `add Steve 500`\n\n" +
      "2️⃣ See your list:\n" +
      "   `list`\n\n" +
      "3️⃣ Calculate who owes whom:\n" +
      "   `split`\n\n" +
      "4️⃣ Start over:\n" +
      "   `reset`"
    );
  }

  if (lower.startsWith("add ")) {
    const parts = text.trim().split(/\s+/);
    const name = parts[1];
    const amount = parseFloat(parts[2]);

    if (!name || isNaN(amount) || amount < 0) {
      return (
        "⚠️ Invalid format. Use:\n" +
        "`add <Name> <Amount>`\n\n" +
        "Example: `add John 1000`"
      );
    }

    const existing = session.expenses.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      existing.amount = amount;
      await store.save(sessionId, session);
      return `✏️ Updated *${name}* → PKR ${amount.toFixed(2)}`;
    }

    session.expenses.push({ name, amount });
    await store.save(sessionId, session);
    return `✅ Added *${name}* — PKR ${amount.toFixed(2)}\n\nSend \`list\` to see all, or \`split\` to calculate.`;
  }

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
      result.transactions.forEach((t) => {
        response += `➡️ *${t.from}* pays *${t.to}*: PKR ${t.amount.toFixed(2)}\n`;
      });
    }

    response += "\n\nSend `reset` to start a new split.";
    return response;
  }

  if (lower === "reset") {
    await store.clear(sessionId);
    return "🔄 Session cleared! Send `hi` to start again.";
  }

  return (
    "🤔 I didn't understand that.\n\n" +
    "Send `hi` to see all available commands."
  );
}

module.exports = { handleMessage };
