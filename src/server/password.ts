import "server-only";
import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

/**
 * Accepts bcrypt hashes. A stored value that is not a bcrypt hash (older Cashbook accounts
 * that kept the raw password) still matches, and is flagged so the caller can re-hash it.
 */
export function verifyPassword(password: string, stored: string): { ok: boolean; needsUpgrade: boolean } {
  if (/^\$2[aby]\$/.test(stored)) return { ok: bcrypt.compareSync(password, stored), needsUpgrade: false };
  return { ok: stored === password, needsUpgrade: stored === password };
}
