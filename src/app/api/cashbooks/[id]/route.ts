import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { CashbookModel, PartnerModel, TransactionModel, User, connectDB } from "@/server/db";
import { getAuthorizedCashbook, assertOwner } from "@/server/permissions";
import { computeBalance } from "@/server/balance";
import { updateCashbookSchema } from "@/validations/cashbook";
import { recordAudit } from "@/server/audit";
import { serializeCashbook } from "@/server/serialize";
import { handleApiError } from "@/server/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const access = await getAuthorizedCashbook(id, user.id);
    const balance = await computeBalance(id, access.cashbook.initialBalanceMinor);

    const partners = await PartnerModel.find({ cashbookId: id }).lean();
    const users = await User.find({ id: { $in: [access.cashbook.ownerId, ...partners.map((p) => p.userId)] } }).lean();
    const byId = new Map(users.map((u) => [u.id, u]));
    const owner = byId.get(access.cashbook.ownerId);

    return NextResponse.json({
      cashbook: serializeCashbook(access.cashbook),
      role: access.role,
      permission: access.permission,
      balance,
      owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
      collaborators: partners.map((p) => ({
        id: String(p._id),
        userId: p.userId,
        name: byId.get(p.userId)?.name ?? p.email,
        email: p.email,
        permission: p.permission,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    assertOwner(await getAuthorizedCashbook(id, user.id));

    const input = updateCashbookSchema.parse(await req.json());
    const updated = await CashbookModel.findByIdAndUpdate(
      id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.category !== undefined ? { category: input.category || null } : {}),
      },
      { new: true }
    ).lean();

    await recordAudit({ userId: user.id, cashbookId: id, action: "UPDATE_CASHBOOK", description: `${user.name} updated cashbook "${updated?.name}"` });
    return NextResponse.json({ cashbook: updated ? serializeCashbook(updated) : null });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const access = await getAuthorizedCashbook(id, user.id);
    assertOwner(access);

    await connectDB();
    await Promise.all([
      TransactionModel.deleteMany({ cashbookId: id }),
      PartnerModel.deleteMany({ cashbookId: id }),
      CashbookModel.findByIdAndDelete(id),
    ]);
    await recordAudit({ userId: user.id, cashbookId: id, action: "DELETE_CASHBOOK", description: `${user.name} deleted cashbook "${access.cashbook.name}"` });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
