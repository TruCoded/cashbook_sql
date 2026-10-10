import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema, passwordSchema } from "@/validations/auth";
import { checkOtp } from "@/server/otp";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import { createSession, createUser, findUserByEmail, toSessionUser } from "@/server/auth";
import { hashPassword } from "@/server/password";
import { recordAudit } from "@/server/audit";
import { handleApiError, jsonError } from "@/server/api-utils";

// POST { email, code, token, purpose, name?, businessName? } -> signs in (and creates the account on signup)
export async function POST(req: NextRequest) {
  try {
    const { email, code, token, purpose, name, businessName, password } = verifyOtpSchema.parse(await req.json());
    if (purpose === "signup") passwordSchema.parse(password ?? "");

    if (!(await checkRateLimit(`verify-ip:${getClientIp(req)}`, 30, 600))) return jsonError("Too many attempts. Please wait a few minutes.", 429);
    if (!(await checkRateLimit(`verify-email:${email}`, 10, 600))) return jsonError("Too many wrong codes. Request a new code in a few minutes.", 429);

    const problem = await checkOtp(token, email, purpose, code);
    if (problem) return jsonError(problem, 400);

    let user = await findUserByEmail(email);
    if (purpose === "login") {
      if (!user) return jsonError("No account with this email", 404);
    } else if (!user) {
      user = await createUser({ name, businessName, email, passwordHash: hashPassword(password!) });
    }

    await createSession(user.id);
    await recordAudit({ userId: user.id, action: "LOGIN", description: `${user.name} signed in` });
    return NextResponse.json({ ok: true, user: toSessionUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
