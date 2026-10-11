import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { ActivityModel, connectDB } from "@/server/db";
import { getAccessibleCashbookIds } from "@/server/permissions";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const ids = await getAccessibleCashbookIds(user.id);
    await connectDB();

    const rows = await ActivityModel.find({ $or: [{ userId: user.id }, { cashbookId: { $in: ids } }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      activity: rows.map((r) => ({ id: String(r._id), action: r.action, description: r.description, createdAt: r.createdAt.toISOString() })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
