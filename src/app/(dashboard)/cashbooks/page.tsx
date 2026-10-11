"use client";

import { Wallet } from "lucide-react";
import { useCashbooks } from "@/hooks/use-cashbooks";
import { useOpenCreateCashbook } from "@/components/providers/create-cashbook-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CashbookCard } from "@/components/cashbook/cashbook-card";

export default function CashbooksPage() {
  const { cashbooks, isLoading } = useCashbooks();
  const openCreate = useOpenCreateCashbook();

  const owned = cashbooks.filter((c) => c.role === "OWNER");
  const shared = cashbooks.filter((c) => c.role === "COLLABORATOR");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Cashbooks</h1>
        <Button onClick={openCreate} className="hidden sm:inline-flex">
          + Create Cashbook
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : cashbooks.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="No cashbooks yet"
            description="Create your first cashbook to start tracking your money."
            action={<Button onClick={openCreate}>+ Create Cashbook</Button>}
          />
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-medium text-muted mb-3">Owned by you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {owned.map((cb) => (
                <CashbookCard key={cb.id} cashbook={cb} />
              ))}
            </div>
          </div>

          {shared.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted mb-3">Shared with me</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shared.map((cb) => (
                  <CashbookCard key={cb.id} cashbook={cb} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
