export type TransactionType = "CASH_IN" | "CASH_OUT";
export type Permission = "VIEW" | "EDIT";
export type CashbookRole = "OWNER" | "COLLABORATOR";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  businessName: string;
  photoUrl: string | null;
}

export interface BalanceSummary {
  initialBalanceMinor: number;
  cashInMinor: number;
  cashOutMinor: number;
  currentBalanceMinor: number;
  transactionCount: number;
}

export interface Cashbook {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  ownerId: string;
  currency: string;
  initialBalanceMinor: number;
  createdAt: string;
  updatedAt: string;
}

export interface CashbookWithBalance extends Cashbook {
  role: CashbookRole;
  balance: BalanceSummary;
}

export interface Transaction {
  id: string;
  cashbookId: string;
  type: TransactionType;
  amountMinor: number;
  description: string | null;
  person: string | null;
  category: string | null;
  notes: string | null;
  occurredAt: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollaboratorInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  permission: Permission;
}

export interface OwnerInfo {
  id: string;
  name: string;
  email: string;
}
