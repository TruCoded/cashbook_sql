"use client";

import { use, useState, useCallback, Suspense } from "react";
import { ArrowLeft, Plus, FileDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { useUser } from "@/components/providers/user-provider";
import { useCashbookDetail } from "@/hooks/use-cashbook-detail";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedMoney } from "@/components/ui/animated-number";
import { AddCashDrawer } from "@/components/cashbook/add-cash-drawer";
import { TransactionLedger } from "@/components/cashbook/transaction-ledger";
import { CollaboratorsPanel } from "@/components/cashbook/collaborators-panel";

export default function CashbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <CashbookDetail params={params} />
    </Suspense>
  );
}

function CashbookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const search = useSearchParams();
  const autoPartnerEmail = search.get("partner") ?? undefined; // set right after "Create cashbook" with a partner Gmail
  const { user } = useUser();
  const { detail, isLoading, mutate } = useCashbookDetail(id);
  const { mutate: globalMutate } = useSWRConfig();
  const [addCashOpen, setAddCashOpen] = useState(false);

  // Detail and ledger use separate SWR keys - refresh both together.
  const refreshAll = useCallback(() => {
    mutate();
    globalMutate((key) => typeof key === "string" && key.startsWith(`/api/cashbooks/${id}/transactions`));
  }, [mutate, globalMutate, id]);

  if (isLoading || !detail) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { cashbook, balance, role, permission, owner, collaborators } = detail;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/cashbooks" className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-2 text-primary" aria-label="Back to cashbooks">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-primary truncate">{cashbook.name}</h1>
          <p className="text-sm text-muted truncate">
            {role === "COLLABORATOR" && owner ? `Shared by ${owner.name}` : cashbook.description}
          </p>
        </div>
        <a href={`/api/cashbooks/${id}/pdf`} className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-surface px-3.5 h-9 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-surface-2">
          <FileDown size={14} /> PDF
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col gap-1 text-center">
            <p className="text-xs uppercase tracking-wider text-primary">Balance</p>
            <AnimatedMoney minor={balance.currentBalanceMinor} currency={cashbook.currency} className="text-2xl font-semibold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 text-center">
            <p className="text-xs uppercase tracking-wider text-primary">Cash In</p>
            <AnimatedMoney minor={balance.cashInMinor} currency={cashbook.currency} className="text-2xl font-semibold text-cash-in" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 text-center">
            <p className="text-xs uppercase tracking-wider text-primary">Cash Out</p>
            <AnimatedMoney minor={balance.cashOutMinor} currency={cashbook.currency} className="text-2xl font-semibold text-cash-out" />
          </CardContent>
        </Card>
      </div>

      {permission === "EDIT" ? (
        <Button size="lg" onClick={() => setAddCashOpen(true)} className="w-full sm:w-auto self-start uppercase text-[13px]">
          <Plus size={18} /> Add Cash
        </Button>
      ) : (
        <p className="text-xs text-muted">You have view-only access to this cashbook.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-6">
        <TransactionLedger cashbookId={id} currency={cashbook.currency} currentUserId={user?.id ?? ""} canEditAny={role === "OWNER"} onRefresh={refreshAll} />

        <Card className="h-fit">
          <CardContent>
            <CollaboratorsPanel
              cashbookId={id}
              owner={owner}
              collaborators={collaborators}
              isOwner={role === "OWNER"}
              onChange={mutate}
              autoPartnerEmail={role === "OWNER" ? autoPartnerEmail : undefined}
            />
          </CardContent>
        </Card>
      </div>

      <AddCashDrawer cashbookId={id} open={addCashOpen} onClose={() => setAddCashOpen(false)} onSuccess={refreshAll} disabled={permission !== "EDIT"} />
    </div>
  );
}
