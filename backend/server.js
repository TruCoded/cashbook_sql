// server.js - My Cashbook backend.
// Database + OTP email both go through one Google Apps Script Web App
// (see sheetsDb.js), if APPS_SCRIPT_URL is set in backend/.env - otherwise
// this falls back automatically to the local data/db.json file and console
// logging, so the app still runs with zero setup.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { OAuth2Client } = require("google-auth-library"); // verifies Google Sign-In tokens
const sheetsDb = require("./sheetsDb");

const DB_PATH = path.join(__dirname, "data", "db.json");
const app = express();
app.use(cors());
app.use(express.json());

const usingAppsScript = sheetsDb.isConfigured();
console.log(usingAppsScript ? "Database: Google Sheets (via Apps Script)" : "Database: local data/db.json (fallback)");

// ---- Google Sign-In (Gmail OAuth) setup ----
// Set GOOGLE_CLIENT_ID in backend/.env (same value as in frontend/login.js and
// frontend/signup.js) to turn this on. See README -> "Enabling Gmail Sign-In".
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
console.log(googleClient ? "Google Sign-In: enabled" : "Google Sign-In: disabled (set GOOGLE_CLIENT_ID in .env to enable)");

// ---- database helpers: same readDB()/writeDB() names either way ----
const readDB = () =>
  usingAppsScript ? sheetsDb.readDB() : Promise.resolve(JSON.parse(fs.readFileSync(DB_PATH, "utf-8")));
const writeDB = (db) =>
  usingAppsScript ? sheetsDb.writeDB(db) : Promise.resolve(fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)));
const balanceOf = (cb) =>
  cb.transactions.reduce((sum, t) => sum + (t.type === "in" ? t.amount : -t.amount), 0);

// ---- SIGN UP ----
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
  const db = await readDB();
  if (db.users.some((u) => u.email === email)) return res.status(409).json({ error: "Email already registered" });
  const user = { id: "u" + Date.now(), name, email, password };
  db.users.push(user);
  await writeDB(db);
  res.json({ id: user.id, name: user.name, email: user.email });
});

// ---- LOGIN ----
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await readDB();
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  res.json({ id: user.id, name: user.name, email: user.email });
});

// ---- GOOGLE SIGN-IN (login OR signup in one step, using a real Gmail account) ----
// The frontend gets a signed "credential" (ID token) straight from Google after
// the person picks their Gmail account - we never see their Google password.
// We just verify that token really came from Google, then log them in. If it's
// the first time we've seen that email, we create the account automatically -
// this is how "any Gmail email works, not only ones already in db.json" happens.
app.post("/api/auth/google", async (req, res) => {
  if (!googleClient) return res.status(500).json({ error: "Google Sign-In is not set up on the server yet" });
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload(); // { email, name, ... }, only present if the token is genuine
  } catch (err) {
    return res.status(401).json({ error: "Could not verify Google sign-in" });
  }
  const db = await readDB();
  let user = db.users.find((u) => u.email === payload.email);
  if (!user) {
    // first time this Gmail address has been seen - auto-create the account, no password needed
    user = { id: "u" + Date.now(), name: payload.name || payload.email.split("@")[0], email: payload.email, password: "GOOGLE_OAUTH" };
    db.users.push(user);
    await writeDB(db);
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});

// ---- CASHBOOK LIST (owned + collaborator access) ----
app.get("/api/cashbooks", async (req, res) => {
  const { userId, email } = req.query;
  const db = await readDB();
  const collabIds = db.collaborators
    .filter((c) => c.collaboratorEmail === email)
    .map((c) => c.cashbookId);
  const list = db.cashbooks
    .filter((cb) => cb.ownerId === userId || collabIds.includes(cb.id))
    .map((cb) => ({ id: cb.id, name: cb.name, balance: balanceOf(cb) }));
  res.json(list);
});

// ---- CREATE NEW CASHBOOK ("create a new sheet") ----
app.post("/api/cashbooks", async (req, res) => {
  const { name, partnerName, partnerEmail, ownerId } = req.body;
  const db = await readDB();
  const cb = { id: "cb" + Date.now(), name, ownerId, partnerName, partnerEmail, transactions: [] };
  db.cashbooks.push(cb);
  await writeDB(db);
  res.json(cb);
});

// ---- SINGLE CASHBOOK DETAIL (cash in / cash out / balance) ----
app.get("/api/cashbooks/:id", async (req, res) => {
  const db = await readDB();
  const cb = db.cashbooks.find((c) => c.id === req.params.id);
  if (!cb) return res.status(404).json({ error: "Cashbook not found" });
  const cashIn = cb.transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const cashOut = cb.transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
  res.json({ ...cb, cashIn, cashOut, balance: cashIn - cashOut });
});

// ---- ADD A TRANSACTION (cash in / cash out) ----
app.post("/api/cashbooks/:id/transactions", async (req, res) => {
  const { type, amount, note } = req.body;
  const db = await readDB();
  const cb = db.cashbooks.find((c) => c.id === req.params.id);
  if (!cb) return res.status(404).json({ error: "Cashbook not found" });
  cb.transactions.push({ type, amount: Number(amount), note: note || "" });
  await writeDB(db);
  res.json({ balance: balanceOf(cb) });
});

// ---- OTP: REQUEST (sent via Apps Script/Gmail if configured, otherwise
// falls back to just logging it to the console so the flow is still testable) ----
app.post("/api/otp/request", async (req, res) => {
  const { email } = req.body;
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
  const db = await readDB();
  db.otps = db.otps.filter((o) => o.email !== email); // drop any old code for this email
  db.otps.push({ email, code });
  await writeDB(db);

  if (usingAppsScript) {
    try {
      await sheetsDb.sendOtp(email, code);
      return res.json({ sent: true }); // real email sent, code not exposed
    } catch (err) {
      console.error("Apps Script email send failed, falling back to console:", err.message);
    }
  }

  console.log(`OTP for ${email}: ${code}`); // fallback: Apps Script not configured / send failed
  res.json({ sent: true, demoCode: code }); // demoCode exposed only in fallback/demo mode
});

// ---- OTP: VERIFY + ADD COLLABORATOR (person1 adds person2 to their cashbook) ----
app.post("/api/cashbooks/:id/collaborators", async (req, res) => {
  const { collaboratorEmail, otp, accountNumber, ifsc } = req.body;
  const db = await readDB();
  const match = db.otps.find((o) => o.email === collaboratorEmail && o.code === otp);
  if (!match) return res.status(400).json({ error: "Incorrect or expired OTP" });
  db.collaborators.push({ cashbookId: req.params.id, collaboratorEmail, accountNumber, ifsc });
  db.otps = db.otps.filter((o) => o.email !== collaboratorEmail); // OTP used, discard it
  await writeDB(db);
  res.json({ added: true });
});

// ---- SUPER ADMIN: everyone's cashbooks + collaborators, one merged view ----
app.get("/api/superadmin/all", async (req, res) => {
  const db = await readDB();
  const rows = db.cashbooks.map((cb) => ({
    cashbookName: cb.name,
    owner: db.users.find((u) => u.id === cb.ownerId)?.name || "Unknown",
    balance: balanceOf(cb),
    collaborators: db.collaborators.filter((c) => c.cashbookId === cb.id).map((c) => c.collaboratorEmail),
  }));
  res.json(rows);
});

app.listen(5000, () => console.log("My Cashbook backend running on http://localhost:5000"));
