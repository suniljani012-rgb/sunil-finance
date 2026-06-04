export async function onRequestDelete(context) {
  const { env, params, data } = context;
  const db = env.DB;
  const user = data.user;
  const transactionId = params.id;

  try {
    const result = await db.prepare(
      "DELETE FROM transactions WHERE id = ?1 AND user_id = ?2"
    ).bind(transactionId, user.userId).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: "Transaction not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Transaction deleted successfully" }), {
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

export async function onRequestPut(context) {
  const { request, env, params, data } = context;
  const db = env.DB;
  const user = data.user;
  const transactionId = params.id;

  try {
    const { category, description, due_date, amount, person } = await request.json();

    // Verify ownership
    const transaction = await db.prepare(
      "SELECT id FROM transactions WHERE id = ?1 AND user_id = ?2"
    ).bind(transactionId, user.userId).first();

    if (!transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Dynamic fields updates
    await db.prepare(`
      UPDATE transactions 
      SET category = COALESCE(?1, category),
          description = COALESCE(?2, description),
          due_date = COALESCE(?3, due_date),
          amount = COALESCE(?4, amount),
          person = COALESCE(?5, person)
      WHERE id = ?6
    `).bind(category, description, due_date, amount ? Number(amount) : null, person, transactionId).run();

    return new Response(JSON.stringify({ success: true, message: "Transaction updated successfully" }), {
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

// POST is used to log a payment / repayment against this loan/udhaar
export async function onRequestPost(context) {
  const { request, env, params, data } = context;
  const db = env.DB;
  const user = data.user;
  const transactionId = params.id;

  try {
    const { amount, payment_date } = await request.json();

    if (!amount) {
      return new Response(JSON.stringify({ error: "Payment amount is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify ownership and check transaction type
    const transaction = await db.prepare(
      "SELECT id, amount, type, status FROM transactions WHERE id = ?1 AND user_id = ?2"
    ).bind(transactionId, user.userId).first();

    if (!transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (transaction.status === 'paid' && transaction.type !== 'loan_given' && transaction.type !== 'loan_taken' && transaction.type !== 'udhar_given' && transaction.type !== 'udhar_taken') {
      return new Response(JSON.stringify({ error: "Cannot add payment to settled income/expense transaction" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const paymentId = crypto.randomUUID();
    const payDate = payment_date || new Date().toISOString().split('T')[0];

    // Log the payment
    await db.prepare(`
      INSERT INTO payments (id, transaction_id, amount, payment_date, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(paymentId, transactionId, Number(amount), payDate, Date.now()).run();

    // Sum all payments for this transaction
    const { total_paid } = await db.prepare(`
      SELECT SUM(amount) as total_paid FROM payments WHERE transaction_id = ?1
    `).bind(transactionId).first();

    // If total payments match or exceed the transaction amount, update status to paid
    let statusUpdated = false;
    if (total_paid >= transaction.amount) {
      await db.prepare(`
        UPDATE transactions SET status = 'paid' WHERE id = ?1
      `).bind(transactionId).run();
      statusUpdated = true;
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Repayment recorded successfully",
      repayment: {
        id: paymentId,
        amount: Number(amount),
        payment_date: payDate,
        total_paid: Number(total_paid),
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
