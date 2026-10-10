import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { BalanceSummary, Cashbook, CollaboratorInfo, OwnerInfo, Permission, CashbookRole } from "@/types";

export interface CashbookDetail {
  cashbook: Cashbook;
  role: CashbookRole;
  permission: Permission;
  balance: BalanceSummary;
  owner: OwnerInfo | null;
  collaborators: CollaboratorInfo[];
}

export function useCashbookDetail(id: string) {
  const { data, isLoading, error, mutate } = useSWR<CashbookDetail>(id ? `/api/cashbooks/${id}` : null, fetcher, {
    refreshInterval: 6000,
  });
  return { detail: data, isLoading, error, mutate };
}
