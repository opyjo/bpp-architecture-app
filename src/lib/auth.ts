// Server-only auth helpers for the shared-password gate.
//
// Do NOT import this from client components — it reads server-only env vars
// (APP_PASSWORD, SESSION_SECRET) and would leak them into the browser bundle.
//
// The session cookie holds an HMAC-signed token, NOT the password itself, so a
// stolen cookie can't reveal the password and can't be forged without the secret.

export const SESSION_COOKIE = "app_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const TOKEN_VERSION = "v1";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env.local (and your Vercel env)."
    );
  }
  return secret;
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// HMAC-SHA256 via Web Crypto — available in both the Node.js runtime (used by
// proxy.ts in Next 16) and route handlers, so this file works in both places.
async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bufToHex(sig);
}

// Constant-time comparison of two equal-length hex digests. Because both inputs
// are SHA-256 HMAC outputs they're always 64 chars, so length never leaks.
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Mint a signed session token: `v1.<issuedAtMs>.<hmac>`. */
export async function createSessionToken(): Promise<string> {
  const payload = `${TOKEN_VERSION}.${Date.now()}`;
  const sig = await hmacHex(payload, getSecret());
  return `${payload}.${sig}`;
}

/** Verify a session token's signature and that it hasn't expired. */
export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  const [version, issuedAtRaw] = payload.split(".");
  if (version !== TOKEN_VERSION) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return false;

  const expected = await hmacHex(payload, getSecret());
  return timingSafeEqualHex(sig, expected);
}

/** Constant-time check of a submitted password against APP_PASSWORD. */
export async function verifyPassword(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error(
      "APP_PASSWORD is not set. Add it to .env.local (and your Vercel env)."
    );
  }
  // Compare HMACs rather than raw strings: fixed-length output, no length leak.
  const secret = getSecret();
  const [a, b] = await Promise.all([
    hmacHex(input, secret),
    hmacHex(expected, secret),
  ]);
  return timingSafeEqualHex(a, b);
}
