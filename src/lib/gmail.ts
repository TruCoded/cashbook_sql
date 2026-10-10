export const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();

/** OTPs are only delivered to Gmail inboxes. */
export const isGmail = (e: string) => /^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(e.trim());

export const GMAIL_ONLY_MESSAGE = "Please use a Gmail address (name@gmail.com)";
