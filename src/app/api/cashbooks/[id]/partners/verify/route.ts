import { NextRequest, NextResponse } from "next/server";
import { requireUser, createUser, findUserByEmail } from "@/server/auth";
import { PartnerModel, connectDB } from "@/server/db";
import { getAuthorizedCashbook, assertOwner } from "@/server/permissions";
import { partnerVerifySchema } from "@/validations/auth";
import { checkOtp } from "@/server/otp";
import { checkRateLimit } from "@/server/rate-limit";
import { recordAudit } from "@/server/audit";
import { emailStatement } from "@/server/notify";
import { handleApiError, jsonError } from "@/server/api-utils";

export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

// Step 2: owner enters the code -> partner is added -> partner gets a PDF copy by email.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const access = await getAuthorizedCashbook(id, user.id);
    assertOwner(access);

    const { email, code, token, permission } = partnerVerifySchema.parse(await req.json());
    if (!(await checkRateLimit(`partner-verify:${user.id}`, 15, 600))) return jsonError("Too many attempts. Request a new code in a few minutes.", 429);

    const problem = await checkOtp(token, email, `partner:${id}:${user.id}`, code);
    if (problem) return jsonError(problem, 400);

    await connectDB();
    // Partner without an account yet gets one (they can sign in later with a Gmail code).
    const partnerUser = (await findUserByEmail(email)) ?? (await createUser({ email }));
    if (partnerUser.id === user.id) return jsonError("You already own this cashbook", 400);

    try {
      await PartnerModel.create({ cashbookId: id, userId: partnerUser.id, email: partnerUser.email, permission });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return jsonError("This person is already a partner on this cashbook", 409);
      throw err;
    }

    await recordAudit({
      userId: user.id,
      cashbookId: id,
      action: "ADD_PARTNER",
      description: `${user.name} added ${partnerUser.name} (${partnerUser.email}) to "${access.cashbook.name}"`,
    });

    // PDF copy of the cashbook straight to the new partner's Gmail.
    const mail = await emailStatement({
      cashbookId: id,
      headline: `${user.name} added you to "${access.cashbook.name}"`,
      detail: `You can ${permission === "EDIT" ? "view and add cash in / cash out" : "view this cashbook"}. Sign in to Cashbook with this Gmail to see it on your dashboard.`,
      subjectSuffix: `${user.name} shared this cashbook with you`,
      onlyEmails: [partnerUser.email],
    });

    return NextResponse.json({
      ok: true,
      partner: { id: partnerUser.id, name: partnerUser.name, email: partnerUser.email, permission },
      emailed: mail.sent,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
