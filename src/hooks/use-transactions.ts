import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { Transaction } from "@/types";

export interface TransactionFilters {
  type?: "CASH_IN" | "CASH_OUT";
  category?: string;
  person?: string;
  search?: string;
}

export function useTransactions(cashbookId: string, filters: TransactionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.person) params.set("person", filters.person);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();

  const { data, isLoading, mutate } = useSWR<{ transactions: Transaction[] }>(
    cashbookId ? `/api/cashbooks/${cashbookId}/transactions${query ? `?${query}` : ""}` : null,
    fetcher,
    { refreshInterval: 6000 }
  );

  return { transactions: data?.transactions ?? [], isLoading, mutate };
}
