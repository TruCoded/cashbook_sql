"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

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
          Collaborative cash tracking
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
          Track. Share. Stay in sync.
        </motion.p>

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="text-muted max-w-lg">
          A collaborative cashbook where you and your partner track every rupee in and out — each change appears on both dashboards and lands in your Gmail as a PDF.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link href="/signup" className={buttonVariants({ size: "lg", className: "uppercase text-[13px]" })}>
            Get Started <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg", className: "uppercase text-[13px]" })}>
            See how it works
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-10 w-full max-w-md glass rounded-3xl p-5 text-left">
          <p className="text-sm text-muted mb-3">Sharma General Store</p>
          <p className="font-serif text-4xl font-semibold mb-4">₹63,000.00</p>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 text-sm text-cash-in bg-cash-in/10 rounded-full px-3 py-1.5">
              <ArrowDownLeft size={14} /> +₹5,000
            </div>
            <div className="flex items-center gap-2 text-sm text-cash-out bg-cash-out/10 rounded-full px-3 py-1.5">
              <ArrowUpRight size={14} /> -₹2,000
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
