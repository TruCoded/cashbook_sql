import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDateTimeIST } from "@/lib/time";

export interface StatementTx {
  id: string;
  type: "CASH_IN" | "CASH_OUT";
  amountMinor: number;
  description?: string | null;
  person?: string | null;
  category?: string | null;
  notes?: string | null;
  occurredAt: Date;
  byName: string;
}

export interface StatementInput {
  cashbookName: string;
  description?: string | null;
  currency: string;
  ownerName: string;
  ownerEmail: string;
  partners: { name: string; email: string; permission: string }[];
  initialBalanceMinor: number;
  transactions: StatementTx[];
  highlightId?: string;
}

// Cashbook palette
const C = {
  navy: rgb(0.275, 0.337, 0.549), // #46568c
  navyDark: rgb(0.2, 0.247, 0.42), // #333f6b
  cream: rgb(0.965, 0.949, 0.918), // #f6f2ea
  lavender: rgb(0.871, 0.894, 0.965), // #dee4f6
  card: rgb(0.906, 0.925, 0.973), // #e7ecf8
  text: rgb(0.184, 0.2, 0.314), // #2f3350
  muted: rgb(0.373, 0.396, 0.522), // #5f6585
  green: rgb(0.18, 0.49, 0.31), // #2e7d4f
  red: rgb(0.71, 0.259, 0.227), // #b5423a
  white: rgb(1, 1, 1),
};

// Standard PDF fonts only cover Latin-1, so anything else becomes "?" instead of crashing.
const UNSUPPORTED = /[^\x20-\x7E\xA0-\xFF\u20AC\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026]/g;
const safe = (s: unknown) => String(s ?? "").replace(/[\r\n\t]+/g, " ").replace(UNSUPPORTED, "?");

export function plainMoney(minor: number, currency: string) {
  const v = minor / 100;
  const num = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
  const sym = currency === "INR" ? "Rs. " : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;
  return `${v < 0 ? "-" : ""}${sym}${num}`;
}

