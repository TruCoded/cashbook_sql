import Link from "next/link";
import { Users } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { CashbookWithBalance } from "@/types";

export function CashbookCard({ cashbook }: { cashbook: CashbookWithBalance }) {
  const positive = cashbook.balance.currentBalanceMinor >= 0;
  return (
    <Link
      href={`/cashbooks/${cashbook.id}`}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{cashbook.name}</p>
          {cashbook.role === "COLLABORATOR" && (
            <span title="Shared with you">
              <Users size={13} className="text-muted shrink-0" />
            </span>
          )}
        </div>
        {cashbook.category && <p className="text-xs text-muted mt-0.5">{cashbook.category}</p>}
      </div>
      <p className={`font-semibold tabular-nums shrink-0 ${positive ? "text-foreground" : "text-cash-out"}`}>
        {formatMoney(cashbook.balance.currentBalanceMinor, cashbook.currency)}
      </p>
    </Link>
  );
}
