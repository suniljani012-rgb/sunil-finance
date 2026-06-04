// Auth Utilities using Web Crypto API for Cloudflare Workers compatibility

// Base64url encoding / decoding helpers
async function base64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Generate JWT token
export async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = await base64urlEncode(JSON.stringify(header));
  const encodedPayload = await base64urlEncode(JSON.stringify(payload));
  
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(tokenInput)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
  return `${tokenInput}.${encodedSignature}`;
}

// Verify JWT token
export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const tokenInput = `${encodedHeader}.${encodedPayload}`;
    
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    // Decode signature
    const signatureBin = atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'));
    const signature = new Uint8Array(signatureBin.length);
    for (let i = 0; i < signatureBin.length; i++) {
      signature[i] = signatureBin.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      enc.encode(tokenInput)
    );
    
    if (!isValid) return null;
    
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    
    // Check expiry
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

// Hash password using PBKDF2 (native Web Crypto)
export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const salt = saltHex 
    ? new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
    
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign"]
  );
  
  const exported = await crypto.subtle.exportKey("raw", derivedKey);
  const hashHex = Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHexStr = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHexStr}:${hashHex}`;
}

// Verify password match
export async function verifyPassword(password, storedHash) {
  const [saltHex, originalHash] = storedHash.split(':');
  const computed = await hashPassword(password, saltHex);
  return computed.split(':')[1] === originalHash;
}

// Helper to generate a 6-digit numeric OTP
export function generateOTP() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 900000 + 100000); // 100000 - 999999
}

// Helper to send email OTP through Google Apps Script
export async function sendOTPEmail(gasUrl, email, otp, username, type) {
  const url = gasUrl || "https://script.google.com/macros/s/AKfycbwxh5LQLCGtwGflfF7V5HKyL7viFNlAkAbsgz5xEDQo8Eg_f1kw47EjxrzSAC891sm1/exec";
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, username, type })
    });
    const result = await res.json();
    return result.success;
  } catch (err) {
    console.error("Error calling Google Apps Script API:", err);
    return false;
  }
}
