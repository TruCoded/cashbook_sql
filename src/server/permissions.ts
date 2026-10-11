import "server-only";
import { isValidObjectId } from "mongoose";
import { CashbookModel, PartnerModel, connectDB, type CashbookDoc } from "./db";
import { ForbiddenError, NotFoundError } from "./api-utils";

export type CashbookAccess = {
  cashbook: CashbookDoc;
  role: "OWNER" | "COLLABORATOR";
  permission: "VIEW" | "EDIT";
};

/**
 * Central access check. Every route that touches a cashbook or its transactions goes through
 * this - never trust a cashbookId from the browser without it.
 */
export async function getAuthorizedCashbook(cashbookId: string, userId: string): Promise<CashbookAccess> {
  await connectDB();
  if (!isValidObjectId(cashbookId)) throw new NotFoundError("Cashbook not found");
  const cashbook = await CashbookModel.findById(cashbookId).lean();
  if (!cashbook) throw new NotFoundError("Cashbook not found");
  if (cashbook.ownerId === userId) return { cashbook, role: "OWNER", permission: "EDIT" };

  const partner = await PartnerModel.findOne({ cashbookId, userId }).lean();
  if (!partner) throw new ForbiddenError();
  return { cashbook, role: "COLLABORATOR", permission: partner.permission };
}

export function assertCanEdit(access: CashbookAccess) {
  if (access.permission !== "EDIT") throw new ForbiddenError("You only have view access to this cashbook");
}

export function assertOwner(access: CashbookAccess) {
  if (access.role !== "OWNER") throw new ForbiddenError("Only the owner can perform this action");
}

export async function getAccessibleCashbookIds(userId: string): Promise<string[]> {
  await connectDB();
  const owned = await CashbookModel.find({ ownerId: userId }).select("_id").lean();
  const shared = await PartnerModel.find({ userId }).select("cashbookId").lean();
  return [...new Set([...owned.map((c) => String(c._id)), ...shared.map((p) => p.cashbookId)])];
}
