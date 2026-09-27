# 💼 My Cashbook — Full-Stack Financial Ledger & Mobile System

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2057-000000?logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%26%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gmail SMTP](https://img.shields.io/badge/Gmail-Nodemailer%20OTP-EA4335?logo=gmail&logoColor=white)](https://nodemailer.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A complete, dual-client financial ledger system organized into **two main directories**:

- 📱 **`app/`**: Cross-platform Mobile App (**Android & iOS**) built with React Native & Expo SDK 57.
- 🌐 **`website/`**: Complete Web Application (**Frontend & Backend API**) with MongoDB Atlas (Mongoose), demo OTP sign-in, and Gmail SMTP for collaborator email.

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
    │   ├── server.js     # Express server & API endpoints
    │   ├── db.js         # MongoDB connection & migration logic
    │   ├── models/       # Mongoose schemas (User, Cashbook, Collaborator, Otp)
    │   └── data/db.json  # Local development database fallback
    ├── frontend/         # Web Application
    │   ├── shared.css    # Typography, color tokens & CSS styles
    │   ├── login.html    # Web login & Google One-Tap
    │   ├── signup.html   # Web user registration
    │   ├── cashbooks.html # Cashbooks dashboard
    │   ├── add-cashbook.html # New ledger modal
    │   ├── cashbook-detail.html # Entries & OTP collaborator flow
    │   └── superadmin.html # Super Admin master ledger
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

# Add your MongoDB Atlas connection string in website/backend/.env:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
# MONGODB_DB_NAME=cashbook

npm start
```
- Backend API runs on: **`http://localhost:5000`**
- *Note:* On first startup with MongoDB connected, existing data from `data/db.json` is automatically migrated to your MongoDB cluster!

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
