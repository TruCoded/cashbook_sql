# 📖 My Cashbook

A modern, full-stack collaborative cash flow and ledger management system built with **Next.js 16**, **TypeScript**, **MongoDB**, and **Tailwind CSS**. Designed for small businesses, freelancers, and teams to track daily income and expenses with automated Gmail notifications, real-time collaboration, PDF statement generation, and offline-capable PWA support.

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_Vercel-black?style=for-the-badge&logo=vercel)](https://cashbook-sql.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## ✨ Features

- 🔐 **Flexible Authentication**: Sign up and sign in using either a standard password or a secure **6-digit Gmail OTP** verification flow.
- 💰 **Cash In & Cash Out Tracking**: Seamlessly log income and expenses with customizable categories, payment modes, descriptions, and timestamps.
- 🤝 **Real-Time Partner Collaboration**:
  - Invite co-owners or accountants to your cashbook via verified Gmail OTP confirmation.
  - Granular permissions: **Can Edit** or **View Only**.
  - Automatic balance and transaction ledger sync across shared dashboards.
- 📄 **Automated PDF Statements**:
  - Download polished, branded PDF statements on demand.
  - Automatic email delivery of fresh PDF statements to all partners upon transaction updates.
- 📊 **Analytics & Visualizations**:
  - Interactive income vs. expense cash flow charts.
  - Category breakdown and net balance indicators.
- 📱 **Progressive Web App (PWA)**:
  - Installable directly to home screens on Android, iOS, Windows, and macOS.
  - Offline fallback view and native app-like experience.
- 🛡️ **Built-in Security & Rate Limiting**:
  - Scrypt password hashing with session JWTs.
  - Sliding-window database rate limiting for authentication and OTP endpoints.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & ODM**: [MongoDB Atlas](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom typography & rich animations
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/)
- **Email Service**: [Nodemailer](https://nodemailer.com/) (Gmail SMTP Integration)
- **Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+ or Node.js 20+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- A Gmail account with an **App Password** generated ([Google App Passwords](https://myaccount.google.com/apppasswords))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TruCoded/cashbook_sql.git
   cd cashbook_sql
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` or `.env.local` file in the root directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=cashbook

   # Gmail Notification & OTP Service
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password

   # Authentication & Security
   OTP_SECRET=your-random-32-character-secret-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

| Variable | Description | Required |
|---|---|:---:|
| `MONGODB_URI` | MongoDB Atlas SRV connection string with database credentials | Yes |
| `MONGODB_DB_NAME` | Database name (e.g. `cashbook`) | Yes |
| `GMAIL_USER` | Gmail address used to send verification OTPs and PDF receipts | Yes |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password (without spaces) | Yes |
| `OTP_SECRET` | Secret key used to sign OTP tokens and session cookies | Yes |

---

## 🗄️ Database Schema Overview

| Collection | Purpose |
|---|---|
| `users` | User accounts, profiles, credentials, and settings |
| `cb_books` | Cashbook metadata, owner reference, and initial balances |
| `cb_transactions` | Cash-in and cash-out records with timestamps and amounts |
| `cb_partners` | Multi-user collaboration roles and access permissions |
| `cb_activity` | Audit log of actions taken across cashbooks |
| `cb_ratelimits` | TTL-indexed rate limiting entries |

---

## 🌐 Deployment on Vercel

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `OTP_SECRET`
4. Under **MongoDB Atlas > Network Access**, ensure `0.0.0.0/0` (Allow access from anywhere) is enabled so Vercel's serverless functions can connect.
5. Deploy!

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
