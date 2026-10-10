// Reads the SAME environment variables already set in Vercel for Cashbook.
// Functions (not constants) so values are read at request time, never frozen at build time.

export function mailEnv() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || "";
  // Gmail shows app passwords as "abcd efgh ijkl mnop" - the spaces must go.
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const from = process.env.SMTP_FROM || `"Cashbook" <${user}>`;
  return { user, pass, host, port, from };
}

export function mongoEnv() {
  return { uri: process.env.MONGODB_URI || "", dbName: process.env.MONGODB_DB_NAME || undefined };
}

/** Secret for OTP codes and session cookies: OTP_SECRET, else derived from the Gmail app password. */
export async function getSecretText(): Promise<string> {
  if (process.env.OTP_SECRET) return process.env.OTP_SECRET;
  const base = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "dev-secret";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(base));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
