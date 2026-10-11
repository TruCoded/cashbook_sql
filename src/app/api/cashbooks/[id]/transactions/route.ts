import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { TransactionModel, User, connectDB } from "@/server/db";
import { getAuthorizedCashbook, assertCanEdit } from "@/server/permissions";
import { createTransactionSchema } from "@/validations/transaction";
import { toMinorUnits } from "@/lib/money";
import { recordAudit } from "@/server/audit";
import { emailStatement } from "@/server/notify";
import { plainMoney } from "@/server/pdf";
import { serializeTransaction } from "@/server/serialize";
import { handleApiError } from "@/server/api-utils";

export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    await getAuthorizedCashbook(id, user.id);

    const q = req.nextUrl.searchParams;
    const filter: Record<string, unknown> = { cashbookId: id, deletedAt: null };
    const type = q.get("type");
    if (type === "CASH_IN" || type === "CASH_OUT") filter.type = type;
    if (q.get("category")) filter.category = q.get("category");
    if (q.get("person")) filter.person = q.get("person");
    const search = q.get("search");
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ description: rx }, { person: rx }, { notes: rx }];
    }

    const rows = await TransactionModel.find(filter).sort({ occurredAt: -1 }).limit(500).lean();
    const users = await User.find({ id: { $in: [...new Set(rows.map((r) => r.createdBy))] } }).lean();
    const names = new Map(users.map((u) => [u.id, u.name]));

    return NextResponse.json({ transactions: rows.map((r) => serializeTransaction(r, names.get(r.createdBy))) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const access = await getAuthorizedCashbook(id, user.id);
    assertCanEdit(access);

    const input = createTransactionSchema.parse(await req.json());
    await connectDB();

    // Same request sent twice (double tap, retry) -> return the first one, no duplicate row or email.
    if (input.clientRequestId) {
      const dupe = await TransactionModel.findOne({ cashbookId: id, createdBy: user.id, clientRequestId: input.clientRequestId }).lean();
      if (dupe) return NextResponse.json({ transaction: serializeTransaction(dupe, user.name), emailed: 0 }, { status: 200 });
    }

    const created = await TransactionModel.create({
      cashbookId: id,
      type: input.type,
      amountMinor: toMinorUnits(input.amount),
      person: input.person || null,
      description: input.description || null,
      category: input.category || null,
      notes: input.notes || null,
      occurredAt: input.occurredAt ?? new Date(),
      createdBy: user.id,
      clientRequestId: input.clientRequestId ?? null,
    });

    const money = plainMoney(created.amountMinor, access.cashbook.currency);
    const verb = created.type === "CASH_IN" ? "cash in" : "cash out";
    await recordAudit({
      userId: user.id,
      cashbookId: id,
      action: "CREATE_TRANSACTION",
      description: `${user.name} recorded ${verb} of ${money} on "${access.cashbook.name}"`,
    });

    // PDF copy to the owner and every partner (including the person who did it).
    // Awaited: on Vercel the function stops once the response is sent.
    const mail = await emailStatement({
      cashbookId: id,
      headline: `${user.name} recorded ${verb} of ${money}`,
      detail: [created.person && (created.type === "CASH_IN" ? `From ${created.person}` : `To ${created.person}`), created.description, created.category].filter(Boolean).join(" · ") || undefined,
      subjectSuffix: `${verb} ${money} by ${user.name}`,
      highlightTxId: String(created._id),
    });

    return NextResponse.json({ transaction: serializeTransaction(created.toObject(), user.name), emailed: mail.sent, emailFailed: mail.failed }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
