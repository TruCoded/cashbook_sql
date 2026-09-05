// sheetsDb.js - talks to a Google Apps Script Web App instead of using
// service-account credentials. The script runs under your own Google
// account, so it can read/write your Sheet AND send Gmail with no
// password/key file needed at all.
//
// Set APPS_SCRIPT_URL in backend/.env to the "/exec" URL you get after
// deploying the Apps Script (see README.md for the full setup steps,
// including the Google Sheet layout the script expects).

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

const isConfigured = () => Boolean(APPS_SCRIPT_URL);

async function call(action, extra = {}) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    // text/plain avoids Apps Script's CORS preflight issue with JSON content-type
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json();
}

const readDB = () => call("readDB");
const writeDB = (db) => call("writeDB", { db });
const sendOtp = (email, code) => call("sendOtp", { email, code });

module.exports = { isConfigured, readDB, writeDB, sendOtp };
