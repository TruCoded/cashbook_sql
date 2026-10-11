import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { CashbookModel, PartnerModel, connectDB } from "@/server/db";
import { computeBalances } from "@/server/balance";
import { createCashbookSchema } from "@/validations/cashbook";
import { toMinorUnits } from "@/lib/money";
import { recordAudit } from "@/server/audit";
import { serializeCashbook } from "@/server/serialize";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();

    const owned = await CashbookModel.find({ ownerId: user.id }).sort({ createdAt: -1 }).lean();
    const links = await PartnerModel.find({ userId: user.id }).lean();
    const shared = links.length ? await CashbookModel.find({ _id: { $in: links.map((l) => l.cashbookId) } }).sort({ createdAt: -1 }).lean() : [];

    const all = [
      ...owned.map((cb) => ({ cb, role: "OWNER" as const })),
      ...shared.map((cb) => ({ cb, role: "COLLABORATOR" as const })),
    ];
    const balances = await computeBalances(all.map(({ cb }) => ({ id: String(cb._id), initialBalanceMinor: cb.initialBalanceMinor })));

    return NextResponse.json({
      cashbooks: all.map(({ cb, role }) => ({ ...serializeCashbook(cb), role, balance: balances.get(String(cb._id)) })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = createCashbookSchema.parse(await req.json());
    await connectDB();

    const created = await CashbookModel.create({
      name: input.name,
      description: input.description || null,
      category: input.category || null,
      currency: input.currency,
      initialBalanceMinor: toMinorUnits(input.initialBalance),
      ownerId: user.id,
    });

    await recordAudit({ userId: user.id, cashbookId: String(created._id), action: "CREATE_CASHBOOK", description: `${user.name} created cashbook "${created.name}"` });
    return NextResponse.json({ cashbook: serializeCashbook(created.toObject()) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
