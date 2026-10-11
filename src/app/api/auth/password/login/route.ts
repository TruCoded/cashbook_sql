import { NextRequest, NextResponse } from "next/server";
import { passwordLoginSchema } from "@/validations/auth";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import { createSession, toSessionUser } from "@/server/auth";
import { User, connectDB } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/password";
import { recordAudit } from "@/server/audit";
import { handleApiError, jsonError } from "@/server/api-utils";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = passwordLoginSchema.parse(await req.json());
    if (!(await checkRateLimit(`pw-ip:${getClientIp(req)}`, 30, 600))) return jsonError("Too many attempts. Please wait a few minutes.", 429);
    if (!(await checkRateLimit(`pw-email:${email}`, 8, 600))) return jsonError("Too many attempts for this email. Please wait a few minutes.", 429);

    await connectDB();
    const user = await User.findOne({ email }).select("+password");
    const bad = "Invalid email or password";
    if (!user || !user.password) {
      return jsonError(user ? "This account has no password yet - sign in with an OTP code, then set one in Profile" : bad, 401);
    }
    const res = verifyPassword(password, user.password);
    if (!res.ok) return jsonError(bad, 401);
    if (res.needsUpgrade) await User.updateOne({ id: user.id }, { password: hashPassword(password) });

    await createSession(user.id);
    await recordAudit({ userId: user.id, action: "LOGIN", description: `${user.name} signed in` });
    return NextResponse.json({ ok: true, user: toSessionUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
