# My Cashbook — Expo (React Native) Mobile App

A full-featured mobile companion app for the Cashbook system, built with **React Native** and **Expo SDK 57**. It runs on both Android and iOS from a single codebase and can be built into a standalone `.apk` using Expo EAS.

---

## ✨ Features & Design

- **Typography & Aesthetics**: Styled to match the web app with Google Fonts (**Playfair Display** for serif headings/italics and **Poppins** for modern clean UI).
- **Authentication**:
  - One-Tap **Google Sign-In** widget (with user avatar and Google badge).
  - Standard **Email/Password** authentication (e.g. `trusha@example.com` / `trusha123`).
  - Account registration via **Sign Up**.
- **Cashbook Management**:
  - View cashbooks list with live balances.
  - Cash in, cash out, notes, and transaction calculations.
  - Create new cashbooks starting from ₹0.
- **Collaborator Sharing & Real OTP Delivery**:
  - Add collaborators by email.
  - Generates a 6-digit OTP delivered directly to collaborator's inbox via **Gmail SMTP** (`nodemailer`).
  - Verify OTP and link collaborator bank details (Account number & IFSC).
- **Super Admin View**: Aggregated overview of all cashbooks, balances, and collaborators across all users.

---

## 🚀 Quick Start Guide

### 1. Start the Backend Server

Open your first terminal:

```powershell
cd "C:\Users\DELL\Downloads\cashbook-app\cashbook-app\backend"
npm start
```

> **Note on Gmail OTP**: Ensure `backend/.env` is configured with your Gmail App Password:
> ```env
> GMAIL_USER=trushaa15@gmail.com
> GMAIL_APP_PASSWORD=vdzjddemxlswrlvn
> ```
> When running, the terminal will confirm:  
> `Gmail Mailer: ACTIVE (trushaa15@gmail.com)`

---

### 2. Configure Backend API URL

Open [src/api.js](file:///c:/Users/DELL/Downloads/cashbook-app-mobile/mobile/src/api.js) and verify your machine's Wi-Fi IPv4 address:

```javascript
export const API = "http://10.82.166.208:5000/api";
```

*(Ensure your phone and computer are connected to the same Wi-Fi network)*.

---

### 3. Start the Mobile App (Expo)

Open your second terminal:

```powershell
cd "C:\Users\DELL\Downloads\cashbook-app-mobile\mobile"
npx expo start -c
```

- **Open on Android / iOS**: Open **Expo Go** on your phone and scan the QR code displayed in the terminal.
- **Fast Reload**: Press `r` in the Expo terminal to reload code changes instantly.

---

## 📦 Building a Standalone Android APK (EAS Build)

To produce an installable `.apk` file that runs independently on your phone without Expo Go:

```powershell
cd "C:\Users\DELL\Downloads\cashbook-app-mobile\mobile"

# 1. Log in with your Expo account
npx eas login
# Username: warnallabs

# 2. Link your EAS project (one-time)
npx eas init

# 3. Build the preview APK on Expo cloud servers
npx eas build --platform android --profile preview
```

When the cloud build finishes, EAS will provide a direct download link for the `.apk` to install on your Android device.

---

## 📁 Project Structure

```text
mobile/
├── App.js                   # Root navigator & Google Fonts loader
├── app.json                 # Expo configuration & deep linking scheme
├── package.json             # Dependencies (@expo-google-fonts, expo-font, etc.)
└── src/
    ├── api.js               # Backend API endpoint configuration
    ├── theme.js             # Color palette & font definitions (Playfair & Poppins)
    ├── context/
    │   └── AuthContext.js   # User session state & AsyncStorage persistence
    └── screens/
        ├── LoginScreen.js          # Google One-Tap & Email login
        ├── SignupScreen.js         # User registration
        ├── CashbooksScreen.js      # List of cashbooks & quick balance
        ├── AddCashbookScreen.js    # Create a new cashbook
        ├── CashbookDetailScreen.js # Transactions, balances & OTP collaborator invite
        └── SuperAdminScreen.js     # Super admin merged cashbook sheet
```

