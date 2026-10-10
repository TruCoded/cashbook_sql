"use client";

import { Wallet } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { useOpenCreateCashbook } from "@/components/providers/create-cashbook-provider";
import { useCashbooks } from "@/hooks/use-cashbooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { AnimatedMoney } from "@/components/ui/animated-number";
import { CashbookCard } from "@/components/cashbook/cashbook-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useUser();
  const { cashbooks, isLoading } = useCashbooks();
  const openCreate = useOpenCreateCashbook();

  const totals = cashbooks.reduce(
    (acc, cb) => ({
      balance: acc.balance + cb.balance.currentBalanceMinor,
      cashIn: acc.cashIn + cb.balance.cashInMinor,
      cashOut: acc.cashOut + cb.balance.cashOutMinor,
    }),
    { balance: 0, cashIn: 0, cashOut: 0 }
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {greeting()}, {user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-muted mt-1">Here&apos;s what&apos;s happening across your cashbooks — yours and the ones shared with you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted">Total Balance</p>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <AnimatedMoney minor={totals.balance} className="text-2xl font-semibold" />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted">Cash In</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <AnimatedMoney minor={totals.cashIn} className="text-2xl font-semibold text-cash-in" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted">Cash Out</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <AnimatedMoney minor={totals.cashOut} className="text-2xl font-semibold text-cash-out" />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3">Your Cashbooks</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cashbooks.map((cb) => (
              <CashbookCard key={cb.id} cashbook={cb} />
            ))}
          </div>
        )}
      </div>

      <CashFlowChart />

      <div>
        <h2 className="text-base font-semibold mb-3">Recent Activity</h2>
        <Card>
          <CardContent>
            <ActivityFeed limit={8} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
