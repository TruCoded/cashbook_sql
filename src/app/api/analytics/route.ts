import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { TransactionModel, connectDB } from "@/server/db";
import { getAccessibleCashbookIds } from "@/server/permissions";
import { handleApiError } from "@/server/api-utils";

const RANGE_DAYS: Record<string, number | null> = { "7D": 7, "30D": 30, "90D": 90, ALL: null };

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const ids = await getAccessibleCashbookIds(user.id);
    const range = req.nextUrl.searchParams.get("range") ?? "30D";
    const days = range in RANGE_DAYS ? RANGE_DAYS[range] : 30;

    if (ids.length === 0) return NextResponse.json({ series: [], cashIn: 0, cashOut: 0, count: 0 });
    await connectDB();

    const match: Record<string, unknown> = { cashbookId: { $in: ids }, deletedAt: null };
    if (days) match.occurredAt = { $gte: new Date(Date.now() - days * 86_400_000) };

    const txs = await TransactionModel.find(match).select("occurredAt type amountMinor").lean();
    const byDay = new Map<string, { cashIn: number; cashOut: number }>();
    const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
    for (const t of txs) {
      const day = dayFmt.format(t.occurredAt);
      const row = byDay.get(day) ?? { cashIn: 0, cashOut: 0 };
      if (t.type === "CASH_IN") row.cashIn += t.amountMinor;
      else row.cashOut += t.amountMinor;
      byDay.set(day, row);
    }
    const rows = [...byDay.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([day, v]) => ({ _id: day, ...v }));

    return NextResponse.json({
      series: rows.map((r) => ({ day: r._id, cashIn: r.cashIn, cashOut: r.cashOut })),
      cashIn: rows.reduce((s, r) => s + r.cashIn, 0),
      cashOut: rows.reduce((s, r) => s + r.cashOut, 0),
      count: rows.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
