import crypto from "crypto";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.PUBLIC_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("No HMAC secret available (PUBLIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY)");
  return s;
}

export function createPasswordLinkToken(email: string, ttlMs = DEFAULT_TTL_MS): string {
  const payload = { email: email.toLowerCase().trim(), exp: Date.now() + ttlMs };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyPasswordLinkToken(token: string): { email: string } | null {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", secret()).update(b64).digest("base64url");
  if (sig.length !== expectedSig.length) return null;
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    if (!ok) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString()) as { email?: string; exp?: number };
    if (!payload.email || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export function wrapperUrlForEmail(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.bldr.co.il";
  const token = createPasswordLinkToken(email);
  return `${base}/set-password?t=${encodeURIComponent(token)}`;
}
