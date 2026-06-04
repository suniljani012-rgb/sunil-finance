export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    // Select transactions with relational details
    const stmt = db.prepare(`
      SELECT t.*, 
             COALESCE(a.name, 'Unknown') as account_name,
             COALESCE(p.name, '') as payee_name,
             COALESCE(h.name, t.category) as category_name,
             COALESCE(l.name, '') as loan_name,
             COALESCE((SELECT SUM(pm.amount) FROM payments pm WHERE pm.transaction_id = t.id), 0) as repaid_amount
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN payees p ON t.person_id = p.id
      LEFT JOIN headers h ON t.category_id = h.id
      LEFT JOIN loans l ON t.loan_id = l.id
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
    const { 
      type, 
      amount, 
      category_id, 
      category, // fallback text category
      description, 
      person_id, 
      account_id, 
      utr_number, 
      status, 
      due_date, 
      loan_id, 
      emi_number 
    } = await request.json();

    if (!type || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields (type, amount)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const transactionId = crypto.randomUUID();
    const isPending = (type !== 'income' && type !== 'expense') && status === 'pending';
    const finalStatus = isPending ? 'pending' : 'paid';

    // Insert transaction
    await db.prepare(`
      INSERT INTO transactions (
        id, user_id, type, amount, category_id, category, description, 
        person_id, account_id, utr_number, status, due_date, loan_id, emi_number, created_at
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
    `).bind(
      transactionId,
      user.userId,
      type,
      Number(amount),
      category_id || null,
      category || "",
      description || "",
      person_id || null,
      account_id || null,
      utr_number || null,
      finalStatus,
      due_date || null,
      loan_id || null,
      emi_number ? Number(emi_number) : null,
      Date.now()
    ).run();

    // If it's a paid transaction, record full payment
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

    // Account ledger update logic: adjust balance on deposit or withdrawal
    if (account_id) {
      const isInflow = type === 'income' || type === 'loan_taken' || type === 'udhar_taken';
      const adjustment = isInflow ? Number(amount) : -Number(amount);
      
      // Update account balance
      await db.prepare(
        "UPDATE accounts SET balance = balance + ?1 WHERE id = ?2 AND user_id = ?3"
      ).bind(adjustment, account_id, user.userId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Transaction logged successfully",
      transactionId
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
