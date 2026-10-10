"use client";

import { AppShell } from "@/components/layout/app-shell";
import { CreateCashbookProvider, useOpenCreateCashbook } from "@/components/providers/create-cashbook-provider";

function Shell({ children }: { children: React.ReactNode }) {
  const openCreate = useOpenCreateCashbook();
  return <AppShell onCreateCashbook={openCreate}>{children}</AppShell>;
}

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreateCashbookProvider>
      <Shell>{children}</Shell>
    </CreateCashbookProvider>
  );
}
