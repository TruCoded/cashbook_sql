# 💼 My Cashbook — Full-Stack Financial Ledger & Mobile System

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2057-000000?logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Gmail SMTP](https://img.shields.io/badge/Gmail-Nodemailer%20OTP-EA4335?logo=gmail&logoColor=white)](https://nodemailer.com/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Database%20Engine-34A853?logo=googlesheets&logoColor=white)](https://developers.google.com/apps-script)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A complete, dual-client financial ledger system organized into **two main directories**:

- 📱 **`app/`**: Cross-platform Mobile App (**Android & iOS**) built with React Native & Expo SDK 57.
- 🌐 **`website/`**: Complete Web Application (**Frontend & Backend API**) with Google Sheets DB & Gmail OTP delivery.

---

## 🏗️ Clean 2-Folder Project Structure

```text
cashbook_sql/
├── app/                  # 📱 Mobile Application (Android & iOS)
│   ├── App.js            # Root navigator & Google Fonts loader
│   ├── app.json          # Expo configuration & deep linking
│   ├── eas.json          # EAS cloud build configuration (APK)
│   ├── package.json      # Dependencies (Expo, Navigation, etc.)
│   └── src/
│       ├── api.js        # API endpoint URL configuration
│       ├── theme.js      # Typography (Playfair & Poppins) & color palette
│       ├── context/      # Session state & AsyncStorage
│       └── screens/      # All mobile screens
│
└── website/              # 🌐 Website & Backend System
    ├── backend/          # Shared Express REST API & Database
    │   ├── server.js     # Express server & Gmail nodemailer OTP logic
    │   ├── sheetsDb.js   # Google Sheets database client
    │   └── data/db.json  # Local development database fallback
    ├── frontend/         # Web Application
    │   ├── shared.css    # Typography, color tokens & CSS styles
    │   ├── login.html    # Web login & Google One-Tap
    │   ├── signup.html   # Web user registration
    │   ├── cashbooks.html # Cashbooks dashboard
    │   ├── add-cashbook.html # New ledger modal
    │   ├── cashbook-detail.html # Entries & OTP collaborator flow
    │   └── superadmin.html # Super Admin master ledger
    ├── Code.gs.txt       # Google Apps Script Web App source
    ├── index.html        # Web entrypoint
    ├── render.yaml       # Render cloud deployment config
    └── vercel.json       # Vercel deployment config
```

---

## 🚀 Quick Start Guide

### 1. Start the Website & Backend Server

```bash
cd website/backend
npm install

# (Optional) Add your Gmail App Password to website/backend/.env:
# GMAIL_USER=your_email@gmail.com
# GMAIL_APP_PASSWORD=your_16_digit_app_password

npm start
```
- Backend API runs on: **`http://localhost:5000`**

---

### 2. View the Web App in Browser

```bash
cd website/frontend
npx serve . -l 5500
```
- Open **`http://localhost:5500/login.html`** in your browser.

---

### 3. Run the Mobile App (Android & iOS)

```bash
cd app
npx expo start -c
```
- Open **Expo Go** on your Android or iPhone and scan the QR code displayed in the terminal.

---

## 📦 Building Standalone Android APK

To generate an installable `.apk` for your phone:

```bash
cd app

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
| User 1 | `trusha@example.com` | `trusha123` | Seeded sample cashbooks |
| User 2 | `rohan@example.com` | `rohan123` | Seeded account |
| Super Admin | Dashboard Link | — | Master administrative view |

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
