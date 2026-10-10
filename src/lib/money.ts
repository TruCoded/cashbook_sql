// Money is always represented in minor units (e.g. paise, cents) as integers
// to avoid floating point rounding errors. UI-facing values are decimal strings.

export function toMinorUnits(amount: number | string): number {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) throw new Error("Invalid amount");
  return Math.round(value * 100);
}

export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatMoney(minor: number, currency = "INR"): string {
  const symbol = currencySymbols[currency] ?? currency + " ";
  const value = fromMinorUnits(minor);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${value < 0 ? "-" : ""}${symbol}${formatted}`;
}
