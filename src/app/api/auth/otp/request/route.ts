import { NextRequest, NextResponse } from "next/server";
import { requestOtpSchema, passwordSchema } from "@/validations/auth";
import { createOtp } from "@/server/otp";
import { sendOtpMail, explainMailError } from "@/server/mailer";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import { findUserByEmail } from "@/server/auth";
import { handleApiError, jsonError } from "@/server/api-utils";

// POST { email, purpose: "login" | "signup", name?, businessName? } -> { ok, token }
export async function POST(req: NextRequest) {
  try {
    const { email, purpose, name, password } = requestOtpSchema.parse(await req.json());
    if (purpose === "signup") passwordSchema.parse(password ?? ""); // fail fast, before emailing a code

    if (!(await checkRateLimit(`otp-ip:${getClientIp(req)}`, 20, 600))) return jsonError("Too many attempts. Please wait a few minutes.", 429);
    if (!(await checkRateLimit(`otp-email:${email}`, 5, 600))) return jsonError("Too many codes requested for this email. Please wait a few minutes.", 429);

    // Check the account BEFORE emailing so the person gets a useful message.
    const exists = Boolean(await findUserByEmail(email));
    if (purpose === "signup" && !name?.trim()) return jsonError("Full name is required", 400);
    if (purpose === "signup" && exists) return jsonError("Email already registered - please sign in", 409);
    if (purpose === "login" && !exists) return jsonError("No account with this email - please sign up", 404);

    const { code, token } = await createOtp(email, purpose);
    try {
      // Awaited on purpose: on Vercel the function is frozen once the response is sent.
      await sendOtpMail(email, code, purpose === "login" ? "Use this code to sign in to Cashbook." : "Use this code to create your Cashbook account.");
    } catch (err) {
      console.error("[otp] SMTP error:", (err as { code?: string }).code, (err as Error).message);
      return jsonError(explainMailError(err), 500);
    }
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    return handleApiError(err);
  }
}
