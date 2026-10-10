import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center gap-3 py-14 px-6", className)}>
      <div className="h-14 w-14 rounded-2xl bg-surface-2 flex items-center justify-center text-muted">
        <Icon size={26} />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted mt-1 max-w-xs mx-auto">{description}</p>
      </div>
      {action}
    </div>
  );
}
