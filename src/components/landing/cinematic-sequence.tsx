"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Wallet, ArrowDownLeft, ArrowUpRight, Users, RefreshCw, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FRAMES = [
  { icon: Wallet, title: "Create a cashbook", detail: "“Sharma General Store” appears in seconds." },
  { icon: Wallet, title: "Open it up", detail: "See balance, history and partners at a glance." },
  { icon: ArrowDownLeft, title: "Cash In", detail: "+ ₹5,000 from a customer payment." },
  { icon: ArrowUpRight, title: "Cash Out", detail: "− ₹2,000 for a stock purchase." },
  { icon: Users, title: "Add a partner", detail: "Enter Rahul's Gmail, then the code he receives." },
  { icon: RefreshCw, title: "Both stay in sync", detail: "Every change appears on both dashboards." },
  { icon: FileText, title: "PDF in every inbox", detail: "A fresh statement is emailed after each change." },
] as const;

export function CinematicSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Server and first client render both assume motion is fine; if the user's
  // OS says otherwise we swap to the static list right after mount.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mql.matches);
    const raf = requestAnimationFrame(sync);
    mql.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(raf);
      mql.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (reduced || !sectionRef.current) return;

    const section = sectionRef.current;
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${FRAMES.length * 60}%`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.6,
      onUpdate: (self) => {
        const idx = Math.min(FRAMES.length - 1, Math.floor(self.progress * FRAMES.length));
        setActive(idx);
      },
    });

    // Layout can still be settling (web fonts, images) right after mount —
    // refreshing once on the next frame keeps the pin's start/end accurate.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      trigger.kill();
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section id="how-it-works" className="py-24 px-4 max-w-3xl mx-auto flex flex-col gap-6">
        <SectionHeading />
        {FRAMES.map((frame, i) => (
          <FrameCard key={i} frame={frame} />
        ))}
      </section>
    );
  }

  return (
    <section id="how-it-works" ref={sectionRef} className="relative h-screen overflow-hidden flex flex-col items-center justify-center px-4">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center">
        <SectionHeading compact />
      </div>
      <div className="relative w-full max-w-sm h-72">
        {FRAMES.map((frame, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              i === active ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <FrameCard frame={frame} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-8">
        {FRAMES.map((_, i) => (
          <div key={i} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-primary" : "w-1.5 bg-border")} />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "text-center mb-12"}>
      <h2 className="text-2xl sm:text-3xl font-semibold">How Cashbook works</h2>
      {!compact && <p className="text-muted mt-2">Scroll to see the whole flow, frame by frame.</p>}
    </div>
  );
}

function FrameCard({ frame }: { frame: (typeof FRAMES)[number] }) {
  const Icon = frame.icon;
  return (
    <div className="glass rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center gap-4">
      <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
        <Icon size={26} />
      </div>
      <div>
        <p className="font-semibold text-lg">{frame.title}</p>
        <p className="text-sm text-muted mt-1">{frame.detail}</p>
      </div>
    </div>
  );
}
