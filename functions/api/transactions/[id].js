export async function onRequestDelete(context) {
  const { env, params, data } = context;
  const db = env.DB;
  const user = data.user;
  const transactionId = params.id;

  try {
    // Select transaction first to adjust account balances
    const transaction = await db.prepare(
      "SELECT amount, type, account_id FROM transactions WHERE id = ?1 AND user_id = ?2"
    ).bind(transactionId, user.userId).first();

    if (!transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Revert account balance adjustment
    if (transaction.account_id) {
      const isInflow = transaction.type === 'income' || transaction.type === 'loan_taken' || transaction.type === 'udhar_taken';
      // If it was an inflow, we subtract it upon deletion; if it was an outflow, we add it back.
      const revertAdjustment = isInflow ? -Number(transaction.amount) : Number(transaction.amount);
      
      await db.prepare(
        "UPDATE accounts SET balance = balance + ?1 WHERE id = ?2 AND user_id = ?3"
      ).bind(revertAdjustment, transaction.account_id, user.userId).run();
    }

    // Delete transaction (cascading deletes will clear payments)
    await db.prepare(
      "DELETE FROM transactions WHERE id = ?1 AND user_id = ?2"
    ).bind(transactionId, user.userId).run();

    return new Response(JSON.stringify({ success: true, message: "Transaction deleted and account balance updated" }), {
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

export async function onRequestPost(context) {
  const { request, env, params, data } = context;
  const db = env.DB;
  const user = data.user;
  const transactionId = params.id;

  try {
    const { amount, payment_date, account_id } = await request.json();

    if (!amount) {
      return new Response(JSON.stringify({ error: "Payment amount is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Select transaction to know type and base accounts
    const transaction = await db.prepare(
      "SELECT id, amount, type, status, account_id FROM transactions WHERE id = ?1 AND user_id = ?2"
    ).bind(transactionId, user.userId).first();

    if (!transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const paymentId = crypto.randomUUID();
    const payDate = payment_date || new Date().toISOString().split('T')[0];

    // Record repayment payment
    await db.prepare(`
      INSERT INTO payments (id, transaction_id, amount, payment_date, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(paymentId, transactionId, Number(amount), payDate, Date.now()).run();

    // Sum repayments
    const { total_paid } = await db.prepare(`
      SELECT SUM(amount) as total_paid FROM payments WHERE transaction_id = ?1
    `).bind(transactionId).first();

    // Update status to paid if fully settled
    let statusUpdated = false;
    if (total_paid >= transaction.amount) {
      await db.prepare(`
        UPDATE transactions SET status = 'paid' WHERE id = ?1
      `).bind(transactionId).run();
      statusUpdated = true;
    }

    // Adjust target account balance
    // 1. If we lent money (loan_given/udhar_given), a repayment means we GET cash (+ balance)
    // 2. If we borrowed money (loan_taken/udhar_taken), a repayment means we PAY cash (- balance)
    const targetAccountId = account_id || transaction.account_id;
    if (targetAccountId) {
      const isLent = transaction.type === 'loan_given' || transaction.type === 'udhar_given';
      const adjustment = isLent ? Number(amount) : -Number(amount);

      await db.prepare(
        "UPDATE accounts SET balance = balance + ?1 WHERE id = ?2 AND user_id = ?3"
      ).bind(adjustment, targetAccountId, user.userId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Repayment recorded and account balances updated",
      repayment: {
        id: paymentId,
        amount: Number(amount),
        status: statusUpdated ? 'paid' : 'pending'
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
