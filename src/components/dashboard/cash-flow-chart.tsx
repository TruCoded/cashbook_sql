"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/use-analytics";
import { fromMinorUnits } from "@/lib/money";

const RANGES = [
  { value: "7D" as const, label: "7D" },
  { value: "30D" as const, label: "30D" },
  { value: "90D" as const, label: "90D" },
  { value: "ALL" as const, label: "ALL" },
];

export function CashFlowChart() {
  const [range, setRange] = useState<"7D" | "30D" | "90D" | "ALL">("30D");
  const { data, isLoading } = useAnalytics(range);

  const chartData = (data?.series ?? []).map((p) => ({
    day: p.day.slice(5),
    "Cash In": fromMinorUnits(p.cashIn),
    "Cash Out": fromMinorUnits(p.cashOut),
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Cash Flow Over Time</CardTitle>
        <SegmentedControl options={RANGES} value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted">No activity in this range yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="cashInGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--cash-in)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--cash-in)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cashOutGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--cash-out)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--cash-out)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="Cash In" stroke="var(--cash-in)" fill="url(#cashInGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="Cash Out" stroke="var(--cash-out)" fill="url(#cashOutGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
