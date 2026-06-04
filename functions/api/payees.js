export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    const { results } = await db.prepare(
      "SELECT * FROM payees WHERE user_id = ?1 ORDER BY name ASC"
    ).bind(user.userId).all();

    return new Response(JSON.stringify({ success: true, payees: results }), {
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
    const { name, phone, email, upi_id, account_number, ifsc } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({ error: "Payee Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const payeeId = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO payees (id, user_id, name, phone, email, upi_id, account_number, ifsc, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `).bind(
      payeeId, 
      user.userId, 
      name, 
      phone || null, 
      email || null, 
      upi_id || null, 
      account_number || null, 
      ifsc || null, 
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      payee: { id: payeeId, name, phone, email, upi_id, account_number, ifsc }
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
      return new Response(JSON.stringify({ error: "Payee ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.prepare(
      "DELETE FROM payees WHERE id = ?1 AND user_id = ?2"
    ).bind(id, user.userId).run();

    return new Response(JSON.stringify({ success: true, message: "Payee deleted successfully" }), {
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
