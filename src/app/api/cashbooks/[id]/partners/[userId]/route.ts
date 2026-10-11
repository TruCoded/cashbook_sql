import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { PartnerModel, User, connectDB } from "@/server/db";
import { getAuthorizedCashbook, assertOwner } from "@/server/permissions";
import { recordAudit } from "@/server/audit";
import { handleApiError } from "@/server/api-utils";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, userId } = await params;
    const user = await requireUser();
    const access = await getAuthorizedCashbook(id, user.id);
    assertOwner(access);

    await connectDB();
    const removed = await User.findOne({ id: userId }).lean();
    await PartnerModel.deleteOne({ cashbookId: id, userId });

    await recordAudit({
      userId: user.id,
      cashbookId: id,
      action: "REMOVE_PARTNER",
      description: `${user.name} removed ${removed?.name ?? "a partner"} from "${access.cashbook.name}"`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
