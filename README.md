# My Cashbook

Cashora's website and features, in Cashbook's cream/navy theme (Playfair Display + Poppins), running on Cashbook's
MongoDB + Gmail (nodemailer) setup.

## Environment variables (same names already in your Vercel project)

| Variable | Notes |
|---|---|
| `GMAIL_USER` | Gmail address that sends OTPs and PDFs |
| `GMAIL_APP_PASSWORD` | Gmail App Password (spaces are stripped automatically) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | existing database name, e.g. `cashbook` |
| `OTP_SECRET` | optional; signs OTPs and sessions (falls back to a key derived from `GMAIL_APP_PASSWORD`) |

No other variables are needed.

## Run

    npm install
    cp .env.example .env.local   # fill in
    npm run dev                  # http://localhost:3000

Deploy: push to GitHub, import in Vercel (framework: Next.js). It is a Next.js app now, so the old `api/` and `public/` folders are gone.

## What it does

- Sign up / sign in with a 6-digit OTP emailed via nodemailer/SMTP. **Gmail addresses only.**
- Create cashbooks, add cash in / cash out, search and filter, charts, activity feed.
- **Add a partner**: owner enters partner's Gmail -> code is emailed to the partner -> owner enters it -> partner is added
  and immediately receives a PDF copy. View-only or can-edit permission.
- Partner sees the cashbook under "Shared with me"; both dashboards refresh every few seconds, so each side sees the other's entries.
- Every cash in, cash out or delete (by owner or partner) emails a fresh PDF statement to the owner and all partners.
- "PDF" button on a cashbook downloads the current statement.

## Database

Reuses your existing `users` collection (same `id`, `name`, `businessName`, `email`, `picture` fields), so existing accounts work.
New data lives in `cb_books`, `cb_transactions`, `cb_partners`, `cb_activity`, `cb_ratelimits`.
Atlas must allow Vercel's IPs (Network Access: 0.0.0.0/0).

## Notes

- Gmail sends ~500 emails/day; each transaction sends one email per person on the cashbook.
- PDF amounts show `Rs.` (standard PDF fonts have no rupee symbol); the website uses the rupee sign. Times are in IST.
