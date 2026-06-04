export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    // 1. Calculate combined cash balance from all bank/cash accounts
    const { total_cash } = await db.prepare(
      "SELECT SUM(balance) as total_cash FROM accounts WHERE user_id = ?1"
    ).bind(user.userId).first();

    // 2. Fetch all transaction logs to calculate totals
    const { results } = await db.prepare(`
      SELECT t.type, t.amount,
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.transaction_id = t.id), 0) as repaid_amount
      FROM transactions t
      WHERE t.user_id = ?1
    `).bind(user.userId).all();

    let totalIncome = 0;
    let totalExpense = 0;
    let toReceive = 0;
    let toPay = 0;

    for (const t of results) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
      } else if (t.type === 'loan_given' || t.type === 'udhar_given') {
        toReceive += (t.amount - t.repaid_amount);
      } else if (t.type === 'loan_taken' || t.type === 'udhar_taken') {
        toPay += (t.amount - t.repaid_amount);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalIncome,
        totalExpense,
        currentBalance: total_cash || 0.0,
        toReceive,
        toPay
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
