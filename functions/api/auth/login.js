import { verifyPassword, generateOTP, sendOTPEmail } from './_utils.js';

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
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Try to match email, or username
    const user = await db.prepare(
      "SELECT id, username, email, password_hash, is_verified FROM users WHERE email = ?1 OR username = ?1"
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!user.is_verified) {
      return new Response(JSON.stringify({ 
        error: "Account not verified", 
        unverified: true, 
        email: user.email 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify Password
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate login OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    await db.prepare(
      "UPDATE users SET otp = ?1, otp_expiry = ?2 WHERE id = ?3"
    ).bind(otp, otpExpiry, user.id).run();

    const gasUrl = env.GAS_WEBAPP_URL;
    const mailSent = await sendOTPEmail(gasUrl, user.email, otp, user.username, "login");

    return new Response(JSON.stringify({
      success: true,
      message: "Login OTP sent to email",
      email: user.email,
      mockOtp: gasUrl ? undefined : otp // For local dev testing ease
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
