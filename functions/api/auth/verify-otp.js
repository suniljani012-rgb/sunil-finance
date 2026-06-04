import { signJWT } from './_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;
  
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 database binding missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { email, otp } = await request.json();
    
    if (!email || !otp) {
      return new Response(JSON.stringify({ error: "Email and OTP are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = await db.prepare(
      "SELECT id, username, email, otp, otp_expiry, is_verified FROM users WHERE email = ?1"
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (user.is_verified) {
      return new Response(JSON.stringify({ error: "Account already verified" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (user.otp !== otp) {
      return new Response(JSON.stringify({ error: "Invalid OTP code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (user.otp_expiry < Date.now()) {
      return new Response(JSON.stringify({ error: "OTP code has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify user and clear OTP
    await db.prepare(
      "UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL WHERE id = ?1"
    ).bind(user.id).run();

    // Create JWT
    const secret = env.JWT_SECRET || "sunil-finance-secret-key-98765";
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiry
    };
    
    const token = await signJWT(payload, secret);

    return new Response(JSON.stringify({
      success: true,
      message: "Account verified successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
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
