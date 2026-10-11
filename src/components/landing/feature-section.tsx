"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  icon,
  points,
  reverse,
  visual,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  points: string[];
  reverse?: boolean;
  visual: React.ReactNode;
}) {
  return (
    <section id={id} className="py-20 px-4">
      <div className={cn("max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center", reverse && "md:[&>*:first-child]:order-2")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
            {icon}
          </div>
          <p className="text-xs font-medium tracking-wide uppercase text-primary mb-2">{eyebrow}</p>
          <h3 className="text-2xl sm:text-3xl font-semibold mb-3">{title}</h3>
          <p className="text-muted mb-5">{description}</p>
          <ul className="flex flex-col gap-2">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          {visual}
        </motion.div>
      </div>
    </section>
  );
}
