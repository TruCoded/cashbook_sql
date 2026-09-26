# Cashbook mobile app

This Expo / React Native app shares the MongoDB and Gmail SMTP backend with the website. Complete the backend setup in `../README.md` first.

## Run

1. Run `npm install` in `app`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your backend's public HTTPS API URL, ending in `/api`.
3. For local testing on a phone, use `http://YOUR_COMPUTER_LAN_IP:5000/api` and connect the phone and computer to the same Wi-Fi. `localhost` on the phone refers to the phone.
4. Run `npx expo start`. Set the same environment variable for production builds and rebuild when changing it.

Never put Gmail passwords, MongoDB credentials, or the OTP secret in an Expo public environment variable.

## Sign-in and invitations

Create an account and sign in with email and password. Passwords require at least eight characters. Existing sessions must sign out and sign in again after the backend update. The old hardcoded demo Google sign-in has been removed.

Open a cashbook you own and use **Send invitation & OTP**. The backend sends both the invitation and code to the entered collaborator email through Gmail SMTP. The collaborator supplies the code to the owner for the existing owner-managed verification form. Errors are shown instead of demo codes. Changing the recipient clears the old invitation and code.

The code expires in ten minutes and can be used once. You can request another after sixty seconds. Only five verification attempts are allowed per code.

The input supports native `one-time-code` autofill hints and manual entry/paste. Actual email-code suggestions depend on the phone, mail app, keyboard, and settings. The app cannot detect whether a specific Gmail account is on the phone or force email OTP suggestions. It never retrieves OTPs through the API.

## Deployment

Gmail SMTP needs outbound port 465 access. Render Free blocks SMTP; use an SMTP-capable host or a suitable paid plan. Set backend credentials only on that backend. See `../README.md` for environment variables, MongoDB migration, testing, and hosting details.
