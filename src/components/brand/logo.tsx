import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="currentColor" className="text-primary" />
      {/* open book */}
      <path
        d="M16 10.5c-1.6-1.3-3.7-1.9-6-1.9v12.2c2.3 0 4.4.6 6 1.9 1.6-1.3 3.7-1.9 6-1.9V8.6c-2.3 0-4.4.6-6 1.9Z M16 10.5v12.2"
        stroke="var(--primary-foreground)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="script text-[1.5rem]">My</span>
        <span className="font-serif text-base font-bold uppercase tracking-[0.12em] text-primary">Cashbook</span>
      </span>
    </div>
  );
}
