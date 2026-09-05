# 📒 My Cashbook - Full-Stack Financial Tracking System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-Sheets%20%2B%20Gmail-4285F4?logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![Google OAuth](https://img.shields.io/badge/Google%20OAuth-2.0-EA4335?logo=google&logoColor=white)](https://cloud.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A lightweight, robust, and full-stack cashbook and financial ledger management web application. Features multi-user accounts, cashbook organization, Cash In / Cash Out transaction records, automated real-time balance calculations, partner/nominee support, OTP-verified collaborator sharing, and a comprehensive Super Admin overview.

Built with a **dual database architecture**: operates out of the box with zero setup using a local database fallback, or seamlessly connects to **Google Sheets + Google Apps Script** for cloud persistence and automated Gmail OTP delivery.

---

## 🌟 Features

- 🔐 **Dual Authentication Modes**
  - Standard Email & Password registration/login with client-side validation.
  - One-click **Sign in with Google (OAuth 2.0)** with automatic account creation and ID token verification.
- 💼 **Multi-Cashbook Management**
  - Create and manage separate books (ledgers) for personal, business, or household finances.
  - Specify optional **Partner / Nominee** names and emails for each ledger.
- 💸 **Transaction Tracking & Real-Time Balance**
  - Add **Cash In** (income/credits) and **Cash Out** (expenses/debits) entries with descriptions and timestamps.
  - Automatically calculates cumulative balance per cashbook and updates overview metrics.
- 🤝 **Secure Collaborator Sharing via OTP**
  - Invite co-managers to shared cashbooks using email-based **6-Digit One-Time Passwords (OTP)**.
  - Verify and record collaborator banking credentials (Account Number & IFSC).
  - Collaborators receive read/write access to shared ledgers in their own dashboard.
- 🛡️ **Super Admin Dashboard**
  - Centralized master ledger displaying every cashbook across the entire system.
  - Consolidates owner details, transaction balances, and collaborator listings in one unified view.
- ⚡ **Zero-Config Dual Data Engine**
  - **Local Mode (Default):** Runs instantly using `data/db.json` and terminal-logged OTPs for offline/development work.
  - **Cloud Mode:** Integrates with Google Sheets as a spreadsheet database via Google Apps Script Web App and sends live Gmail OTPs.

---

## 🏗️ Architecture & Project Structure

```
cashbook-app/
├── Code.gs.txt               # Google Apps Script Web App source code (Sheets DB & Gmail OTP)
├── README.md                 # Project documentation
├── .gitignore                # Git ignore rules for keys, data, and environment variables
├── backend/
│   ├── .env.example          # Environment variable template
│   ├── .gitignore            # Backend-specific ignore file
│   ├── server.js             # Express REST API, auth routes, and business logic
│   ├── sheetsDb.js           # Google Apps Script Web App API integration client
│   ├── package.json          # Node dependencies and scripts
│   └── data/
│       └── db.json           # Local development database fallback
└── frontend/
    ├── shared.css            # Global typography, color palette, design tokens & UI components
    ├── login.html/.css/.js   # User Login page & Google OAuth integration
    ├── signup.html/.css/.js  # User Sign-Up registration page
    ├── cashbooks.html/.css/.js # User cashbook list dashboard & navigation
    ├── add-cashbook.html/.css/.js # New cashbook creation modal/page
    ├── cashbook-detail.html/.css/.js # Cash In/Out ledger, entries list, and OTP collaborator flow
    └── superadmin.html/.css/.js   # Master administrative view across all users
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v16.x or later recommended)
- **npm** (comes with Node.js)
- A modern web browser

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```
The backend will launch on **`http://localhost:5000`**.
> **Note:** By default, it will automatically run in local mode with `backend/data/db.json`.

### 3. Frontend Setup
You can serve the frontend using any static HTTP server (recommended for Google OAuth compatibility):

```bash
# From the project root or frontend directory:
cd frontend
npx serve . -l 5500
```
Open **`http://localhost:5500/login.html`** in your browser.

---

## 🧪 Demo Credentials (Local Mode)

| Account | Email | Password | Role / Data |
|---|---|---|---|
| User 1 | `trusha@example.com` | `trusha123` | Seeded with 2 cashbooks ("List 1", "List 2") |
| User 2 | `rohan@example.com` | `rohan123` | Seeded user account |
| Super Admin | Access via `/superadmin.html` | — | View all accounts & ledgers |

