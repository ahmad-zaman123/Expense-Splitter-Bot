// ─────────────────────────────────────────────
// Core Expense Splitter Logic
// Pure function — no dependencies
// ─────────────────────────────────────────────

function splitExpenses(expenses) {
  if (!expenses || expenses.length < 2) return { error: "Need at least 2 people." };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  if (total === 0) return { error: "Total is 0. Nothing to split." };

  const share = total / expenses.length;

  // Each person's balance: positive = overpaid, negative = underpaid
  const balances = expenses.map(e => ({
    name: e.name,
    balance: Math.round((e.amount - share) * 100) / 100,
  }));

  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors   = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor   = debtors[j];
    const amount   = Math.min(creditor.balance, Math.abs(debtor.balance));
    const rounded  = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      transactions.push({ from: debtor.name, to: creditor.name, amount: rounded });
    }

    creditor.balance = Math.round((creditor.balance - amount) * 100) / 100;
    debtor.balance   = Math.round((debtor.balance   + amount) * 100) / 100;

    if (creditor.balance === 0) i++;
    if (debtor.balance   === 0) j++;
  }

  return { total, share, transactions };
}

module.exports = { splitExpenses };
