import { verifyJWT } from './auth/_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Allow CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  // Skip authentication for authentication endpoints
  if (url.pathname.startsWith("/api/auth/")) {
    const res = await context.next();
    const newHeaders = new Headers(res.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders
    });
  }

  // Read Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized. Missing token." }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  const token = authHeader.split(" ")[1];
  const secret = env.JWT_SECRET || "sunil-finance-secret-key-98765";
  const user = await verifyJWT(token, secret);

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized. Invalid or expired token." }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  // Attach parsed user payload to context data for endpoint access
  context.data.user = user;

  const res = await context.next();
  
  // Inject CORS headers on response
  const newHeaders = new Headers(res.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }
  
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders
  });
}
