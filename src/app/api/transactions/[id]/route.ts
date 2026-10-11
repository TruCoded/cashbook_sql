import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { requireUser } from "@/server/auth";
import { TransactionModel, connectDB } from "@/server/db";
import { getAuthorizedCashbook, assertCanEdit } from "@/server/permissions";
import { ForbiddenError, NotFoundError, handleApiError } from "@/server/api-utils";
import { recordAudit } from "@/server/audit";
import { emailStatement } from "@/server/notify";
import { plainMoney } from "@/server/pdf";

export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    await connectDB();
    if (!isValidObjectId(id)) throw new NotFoundError("Transaction not found");

    const tx = await TransactionModel.findById(id).lean();
    if (!tx || tx.deletedAt) throw new NotFoundError("Transaction not found");

    const access = await getAuthorizedCashbook(tx.cashbookId, user.id);
    assertCanEdit(access);
    if (access.role === "COLLABORATOR" && tx.createdBy !== user.id) throw new ForbiddenError("You can only delete transactions you created");

    await TransactionModel.updateOne({ _id: id }, { deletedAt: new Date() });

    const money = plainMoney(tx.amountMinor, access.cashbook.currency);
    const verb = tx.type === "CASH_IN" ? "cash in" : "cash out";
    await recordAudit({
      userId: user.id,
      cashbookId: tx.cashbookId,
      action: "DELETE_TRANSACTION",
      description: `${user.name} deleted ${verb} of ${money} on "${access.cashbook.name}"`,
    });
    const mail = await emailStatement({
      cashbookId: tx.cashbookId,
      headline: `${user.name} deleted a ${verb} entry of ${money}`,
      detail: "The attached statement shows the updated balance.",
      subjectSuffix: `${verb} ${money} deleted by ${user.name}`,
    });

    return NextResponse.json({ ok: true, emailed: mail.sent });
  } catch (err) {
    return handleApiError(err);
  }
}
