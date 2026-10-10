import { ArrowDownLeft, ArrowUpRight, FileText, ShieldCheck, Users } from "lucide-react";

export function TrackCashVisual() {
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-xs text-muted mb-1">Today</p>
      <div className="flex flex-col divide-y divide-border">
        {[
          { icon: ArrowDownLeft, label: "Customer Payment", amount: "+₹5,000", color: "text-cash-in" },
          { icon: ArrowUpRight, label: "Stock Purchase", amount: "-₹2,500", color: "text-cash-out" },
          { icon: ArrowDownLeft, label: "Invoice Payment", amount: "+₹8,000", color: "text-cash-in" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className={`h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center ${row.color}`}>
              <row.icon size={16} />
            </div>
            <p className="text-sm flex-1">{row.label}</p>
            <p className={`text-sm font-semibold ${row.color}`}>{row.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CollaborateVisual() {
  return (
    <div className="glass rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-primary" />
        <p className="text-sm font-medium">Sharma General Store</p>
      </div>
      {[
        { name: "Anita", role: "Owner" },
        { name: "Rahul", role: "Can edit" },
      ].map((p) => (
        <div key={p.name} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary">
            {p.name[0]}
          </div>
          <p className="text-sm flex-1">{p.name}</p>
          <span className="text-xs text-muted">{p.role}</span>
        </div>
      ))}
    </div>
  );
}

export function PdfVisual() {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={16} className="text-primary" />
        <p className="text-sm font-medium">cashbook-sharma-general-store.pdf</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-border bg-surface">
        <div className="bg-primary px-4 py-3">
          <p className="text-[10px] tracking-widest text-lavender">MY CASHBOOK</p>
          <p className="font-serif text-lg text-primary-foreground">Sharma General Store</p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3 text-center">
          {[["Balance", "Rs. 63,000", "text-primary"], ["Cash in", "Rs. 5,000", "text-cash-in"], ["Cash out", "Rs. 2,000", "text-cash-out"]].map(([l, v, c]) => (
            <div key={l} className="bg-surface-2 rounded-lg py-2">
              <p className="text-[9px] uppercase text-primary">{l}</p>
              <p className={`font-serif text-sm font-semibold ${c}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3 text-[11px] flex flex-col gap-1.5">
          {[["Customer payment", "+ Rs. 5,000", "text-cash-in"], ["Stock purchase", "- Rs. 2,000", "text-cash-out"]].map(([l, v, c]) => (
            <div key={l} className="flex justify-between bg-background rounded-md px-2 py-1.5">
              <span>{l}</span>
              <span className={`font-semibold ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SecurityVisual() {
  return (
    <div className="glass rounded-3xl p-8 flex flex-col items-center text-center gap-3">
      <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
        <ShieldCheck size={26} />
      </div>
      <p className="font-semibold">Every cashbook is isolated</p>
      <p className="text-sm text-muted">Server-side checks on every request — no one sees data they don&apos;t own.</p>
    </div>
  );
}
