"use client";

import { motion } from "framer-motion";
import { UserRound, BookOpen, UserPlus, ArrowLeftRight, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: UserRound,
    title: "Make your account",
    text: "Choose a password, or ask for a one-time code on your Gmail. Either way you're in within a minute.",
    tag: "Password or Gmail OTP",
  },
  {
    icon: BookOpen,
    title: "Start a cashbook",
    text: "Name it after your shop, your trip or your household. Already holding some cash? Enter it as the opening balance.",
    tag: "Opening balance",
  },
  {
    icon: UserPlus,
    title: "Bring in a partner",
    text: "Type their Gmail. A code lands in their inbox, you enter it, and they're added — as an editor or a viewer.",
    tag: "Confirmed by code",
  },
  {
    icon: ArrowLeftRight,
    title: "Write down every rupee",
    text: "Tap Add Cash, pick in or out, note who and why. The balance works itself out — no formulas to maintain.",
    tag: "In / out",
  },
  {
    icon: BellRing,
    title: "Everyone stays current",
    text: "Both dashboards refresh on their own, and a fresh PDF statement is emailed to you and your partners after each entry.",
    tag: "Live + PDF",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-surface/60">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="script text-3xl -mb-1">Five easy steps</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary">From sign-up to shared books</h2>
          <p className="text-muted mt-3 max-w-md mx-auto">No setup guides, no spreadsheets to share around. Here is the whole journey.</p>
        </div>

        <ol className="relative">
          <div className="absolute left-5 md:left-1/2 top-2 bottom-2 w-px bg-border md:-translate-x-1/2" aria-hidden />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const right = i % 2 === 1;
            return (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45 }}
                className={cn("relative pl-16 md:pl-0 pb-10 last:pb-0 md:grid md:grid-cols-2 md:gap-14")}
              >
                <span className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold ring-4 ring-background">
                  {i + 1}
                </span>
                <div className={cn("rounded-2xl bg-surface border border-border p-5 shadow-[0_6px_18px_rgba(70,86,140,0.08)]", right ? "md:col-start-2" : "md:col-start-1 md:text-right")}>
                  <div className={cn("flex items-center gap-2 mb-1.5 text-primary", !right && "md:justify-end")}>
                    <Icon size={18} />
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted">{step.text}</p>
                  <span className="inline-block mt-3 text-[11px] font-semibold uppercase tracking-wider text-primary bg-surface-2 rounded-full px-2.5 py-1">{step.tag}</span>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