export async function buildStatementPdf(input: StatementInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${safe(input.cashbookName)} - Cashbook statement`);
  pdf.setAuthor("Cashbook");
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serifB = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const W = 595.28;
  const H = 841.89;
  const M = 40;
  const CW = W - 2 * M;
  const pages: PDFPage[] = [];

  const fit = (text: string, font: PDFFont, size: number, maxW: number) => {
    let s = safe(text);
    if (font.widthOfTextAtSize(s, size) <= maxW) return s;
    while (s.length > 1 && font.widthOfTextAtSize(`${s}…`, size) > maxW) s = s.slice(0, -1);
    return `${s}…`;
  };
  const draw = (page: PDFPage, text: string, x: number, y: number, o: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; maxW?: number; right?: boolean }) => {
    const font = o.font ?? sans;
    const size = o.size ?? 9;
    const s = o.maxW ? fit(text, font, size, o.maxW) : safe(text);
    const px = o.right ? x - font.widthOfTextAtSize(s, size) : x;
    page.drawText(s, { x: px, y, size, font, color: o.color ?? C.text });
  };

  // ---- running balance, oldest -> newest, then shown newest first ----
  const asc = [...input.transactions].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  let running = input.initialBalanceMinor;
  const withBal = asc.map((t) => {
    running += t.type === "CASH_IN" ? t.amountMinor : -t.amountMinor;
    return { ...t, balanceAfter: running };
  });
  const rows = withBal.reverse();
  const cashIn = input.transactions.filter((t) => t.type === "CASH_IN").reduce((s, t) => s + t.amountMinor, 0);
  const cashOut = input.transactions.filter((t) => t.type === "CASH_OUT").reduce((s, t) => s + t.amountMinor, 0);
  const balance = input.initialBalanceMinor + cashIn - cashOut;

  // ---- first page: header, people, summary ----
  let page = pdf.addPage([W, H]);
  pages.push(page);
  page.drawRectangle({ x: 0, y: H - 100, width: W, height: 100, color: C.navy });
  draw(page, "MY CASHBOOK", M, H - 34, { font: sansB, size: 9, color: C.lavender });
  draw(page, input.cashbookName, M, H - 62, { font: serifB, size: 24, color: C.white, maxW: CW });
  draw(page, `Statement generated ${formatDateTimeIST(new Date())} IST`, M, H - 84, { size: 9, color: C.lavender });

  let y = H - 126;
  if (input.description) {
    draw(page, input.description, M, y, { size: 9.5, color: C.muted, maxW: CW });
    y -= 16;
  }
  draw(page, "Owner", M, y, { font: sansB, size: 9, color: C.navy });
  draw(page, `${input.ownerName} (${input.ownerEmail})`, M + 52, y, { size: 9, maxW: CW - 52 });
  y -= 14;
  draw(page, "Partners", M, y, { font: sansB, size: 9, color: C.navy });
  const partnerText = input.partners.length
    ? input.partners.map((p) => `${p.name} (${p.email}, ${p.permission === "EDIT" ? "can edit" : "view only"})`).join("; ")
    : "None yet";
  draw(page, partnerText, M + 52, y, { size: 9, maxW: CW - 52 });
  y -= 26;

  const gap = 10;
  const bw = (CW - 2 * gap) / 3;
  [
    { label: "BALANCE", value: plainMoney(balance, input.currency), color: C.navy },
    { label: "CASH IN", value: plainMoney(cashIn, input.currency), color: C.green },
    { label: "CASH OUT", value: plainMoney(cashOut, input.currency), color: C.red },
  ].forEach((b, i) => {
    const x = M + i * (bw + gap);
    page.drawRectangle({ x, y: y - 50, width: bw, height: 50, color: C.card });
    draw(page, b.label, x + 12, y - 17, { font: sansB, size: 8, color: C.navy });
    draw(page, b.value, x + 12, y - 38, { font: serifB, size: 16, color: b.color, maxW: bw - 20 });
  });
  y -= 76;

  // ---- table ----
  const col = { date: M + 8, details: M + 102, by: M + 280, amt: M + CW - 86, bal: M + CW - 8 };
  const ROW = 32;
  const tableHeader = (p: PDFPage, top: number) => {
    p.drawRectangle({ x: M, y: top - 22, width: CW, height: 22, color: C.lavender });
    draw(p, "DATE", col.date, top - 15, { font: sansB, size: 8, color: C.navy });
    draw(p, "DETAILS", col.details, top - 15, { font: sansB, size: 8, color: C.navy });
    draw(p, "BY", col.by, top - 15, { font: sansB, size: 8, color: C.navy });
    draw(p, "AMOUNT", col.amt, top - 15, { font: sansB, size: 8, color: C.navy, right: true });
    draw(p, "BALANCE", col.bal, top - 15, { font: sansB, size: 8, color: C.navy, right: true });
    return top - 22;
  };

  draw(page, "Transactions", M, y, { font: serifB, size: 14, color: C.navy });
  y -= 10;
  y = tableHeader(page, y);

  const ensureSpace = () => {
    if (y - ROW < 56) {
      page = pdf.addPage([W, H]);
      pages.push(page);
      y = tableHeader(page, H - 48);
    }
  };

  rows.forEach((t, i) => {
    ensureSpace();
    const top = y;
    if (t.id === input.highlightId) {
      page.drawRectangle({ x: M, y: top - ROW, width: CW, height: ROW, color: C.lavender });
      page.drawRectangle({ x: M, y: top - ROW, width: 3, height: ROW, color: C.navy });
    } else if (i % 2 === 1) {
      page.drawRectangle({ x: M, y: top - ROW, width: CW, height: ROW, color: C.cream });
    }
    const isIn = t.type === "CASH_IN";
    const title = t.description || t.category || (isIn ? "Cash in" : "Cash out");
    const sub = [t.person && (isIn ? `From ${t.person}` : `To ${t.person}`), t.category, t.notes].filter(Boolean).join("  ·  ");
    const [dayPart, timePart = ""] = formatDateTimeIST(t.occurredAt).split(", ");
    draw(page, dayPart, col.date, top - 14, { size: 8.5 });
    draw(page, timePart, col.date, top - 25, { size: 7.5, color: C.muted });
    draw(page, title, col.details, top - 14, { font: sansB, size: 9, maxW: 170 });
    if (sub) draw(page, sub, col.details, top - 25, { size: 7.5, color: C.muted, maxW: 170 });
    draw(page, t.byName, col.by, top - 14, { size: 8.5, maxW: 56 });
    draw(page, `${isIn ? "+" : "-"} ${plainMoney(t.amountMinor, input.currency)}`, col.amt, top - 14, {
      font: sansB,
      size: 9,
      color: isIn ? C.green : C.red,
      right: true,
    });
    draw(page, plainMoney(t.balanceAfter, input.currency), col.bal, top - 14, { size: 8.5, color: t.balanceAfter < 0 ? C.red : C.text, right: true });
    y -= ROW;
  });

  // opening balance row
  ensureSpace();
  page.drawRectangle({ x: M, y: y - 26, width: CW, height: 26, color: C.card });
  draw(page, "Opening balance", col.details - 94, y - 17, { font: sansB, size: 9, color: C.navy });
  draw(page, plainMoney(input.initialBalanceMinor, input.currency), col.bal, y - 17, { font: sansB, size: 9, color: C.navy, right: true });
  y -= 26;

  if (rows.length === 0) {
    draw(page, "No transactions recorded yet.", M + 8, y - 20, { size: 9.5, color: C.muted });
  }

  // ---- footer on every page ----
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 38 }, end: { x: W - M, y: 38 }, thickness: 0.5, color: C.lavender });
    draw(p, `Cashbook  ·  ${input.cashbookName}`, M, 24, { size: 8, color: C.muted, maxW: CW - 80 });
    draw(p, `Page ${i + 1} of ${pages.length}`, W - M, 24, { size: 8, color: C.muted, right: true });
  });

  return pdf.save();
}
