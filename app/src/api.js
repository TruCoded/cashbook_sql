// Both clients use the same backend. Override for local device testing in app/.env.
// EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:5000/api
// Expo embeds this public URL at build time; never put SMTP/MongoDB secrets here.
export const API = (process.env.EXPO_PUBLIC_API_URL || "https://cashbook-sql.vercel.app/api").replace(/\/$/, "");
