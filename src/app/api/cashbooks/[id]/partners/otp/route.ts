import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { PartnerModel, User, connectDB } from "@/server/db";
import { getAuthorizedCashbook, assertOwner } from "@/server/permissions";
import { partnerGmailSchema } from "@/validations/auth";
import { createOtp } from "@/server/otp";
import { sendOtpMail, explainMailError } from "@/server/mailer";
import { checkRateLimit } from "@/server/rate-limit";
import { handleApiError, jsonError } from "@/server/api-utils";

type Params = { params: Promise<{ id: string }> };

// Step 1 of adding a partner: email a 6-digit code to the PARTNER's Gmail.
// The owner then types the code the partner reads out / forwards - proof that the inbox is really theirs.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const access = await getAuthorizedCashbook(id, user.id);
    assertOwner(access);

    const { email } = partnerGmailSchema.parse(await req.json());
    if (email === user.email.toLowerCase()) return jsonError("That's your own email - you already own this cashbook", 400);

    await connectDB();
    const existing = await User.findOne({ email }).lean();
    if (existing && (await PartnerModel.exists({ cashbookId: id, userId: existing.id }))) return jsonError("This person is already a partner on this cashbook", 409);

    if (!(await checkRateLimit(`partner-otp:${user.id}`, 10, 600))) return jsonError("Too many codes sent. Please wait a few minutes.", 429);
    if (!(await checkRateLimit(`otp-email:${email}`, 5, 600))) return jsonError("Too many codes requested for this email. Please wait a few minutes.", 429);

    const { code, token } = await createOtp(email, `partner:${id}:${user.id}`);
    try {
      await sendOtpMail(email, code, `${user.name} wants to add you as a partner on the cashbook "${access.cashbook.name}". Share this code with ${user.name} to confirm.`);
    } catch (err) {
      console.error("[partner-otp] SMTP error:", (err as { code?: string }).code, (err as Error).message);
      return jsonError(explainMailError(err), 500);
    }
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    return handleApiError(err);
  }
}
