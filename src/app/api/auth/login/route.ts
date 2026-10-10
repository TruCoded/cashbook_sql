import { NextRequest, NextResponse } from "next/server";
import { loginPasswordSchema } from "@/validations/auth";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import { createSession, findUserWithPassword, toSessionUser } from "@/server/auth";
import { verifyPassword } from "@/server/password";
import { recordAudit } from "@/server/audit";
import { handleApiError, jsonError } from "@/server/api-utils";

// POST { email, password } -> signs in with email + password
export async function POST(req: NextRequest) {
  try {
    const { email, password } = loginPasswordSchema.parse(await req.json());

    if (!(await checkRateLimit(`pw-ip:${getClientIp(req)}`, 30, 600))) return jsonError("Too many attempts. Please wait a few minutes.", 429);
    if (!(await checkRateLimit(`pw-email:${email}`, 10, 600))) return jsonError("Too many failed attempts. Please wait a few minutes.", 429);

    const user = await findUserWithPassword(email);
    if (!user) return jsonError("No account with this email - please sign up", 404);
    if (!user.passwordHash) return jsonError("This account has no password yet - sign in with an email code instead", 400);
    if (!verifyPassword(password, user.passwordHash)) return jsonError("Incorrect email or password", 401);

    await createSession(user.id);
    await recordAudit({ userId: user.id, action: "LOGIN", description: `${user.name} signed in` });
    return NextResponse.json({ ok: true, user: toSessionUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
