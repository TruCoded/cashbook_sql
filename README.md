# 💼 My Cashbook — Full-Stack Financial Ledger & Mobile System

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2057-000000?logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Gmail SMTP](https://img.shields.io/badge/Gmail-Nodemailer%20OTP-EA4335?logo=gmail&logoColor=white)](https://nodemailer.com/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Database%20Engine-34A853?logo=googlesheets&logoColor=white)](https://developers.google.com/apps-script)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A lightweight, robust, and full-stack cashbook and financial ledger management system featuring both a **Web Application** and an **Android / iOS Mobile App (Expo SDK 57)** powered by a shared Express backend.

Features multi-user accounts, cashbook organization, Cash In / Cash Out transaction records, automated real-time balance calculations, partner/nominee support, OTP-verified collaborator sharing delivered directly via **Gmail SMTP**, and a comprehensive Super Admin dashboard.

---

## ✨ Key Features

- 🔐 **Dual Authentication Modes**
  - Standard Email & Password registration/login with client-side validation.
  - One-click **Sign in with Google** with instant profile creation.
- 📖 **Multi-Cashbook Management**
  - Create and manage separate books (ledgers) for personal, business, or household finances.
  - Specify optional **Partner / Nominee** names and emails for each ledger.
- 💵 **Transaction Tracking & Real-Time Balance**
  - Add **Cash In** (income/credits) and **Cash Out** (expenses/debits) entries with descriptions and timestamps.
  - Automatically calculates cumulative balance per cashbook and updates overview metrics.
- 📬 **Collaborator Sharing via Live Gmail OTP**
  - Invite co-managers to shared cashbooks using email-based **6-Digit One-Time Passwords (OTP)**.
  - Verifies and records collaborator banking credentials (Account Number & IFSC).
  - Delivered directly to collaborator inboxes via Gmail SMTP.
- 📊 **Super Admin Dashboard**
  - Centralized master ledger displaying every cashbook across the entire system.
  - Consolidates owner details, transaction balances, and collaborator listings in one unified view.
- 📱 **Cross-Platform Mobile App (Android & iOS)**
  - Built with **React Native & Expo SDK 57**.
  - Styled with Google Fonts (**Playfair Display** serif & **Poppins** sans-serif).
  - Ready for cloud compilation to standalone `.apk` via EAS Build.
- 🗄️ **Dual Data Engine**
  - **Local Mode (Default):** Runs instantly using `data/db.json` for offline/development work.
  - **Cloud Mode:** Integrates with Google Sheets as a spreadsheet database via Google Apps Script.

---

## 🏗️ Architecture & Project Structure

```text
cashbook-app/
├── backend/                        # Shared Express REST API & Database
│   ├── .env.example                # Environment variable template
│   ├── server.js                   # Express API, auth, and Gmail nodemailer logic
│   ├── sheetsDb.js                 # Google Sheets integration client
│   ├── package.json                # Backend dependencies
│   └── data/
│       └── db.json                 # Local database fallback
├── frontend/                       # Web Application
│   ├── shared.css                  # Global typography, color palette & UI tokens
│   ├── login.html/.css/.js         # Web login & Google One-Tap
│   ├── signup.html/.css/.js        # Web sign-up page
│   ├── cashbooks.html/.css/.js     # Cashbooks list dashboard
│   ├── add-cashbook.html/.css/.js  # Cashbook creation modal
│   ├── cashbook-detail.html/.css/.js # Ledger entries & OTP flow
│   └── superadmin.html/.css/.js    # Super Admin master view
└── mobile/                         # React Native / Expo Mobile App
    ├── App.js                      # Root navigator & Google Fonts loader
    ├── app.json                    # Expo config & deep link scheme
    ├── eas.json                    # EAS cloud build profiles (APK)
    ├── package.json                # Mobile dependencies
    └── src/
        ├── api.js                  # Mobile API endpoint URL
        ├── theme.js                # Playfair Display & Poppins typography tokens
        ├── context/AuthContext.js  # Mobile session state & AsyncStorage
        └── screens/                # Mobile app screens
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
npm install

# (Optional) Add your Gmail App Password to backend/.env for real email OTPs:
# GMAIL_USER=your_email@gmail.com
# GMAIL_APP_PASSWORD=your_16_digit_app_password

npm start
```
Backend will launch on **`http://localhost:5000`**.

---

### 2. Running the Web Application

Serve the `frontend` folder using any static server:

```bash
cd frontend
npx serve . -l 5500
```
Open **`http://localhost:5500/login.html`** in your browser.

---

### 3. Running the Mobile App (Expo)

```bash
cd mobile
npx expo start -c
```
- Open **Expo Go** on your phone and scan the QR code displayed in the terminal.
- Press `r` in the terminal to reload code changes.

---

## 📦 Building Standalone Android APK

To generate an installable `.apk` file for your Android phone:

```bash
cd mobile

# 1. Log in with your Expo account
npx eas login

# 2. Link EAS project (one-time)
npx eas init

# 3. Cloud build the preview APK
npx eas build --platform android --profile preview
```

---

## 🔑 Demo Credentials (Local Mode)

| Account | Email | Password | Role / Data |
|---|---|---|---|
| User 1 | `trusha@example.com` | `trusha123` | Seeded with sample cashbooks |
| User 2 | `rohan@example.com` | `rohan123` | Seeded account |
| Super Admin | Accessible from dashboard | — | View all accounts & balances |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signup` | Register new account (`name`, `email`, `password`) |
| `POST` | `/api/login` | Email & password login |
| `POST` | `/api/auth/google` | Google profile authentication |
| `GET` | `/api/cashbooks?userId=&email=` | Fetch cashbooks for user / collaborator |
| `POST` | `/api/cashbooks` | Create a new cashbook |
| `GET` | `/api/cashbooks/:id` | Get cashbook details, entries, and balance |
| `POST` | `/api/cashbooks/:id/transactions` | Add Cash In / Cash Out entry |
| `POST` | `/api/otp/request` | Dispatch 6-digit OTP to collaborator email |
| `POST` | `/api/cashbooks/:id/collaborators` | Verify OTP and add collaborator |
| `GET` | `/api/superadmin/all` | Retrieve master aggregate sheet |

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
