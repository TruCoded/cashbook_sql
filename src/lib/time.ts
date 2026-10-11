// Servers (Vercel) run in UTC, so statements and emails format times explicitly in IST.
const TZ = "Asia/Kolkata";

export function formatDateTimeIST(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));
}
