"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";

export function AnimatedMoney({ minor, currency = "INR", className }: { minor: number; currency?: string; className?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = prevRef.current;
    const to = minor;
    const duration = prefersReducedMotion ? 0 : 500;
    const start = performance.now();

    let frame: number;
    function tick(now: number) {
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [minor]);

  return <span className={`font-serif ${className ?? ""}`}>{formatMoney(display, currency)}</span>;
}
