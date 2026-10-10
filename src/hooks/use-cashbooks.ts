import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { CashbookWithBalance } from "@/types";

const POLL_INTERVAL = 8000;

export function useCashbooks() {
  const { data, error, isLoading, mutate } = useSWR<{ cashbooks: CashbookWithBalance[] }>(
    "/api/cashbooks",
    fetcher,
    { refreshInterval: POLL_INTERVAL, revalidateOnFocus: true }
  );

  return { cashbooks: data?.cashbooks ?? [], isLoading, error, mutate };
}
