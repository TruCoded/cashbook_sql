"use client";

import { useMemo, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Search, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/money";
import { apiFetch } from "@/lib/api-client";
import type { Transaction } from "@/types";

function groupLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "TODAY";
  if (isYesterday(date)) return "YESTERDAY";
  return format(date, "EEEE, d MMM").toUpperCase();
}

export function TransactionLedger({
  cashbookId,
  currency,
  currentUserId,
  canEditAny,
  onRefresh,
}: {
  cashbookId: string;
  currency: string;
  currentUserId: string;
  canEditAny: boolean;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [typeFilter, setTypeFilter] = useState<"" | "CASH_IN" | "CASH_OUT">("");
  const { transactions, isLoading, mutate } = useTransactions(cashbookId, {
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
  });

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const label = groupLabel(tx.occurredAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(tx);
    }
    return Array.from(map.entries());
  }, [transactions]);

  const handleDelete = async (tx: Transaction) => {
    if (!confirm("Delete this transaction? Everyone on this cashbook will be emailed the updated PDF.")) return;
    try {
      await apiFetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      toast.success("Transaction deleted");
      mutate();
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete transaction");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search person, description, notes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["", "CASH_IN", "CASH_OUT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 h-11 rounded-xl text-sm font-medium border transition-colors ${
                typeFilter === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {t === "" ? "All" : t === "CASH_IN" ? "Cash In" : "Cash Out"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions yet" description="Your cash activity will appear here." />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([label, txs]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-muted tracking-wide mb-2">{label}</p>
              <div className="flex flex-col divide-y divide-border rounded-2xl border border-border overflow-hidden bg-surface">
                {txs.map((tx) => {
                  const isCashIn = tx.type === "CASH_IN";
                  const canEdit = canEditAny || tx.createdBy === currentUserId;
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-3.5 group">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          isCashIn ? "bg-cash-in/10 text-cash-in" : "bg-cash-out/10 text-cash-out"
                        }`}
                      >
                        {isCashIn ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{tx.description || tx.category || (isCashIn ? "Cash In" : "Cash Out")}</p>
                        <p className="text-xs text-muted truncate">
                          {[tx.person, tx.category, tx.createdByName].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <p className={`font-semibold tabular-nums shrink-0 ${isCashIn ? "text-cash-in" : "text-cash-out"}`}>
                        {isCashIn ? "+" : "-"}
                        {formatMoney(tx.amountMinor, currency)}
                      </p>
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(tx)}
                          aria-label="Delete transaction"
                          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1.5 rounded-lg hover:bg-surface-2 text-muted transition-opacity shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
