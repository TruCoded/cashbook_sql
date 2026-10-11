"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const ROWS = [
  { label: "Chai & snacks sales", amount: "+ ₹1,200", tone: "text-cash-in" },
  { label: "Milk delivery", amount: "− ₹450", tone: "text-cash-out" },
  { label: "Gas cylinder", amount: "− ₹980", tone: "text-cash-out" },
] as const;

export function Hero() {
  return (
    <section className="relative pt-36 pb-24 px-4 overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(640px circle at 50% 0%, color-mix(in srgb, var(--lavender) 90%, transparent), transparent 72%)" }}
      />
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-medium tracking-wide uppercase text-primary bg-surface-2 rounded-full px-3 py-1"
        >
          A shared money book for small businesses
        </motion.span>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}>
          <p className="script text-5xl -mb-2">My</p>
          <h1 className="text-5xl sm:text-7xl font-bold uppercase text-primary">Cashbook</h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-xl sm:text-2xl font-medium text-foreground/80"
        >
          One ledger. Every partner. No confusion.
        </motion.p>

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="text-muted max-w-lg">
          Write down the money you receive and the money you spend. Add a partner with their Gmail and you both watch the same book update — with a PDF statement waiting in your inbox.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link href="/signup" className={buttonVariants({ size: "lg", className: "uppercase text-[13px]" })}>
            Create free account <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg", className: "uppercase text-[13px]" })}>
            See the 5 steps
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-10 w-full max-w-md glass rounded-3xl p-5 text-left">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted">Gupta Tea Stall</p>
            <p className="text-[11px] uppercase tracking-wider text-primary">Today</p>
          </div>
          <p className="font-serif text-4xl font-semibold mt-1 mb-4">₹18,450.00</p>
          <div className="flex flex-col gap-1.5">
            {ROWS.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl bg-surface/80 px-3 py-2 text-sm">
                <span>{r.label}</span>
                <span className={`font-semibold ${r.tone}`}>{r.amount}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
