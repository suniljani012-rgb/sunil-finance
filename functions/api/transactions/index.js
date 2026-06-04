export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    // Select transactions with aggregated repayments
    const stmt = db.prepare(`
      SELECT t.*, 
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.transaction_id = t.id), 0) as repaid_amount
      FROM transactions t
      WHERE t.user_id = ?1
      ORDER BY t.created_at DESC
    `).bind(user.userId);
    
    const { results } = await stmt.all();

    return new Response(JSON.stringify({ success: true, transactions: results }), {
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
  const { request, env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    const { type, amount, category, description, person, status, due_date } = await request.json();

    if (!type || !amount || !category) {
      return new Response(JSON.stringify({ error: "Missing required fields (type, amount, category)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const transactionId = crypto.randomUUID();
    const isPending = (type !== 'income' && type !== 'expense') && status === 'pending';
    const finalStatus = isPending ? 'pending' : 'paid';

    // Insert transaction
    await db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, category, description, person, status, due_date, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    `).bind(
      transactionId,
      user.userId,
      type,
      Number(amount),
      category,
      description || "",
      person || null,
      finalStatus,
      due_date || null,
      Date.now()
    ).run();

    // If it's a paid transaction (or income/expense/settled loan), log a full payment immediately
    if (finalStatus === 'paid') {
      const paymentId = crypto.randomUUID();
      const today = new Date().toISOString().split('T')[0];
      await db.prepare(`
        INSERT INTO payments (id, transaction_id, amount, payment_date, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
      `).bind(
        paymentId,
        transactionId,
        Number(amount),
        today,
        Date.now()
      ).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Transaction recorded successfully",
      transaction: {
        id: transactionId,
        type,
        amount,
        category,
        description,
        person,
        status: finalStatus,
        due_date,
        repaid_amount: finalStatus === 'paid' ? amount : 0
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
