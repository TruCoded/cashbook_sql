import "server-only";
import { isValidObjectId } from "mongoose";
import { CashbookModel, PartnerModel, TransactionModel, User, connectDB } from "./db";
import { computeBalance } from "./balance";
import { buildStatementPdf, plainMoney, type StatementInput } from "./pdf";
import { sendStatementMail } from "./mailer";

/** Loads everything the PDF + email need for one cashbook. */
export async function loadStatement(cashbookId: string, highlightId?: string) {
  await connectDB();
  if (!isValidObjectId(cashbookId)) return null;
  const cashbook = await CashbookModel.findById(cashbookId).lean();
  if (!cashbook) return null;

  const partners = await PartnerModel.find({ cashbookId }).lean();
  const txs = await TransactionModel.find({ cashbookId, deletedAt: null }).sort({ occurredAt: -1 }).lean();
  const ids = [...new Set([cashbook.ownerId, ...partners.map((p) => p.userId), ...txs.map((t) => t.createdBy)])];
  const users = await User.find({ id: { $in: ids } }).lean();
  const byId = new Map(users.map((u) => [u.id, u]));
  const owner = byId.get(cashbook.ownerId);
  const balance = await computeBalance(cashbookId, cashbook.initialBalanceMinor);

  const partnerInfo = partners.map((p) => ({ name: byId.get(p.userId)?.name ?? p.email, email: p.email, permission: p.permission }));
  const input: StatementInput = {
    cashbookName: cashbook.name,
    description: cashbook.description,
    currency: cashbook.currency,
    ownerName: owner?.name ?? "Owner",
    ownerEmail: owner?.email ?? "",
    partners: partnerInfo,
    initialBalanceMinor: cashbook.initialBalanceMinor,
    highlightId,
    transactions: txs.map((t) => ({
      id: String(t._id),
      type: t.type,
      amountMinor: t.amountMinor,
      description: t.description,
      person: t.person,
      category: t.category,
      notes: t.notes,
      occurredAt: t.occurredAt,
      byName: byId.get(t.createdBy)?.name ?? "Unknown",
    })),
  };

  const recipients = [
    ...(owner ? [{ name: owner.name, email: owner.email }] : []),
    ...partners.map((p) => ({ name: byId.get(p.userId)?.name ?? p.email, email: p.email })),
  ];
  return { cashbook, input, balance, recipients };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cashbook";

/**
 * Emails the current PDF statement to the owner and every partner (or just `onlyEmails`).
 * Never throws - a mail problem must not undo a saved transaction.
 */
export async function emailStatement(opts: {
  cashbookId: string;
  headline: string;
  detail?: string;
  subjectSuffix: string;
  highlightTxId?: string;
  onlyEmails?: string[];
}): Promise<{ sent: number; failed: number }> {
  try {
    const data = await loadStatement(opts.cashbookId, opts.highlightTxId);
    if (!data) return { sent: 0, failed: 0 };
    const { cashbook, input, balance, recipients } = data;

    const only = opts.onlyEmails?.map((e) => e.toLowerCase());
    const list = recipients.filter((r, i, a) => a.findIndex((x) => x.email === r.email) === i && (!only || only.includes(r.email.toLowerCase())));
    if (list.length === 0) return { sent: 0, failed: 0 };

    const pdf = await buildStatementPdf(input);
    const filename = `cashbook-${slug(cashbook.name)}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const money = (n: number) => plainMoney(n, cashbook.currency);

    const results = await Promise.allSettled(
      list.map((r) =>
        sendStatementMail({
          to: r.email,
          subject: `${cashbook.name}: ${opts.subjectSuffix}`,
          greeting: `Hi ${r.name.split(" ")[0]},`,
          headline: opts.headline,
          detail: opts.detail,
          cashbookName: cashbook.name,
          balanceText: money(balance.currentBalanceMinor),
          cashInText: money(balance.cashInMinor),
          cashOutText: money(balance.cashOutMinor),
          pdf,
          filename,
        })
      )
    );
    const failed = results.filter((r) => r.status === "rejected");
    failed.forEach((f) => console.error("[mail] statement email failed:", (f as PromiseRejectedResult).reason));
    return { sent: results.length - failed.length, failed: failed.length };
  } catch (err) {
    console.error("[mail] could not build/send statement", err);
    return { sent: 0, failed: 1 };
  }
}
