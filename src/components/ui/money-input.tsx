"use client";

import { forwardRef, useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

// Indian digit grouping: last 3 digits, then groups of 2 (1,00,000 not 100,000).
function groupIndian(intDigits: string): string {
  if (intDigits.length <= 3) return intDigits;
  const last3 = intDigits.slice(-3);
  const rest = intDigits.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d)$)/g, ",");
  return `${grouped},${last3}`;
}

function formatRaw(raw: string): string {
  if (!raw) return "";
  const [intPart, decPart] = raw.split(".");
  const groupedInt = groupIndian(intPart || "0");
  return decPart !== undefined ? `${groupedInt}.${decPart.slice(0, 2)}` : groupedInt;
}

// Keeps digits and at most one decimal point — this is what actually gets
// submitted (and what zod's z.coerce.number() parses); commas are purely
// a display concern layered on top in this component.
function sanitize(input: string): string {
  let out = "";
  let seenDot = false;
  for (const ch of input) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "." && !seenDot) {
      out += ch;
      seenDot = true;
    }
  }
  return out;
}

interface MoneyInputProps {
  value: string;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  id?: string;
  autoFocus?: boolean;
}

/**
 * Text input that displays comma-grouped digits (Indian numbering) while
 * typing, but reports a plain numeric string via onChange — so it drops
 * straight into a react-hook-form Controller for an amount/balance field
 * without changing how the value is validated or submitted.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, onBlur, placeholder, className, id, autoFocus }, forwardedRef) => {
    const innerRef = useRef<HTMLInputElement>(null);

    const setRef = (el: HTMLInputElement | null) => {
      innerRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursor = input.selectionStart ?? input.value.length;
      const digitsBeforeCursor = input.value.slice(0, cursor).replace(/[^0-9.]/g, "").length;

      const rawSanitized = sanitize(input.value);
      onChange(rawSanitized);

      // Cursor position resets after React re-renders with the reformatted
      // (comma-inserted) value — restore it to just after the same digit.
      requestAnimationFrame(() => {
        const el = innerRef.current;
        if (!el) return;
        const reformatted = formatRaw(rawSanitized);
        let count = 0;
        let pos = reformatted.length;
        for (let i = 0; i < reformatted.length; i++) {
          if (/[0-9.]/.test(reformatted[i])) count++;
          if (count === digitsBeforeCursor) {
            pos = i + 1;
            break;
          }
        }
        el.setSelectionRange(pos, pos);
      });
    };

    return (
      <input
        ref={setRef}
        id={id}
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={formatRaw(value)}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow",
          className
        )}
      />
    );
  }
);
MoneyInput.displayName = "MoneyInput";
