export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    const stmt = db.prepare(`
      SELECT t.*, 
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.transaction_id = t.id), 0) as repaid_amount
      FROM transactions t
      WHERE t.user_id = ?1 
        AND t.due_date IS NOT NULL 
        AND t.status = 'pending'
      ORDER BY t.due_date ASC
    `).bind(user.userId);
    
    const { results } = await stmt.all();

    return new Response(JSON.stringify({ success: true, reminders: results }), {
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
