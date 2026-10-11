import "server-only";
import type { CashbookDoc, TransactionDoc } from "./db";

export const serializeCashbook = (c: CashbookDoc) => ({
  id: String(c._id),
  name: c.name,
  description: c.description ?? null,
  category: c.category ?? null,
  ownerId: c.ownerId,
  currency: c.currency,
  initialBalanceMinor: c.initialBalanceMinor,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export const serializeTransaction = (t: TransactionDoc, createdByName?: string) => ({
  id: String(t._id),
  cashbookId: t.cashbookId,
  type: t.type,
  amountMinor: t.amountMinor,
  description: t.description ?? null,
  person: t.person ?? null,
  category: t.category ?? null,
  notes: t.notes ?? null,
  occurredAt: t.occurredAt.toISOString(),
  createdBy: t.createdBy,
  createdByName,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});
