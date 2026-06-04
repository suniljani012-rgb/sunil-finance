import { hashPassword, generateOTP, sendOTPEmail } from './_utils.js';

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
    const { username, email, password } = await request.json();
    
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user already exists
    const existingUser = await db.prepare(
      "SELECT id, is_verified FROM users WHERE email = ?1"
    ).bind(email).first();

    if (existingUser) {
      if (existingUser.is_verified) {
        return new Response(JSON.stringify({ error: "Email is already registered" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      // If user exists but is not verified, we can overwrite/update their registration details
      const userId = existingUser.id;
      const passHash = await hashPassword(password);
      const otp = generateOTP();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

      await db.prepare(
        "UPDATE users SET username = ?1, password_hash = ?2, otp = ?3, otp_expiry = ?4, created_at = ?5 WHERE id = ?6"
      ).bind(username, passHash, otp, otpExpiry, Date.now(), userId).run();

      const gasUrl = env.GAS_WEBAPP_URL;
      const mailSent = await sendOTPEmail(gasUrl, email, otp, username, "register");

      return new Response(JSON.stringify({
        success: true,
        message: "OTP resent. Please check your email.",
        email,
        mockOtp: gasUrl ? undefined : otp // For local dev testing ease
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Brand new user registration
    const userId = crypto.randomUUID();
    const passHash = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    await db.prepare(
      "INSERT INTO users (id, username, email, password_hash, otp, otp_expiry, is_verified, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)"
    ).bind(userId, username, email, passHash, otp, otpExpiry, Date.now()).run();

    const gasUrl = env.GAS_WEBAPP_URL;
    const mailSent = await sendOTPEmail(gasUrl, email, otp, username, "register");

    return new Response(JSON.stringify({
      success: true,
      message: "Registration OTP sent to email.",
      email,
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
