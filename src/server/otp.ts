import "server-only";
// Stateless OTPs. Vercel functions don't share memory or disk between requests, so instead of
// storing the code we hand the browser a signed token containing an HMAC of the code. Verifying
// just recomputes the HMAC. Same approach the original Cashbook used.
import crypto from "crypto";
import { getSecretText } from "@/lib/env";
import { normEmail } from "@/lib/gmail";

const TTL_MS = 10 * 60 * 1000;

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const hmac = (secret: string, s: string) => crypto.createHmac("sha256", secret).update(s).digest("base64url");

export async function createOtp(email: string, purpose: string) {
  const secret = await getSecretText();
  const code = String(crypto.randomInt(100000, 1000000));
  const body = b64(JSON.stringify({ e: normEmail(email), p: purpose, x: Date.now() + TTL_MS }));
  return { code, token: `${body}.${hmac(secret, `${body}|${code}`)}` };
}

/** Returns an error message, or null when the code is valid. */
export async function checkOtp(token: string, email: string, purpose: string, code: string): Promise<string | null> {
  try {
    const secret = await getSecretText();
    const [body, sig] = String(token).split(".");
    const a = Buffer.from(sig || "");
    const b = Buffer.from(hmac(secret, `${body}|${String(code).trim()}`));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "Incorrect code";
    const { e, p, x } = JSON.parse(Buffer.from(body, "base64url").toString());
    if (e !== normEmail(email) || p !== purpose) return "Incorrect code";
    if (Date.now() > x) return "Code expired - request a new one";
    return null;
  } catch {
    return "Incorrect code";
  }
}
