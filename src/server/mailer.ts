import "server-only";
// Nodemailer over Gmail SMTP, using the same GMAIL_USER / GMAIL_APP_PASSWORD as Cashbook.
import nodemailer from "nodemailer";
import { mailEnv } from "@/lib/env";

export class MailConfigError extends Error {}

function getTransport() {
  const { user, pass, host, port } = mailEnv();
  const missing: string[] = [];
  if (!user) missing.push("GMAIL_USER");
  if (!pass) missing.push("GMAIL_APP_PASSWORD");
  if (missing.length) throw new MailConfigError(`Missing environment variable(s) on Vercel: ${missing.join(", ")}`);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user, pass },
    // Without timeouts a blocked port makes the function hang until Vercel kills it.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

/** Turns raw nodemailer errors into something the user can act on. */
export function explainMailError(err: unknown): string {
  if (err instanceof MailConfigError) return err.message;
  switch ((err as { code?: string })?.code) {
    case "EAUTH":
      return "SMTP login was rejected. For Gmail use an App Password (2-Step Verification must be on), not your normal password.";
    case "ECONNECTION":
    case "ETIMEDOUT":
    case "ESOCKET":
    case "ECONNREFUSED":
    case "EDNS":
      return "Could not connect to the SMTP server. Check SMTP_HOST / SMTP_PORT (465 or 587).";
    case "EENVELOPE":
      return "The recipient email address was rejected by the mail server.";
    default:
      return "The mail server could not send the email.";
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Cashbook look: cream page, white card, navy headings, serif title.
function shell(inner: string) {
  return `<div style="background:#f6f2ea;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#2f3350">
    <div style="max-width:480px;margin:auto;background:#ffffff;border-radius:16px;padding:28px;box-shadow:0 6px 18px rgba(70,86,140,.10)">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:.2em;color:#46568c">MY CASHBOOK</p>
      ${inner}
    </div>
    <p style="text-align:center;font-size:11px;color:#6478ac;margin:14px 0 0">Sent by Cashbook</p>
  </div>`;
}

export async function sendOtpMail(to: string, code: string, actionText: string) {
  const { from } = mailEnv();
  await getTransport().sendMail({
    from,
    to,
    subject: `Your Cashbook verification code: ${code}`,
    text: `Your verification code is ${code}. ${actionText} It expires in 10 minutes. If you didn't expect this, ignore this email.`,
    html: shell(`
      <h2 style="margin:14px 0 6px;font-family:Georgia,'Times New Roman',serif;color:#46568c">Verification code</h2>
      <p style="margin:0 0 4px;font-size:14px">${esc(actionText)}</p>
      <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:18px 0;color:#333f6b">${code}</p>
      <p style="color:#6478ac;font-size:12px;margin:0">It expires in 10 minutes. If you didn't expect this, you can ignore this email.</p>`),
  });
}

export interface StatementMail {
  to: string;
  subject: string;
  greeting: string;
  headline: string;
  detail?: string;
  cashbookName: string;
  balanceText: string;
  cashInText: string;
  cashOutText: string;
  pdf: Uint8Array;
  filename: string;
}

export async function sendStatementMail(m: StatementMail) {
  const { from } = mailEnv();
  const box = (label: string, value: string, color: string) =>
    `<td style="background:#e7ecf8;border-radius:10px;padding:10px;text-align:center">
       <div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#46568c">${label}</div>
       <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:700;margin-top:4px;color:${color}">${esc(value)}</div>
     </td>`;
  await getTransport().sendMail({
    from,
    to: m.to,
    subject: m.subject,
    text: `${m.greeting}\n\n${m.headline}${m.detail ? `\n${m.detail}` : ""}\n\nCashbook: ${m.cashbookName}\nBalance: ${m.balanceText} (In ${m.cashInText}, Out ${m.cashOutText})\n\nThe full statement is attached as a PDF.`,
    html: shell(`
      <p style="margin:18px 0 4px;font-size:14px">${esc(m.greeting)}</p>
      <h2 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;color:#46568c;font-size:20px">${esc(m.headline)}</h2>
      ${m.detail ? `<p style="margin:0 0 14px;font-size:13px;color:#2f3350">${esc(m.detail)}</p>` : ""}
      <p style="margin:14px 0 8px;font-size:13px;color:#46568c;font-weight:700">${esc(m.cashbookName)}</p>
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0" style="border-collapse:separate;margin:0 -6px"><tr>
        ${box("Balance", m.balanceText, "#46568c")}${box("Cash in", m.cashInText, "#2e7d4f")}${box("Cash out", m.cashOutText, "#b5423a")}
      </tr></table>
      <p style="margin:16px 0 0;font-size:12.5px;color:#6478ac">The full cashbook statement is attached as a PDF.</p>`),
    attachments: [{ filename: m.filename, content: Buffer.from(m.pdf), contentType: "application/pdf" }],
  });
}
