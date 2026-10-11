"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, Wallet, UserPlus, UserMinus, Trash2, Pencil, LogIn } from "lucide-react";
import { fetcher } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface AuditRow {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  CREATE_TRANSACTION: ArrowUpCircle,
  UPDATE_TRANSACTION: Pencil,
  DELETE_TRANSACTION: Trash2,
  CREATE_CASHBOOK: Wallet,
  UPDATE_CASHBOOK: Pencil,
  DELETE_CASHBOOK: Trash2,
  ADD_PARTNER: UserPlus,
  REMOVE_PARTNER: UserMinus,
  LOGIN: LogIn,
};

export function ActivityFeed({ limit }: { limit?: number }) {
  const { data, isLoading } = useSWR<{ activity: AuditRow[] }>("/api/activity", fetcher, { refreshInterval: 10000 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const rows = (data?.activity ?? []).slice(0, limit);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ArrowDownCircle}
        title="No activity yet"
        description="Actions across your cashbooks will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((row) => {
        const Icon = ICONS[row.action] ?? Wallet;
        return (
          <li key={row.id} className="flex items-center gap-3 py-3">
            <div className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center text-muted shrink-0">
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{row.description}</p>
              <p className="text-xs text-muted">{formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