You can also sign up with any new email/password directly from the UI.

---

## 🔌 Cloud Setup: Google Sheets & Gmail Integration

To persist data in a live Google Sheet and deliver real OTP emails through Gmail:

### Step 1: Create the Google Sheet
1. Visit [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Create **4 tabs** with the exact names and headers below:
   - **`Users`**: `id` | `name` | `email` | `password`
   - **`Cashbooks`**: `id` | `name` | `ownerId` | `partnerName` | `partnerEmail` | `transactions`
   - **`Collaborators`**: `cashbookId` | `collaboratorEmail` | `accountNumber` | `ifsc`
   - **`Otps`**: `email` | `code`
3. Copy the Spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`).

### Step 2: Deploy the Apps Script Web App
1. Open [Google Apps Script](https://script.google.com) and create a new project.
2. Replace all script code with the contents of [`Code.gs.txt`](Code.gs.txt).
3. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` on line 9 with your Sheet ID.
4. Click **Deploy** > **New deployment**:
   - **Select type**: Web App
   - **Execute as**: Me (`your-email@gmail.com`)
   - **Who has access**: Anyone
5. Copy the generated **Web App URL** (`https://script.google.com/macros/s/.../exec`).

### Step 3: Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```
Restart the backend server. The console will confirm:
```
Database: Google Sheets (via Apps Script)
```

---

## 🔑 Google OAuth 2.0 (Sign in with Google) Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Configure your **OAuth consent screen** (External).
3. Navigate to **Credentials** > **Create Credentials** > **OAuth Client ID** > **Web Application**.
4. Add your frontend URL to **Authorized JavaScript origins** (e.g. `http://localhost:5500`).
5. Copy the **Client ID** and update:
   - `backend/.env`: `GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
   - `frontend/login.js`: `const GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com";`
   - `frontend/signup.js`: `const GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com";`

---

## 🌐 Cloud Deployment Guide

### Option A: Deploy on Render (Recommended - Free & 1-Click All-in-One)

Render can host both your Express backend and your frontend static files together under a single URL with zero CORS issues.

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub repository (`TruCoded/cashbook_sql`).
3. Configure the settings:
   - **Name**: `my-cashbook`
   - **Environment**: `Node`
   - **Build Command**: `npm install --prefix backend`
   - **Start Command**: `node backend/server.js`
4. Add **Environment Variables** (under *Advanced*):
   - `APPS_SCRIPT_URL`: *(Your deployed Google Apps Script Web App URL)*
   - `GOOGLE_CLIENT_ID`: *(Optional, for Google Sign-In)*
5. Click **Create Web Service**. Your app is live at `https://your-app.onrender.com`!

### Option B: Deploy on Vercel

If deploying the frontend on Vercel:
1. Import your GitHub repository to [Vercel](https://vercel.com/).
2. Keep the root directory or set it to `./`.
3. Vercel will use `vercel.json` to route frontend files and backend requests.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signup` | Register a new user (`name`, `email`, `password`) |
| `POST` | `/api/login` | Authenticate existing user |
| `POST` | `/api/auth/google` | Verify Google ID token and auto-create/login user |
| `GET` | `/api/cashbooks?userId=&email=` | Fetch all cashbooks owned by or shared with user |
| `POST` | `/api/cashbooks` | Create a new cashbook with optional partner info |
| `GET` | `/api/cashbooks/:id` | Get details, transactions, and collaborators for a cashbook |
| `POST` | `/api/cashbooks/:id/transactions` | Add a new Cash In / Cash Out transaction |
| `POST` | `/api/cashbooks/:id/send-otp` | Generate and dispatch 6-digit OTP to collaborator email |
| `POST` | `/api/cashbooks/:id/collaborators` | Verify OTP and attach collaborator bank info |
| `GET` | `/api/superadmin/all` | Retrieve master aggregate list of all users and cashbooks |

---

## 🔒 Security & Best Practices

- All sensitive keys, `.env` files, credentials, and local database records are protected via `.gitignore`.
- Password verification is designed for demonstration purposes; for production deployments, integrate `bcrypt` hashing and JSON Web Tokens (JWT).
- Apps Script Web App runs securely under Google authorization with zero API key leaks to the client.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
