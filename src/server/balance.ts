import "server-only";
import { TransactionModel, connectDB } from "./db";
import type { BalanceSummary } from "@/types";

/** Balance is always computed from the ledger (initial + cash in - cash out), never stored. */
export async function computeBalances(books: { id: string; initialBalanceMinor: number }[]): Promise<Map<string, BalanceSummary>> {
  await connectDB();
  const rows = await TransactionModel.aggregate<{ _id: { b: string; t: string }; sum: number; n: number }>([
    { $match: { cashbookId: { $in: books.map((b) => b.id) }, deletedAt: null } },
    { $group: { _id: { b: "$cashbookId", t: "$type" }, sum: { $sum: "$amountMinor" }, n: { $sum: 1 } } },
  ]);

  const out = new Map<string, BalanceSummary>();
  for (const b of books) {
    out.set(b.id, { initialBalanceMinor: b.initialBalanceMinor, cashInMinor: 0, cashOutMinor: 0, currentBalanceMinor: b.initialBalanceMinor, transactionCount: 0 });
  }
  for (const r of rows) {
    const s = out.get(r._id.b);
    if (!s) continue;
    if (r._id.t === "CASH_IN") s.cashInMinor += r.sum;
    else s.cashOutMinor += r.sum;
    s.transactionCount += r.n;
  }
  for (const s of out.values()) s.currentBalanceMinor = s.initialBalanceMinor + s.cashInMinor - s.cashOutMinor;
  return out;
}

export async function computeBalance(id: string, initialBalanceMinor: number) {
  return (await computeBalances([{ id, initialBalanceMinor }])).get(id)!;
}
