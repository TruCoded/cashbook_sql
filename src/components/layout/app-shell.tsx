"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, Activity, User, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { useUser } from "@/components/providers/user-provider";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cashbooks", label: "Cashbooks", icon: Wallet },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children, onCreateCashbook }: { children: React.ReactNode; onCreateCashbook?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface p-5 fixed h-screen">
        <Link href="/dashboard" className="mb-8">
          <Logo />
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-surface-2 text-primary font-semibold" : "text-muted hover:bg-surface-2 hover:text-primary"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name ?? "…"}</p>
          </div>
          <button onClick={handleLogout} aria-label="Sign out" className="p-1.5 rounded-lg hover:bg-surface-2 text-muted">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64">
        <main className="pb-24 md:pb-8">{children}</main>
      </div>

      {onCreateCashbook && (
        <button
          onClick={onCreateCashbook}
          className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Add cashbook"
        >
          <Plus size={24} />
        </button>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 glass border-t border-border flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium",
                active ? "text-primary" : "text-muted"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
