"use client";

import { motion } from "framer-motion";
import { Users, KeyRound, FileText, ShieldCheck, History, Smartphone } from "lucide-react";

const FEATURES = [
  { icon: Users, title: "One shared book", text: "You and your partners look at the very same ledger. Whatever one person adds, the others see.", wide: true },
  { icon: KeyRound, title: "Two ways to sign in", text: "Use a password you choose, or get a one-time code in Gmail. Switch whenever you like." },
  { icon: FileText, title: "Statements by email", text: "After every cash in, cash out or delete, a PDF with the balance and full history reaches everyone's inbox.", wide: true },
  { icon: ShieldCheck, title: "You decide who edits", text: "Give each partner edit or view-only access, and remove them at any time." },
  { icon: History, title: "A trail of every action", text: "The activity feed records who did what and when, across all your cashbooks." },
  { icon: Smartphone, title: "Install it like an app", text: "Add Cashbook to your phone's home screen. It opens full screen and sits in your recent apps.", id: "install" },
] as const;

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="script text-3xl -mb-1">Made for sharing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary">Everything a shared cashbook needs</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const wide = "wide" in f && f.wide;
            return (
              <motion.div
                key={f.title}
                id={"id" in f ? f.id : undefined}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                className={`rounded-2xl p-6 border border-border ${wide ? "lg:col-span-2 bg-surface-2" : "bg-surface"} shadow-[0_6px_18px_rgba(70,86,140,0.08)]`}
              >
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted">{f.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
