export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    const { results } = await db.prepare(
      "SELECT * FROM accounts WHERE user_id = ?1 ORDER BY name ASC"
    ).bind(user.userId).all();

    return new Response(JSON.stringify({ success: true, accounts: results }), {
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
    const { name, type, balance } = await request.json();

    if (!name || !type) {
      return new Response(JSON.stringify({ error: "Name and type are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const accountId = crypto.randomUUID();
    const initialBalance = balance ? Number(balance) : 0.0;

    await db.prepare(
      "INSERT INTO accounts (id, user_id, name, type, balance, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    ).bind(accountId, user.userId, name, type, initialBalance, Date.now()).run();

    return new Response(JSON.stringify({
      success: true,
      account: { id: accountId, name, type, balance: initialBalance }
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
      return new Response(JSON.stringify({ error: "Account ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.prepare(
      "DELETE FROM accounts WHERE id = ?1 AND user_id = ?2"
    ).bind(id, user.userId).run();

    return new Response(JSON.stringify({ success: true, message: "Account deleted successfully" }), {
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
