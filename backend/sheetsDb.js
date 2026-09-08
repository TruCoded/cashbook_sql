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
  if (!APPS_SCRIPT_URL) {
    throw new Error("APPS_SCRIPT_URL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      // text/plain avoids Apps Script's CORS preflight issue with JSON content-type
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action, ...extra }),
      signal: controller.signal,
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (jsonErr) {
      console.error(`Apps Script response for action '${action}' was not valid JSON:`, text.slice(0, 200));
      throw new Error(`Google Apps Script returned non-JSON response: ${text.slice(0, 100)}`);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.error(`Apps Script request for action '${action}' timed out after 20s`);
      throw new Error("Google Apps Script request timed out");
    }
    console.error(`Apps Script request error (${action}):`, err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const readDB = () => call("readDB");
const writeDB = (db) => call("writeDB", { db });
const sendOtp = (email, code) => call("sendOtp", { email, code });

module.exports = { isConfigured, readDB, writeDB, sendOtp };

