export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    // Select loans and aggregate all repayments made against transactions linked to this loan!
    // A repayment is a transaction of type 'expense' or payment logged against a loan_taken transaction.
    // Let's select all loans first, then let the frontend compute the repayments, or we can run an aggregate subquery.
    // Query:
    const stmt = db.prepare(`
      SELECT l.*,
             COALESCE((
               SELECT SUM(t.amount) 
               FROM transactions t 
               WHERE t.loan_id = l.id AND t.user_id = l.user_id
             ), 0) as total_repaid_repayments
      FROM loans l
      WHERE l.user_id = ?1
      ORDER BY l.created_at DESC
    `).bind(user.userId);

    const { results } = await stmt.all();

    return new Response(JSON.stringify({ success: true, loans: results }), {
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
    const { name, total_amount, emi_amount, interest_rate, tenure_months, lender, start_date, due_day } = await request.json();

    if (!name || !total_amount || !emi_amount || !lender || !start_date) {
      return new Response(JSON.stringify({ error: "Missing required fields (name, total_amount, emi_amount, lender, start_date)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const loanId = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO loans (id, user_id, name, total_amount, emi_amount, interest_rate, tenure_months, lender, start_date, due_day, status, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'active', ?11)
    `).bind(
      loanId,
      user.userId,
      name,
      Number(total_amount),
      Number(emi_amount),
      Number(interest_rate || 0.0),
      Number(tenure_months || 12),
      lender,
      start_date,
      Number(due_day || 1),
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      loan: { id: loanId, name, total_amount, emi_amount, interest_rate, tenure_months, lender, start_date, due_day, status: 'active' }
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

export async function onRequestDelete(context) {
  const { request, env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Loan ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.prepare(
      "DELETE FROM loans WHERE id = ?1 AND user_id = ?2"
    ).bind(id, user.userId).run();

    return new Response(JSON.stringify({ success: true, message: "Loan account deleted successfully" }), {
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
