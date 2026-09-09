const path = require("path");
// server.js - Cashbook backend.
// Database: Google Sheets if GOOGLE_SHEET_ID + GOOGLE_SERVICE_ACCOUNT_KEY_PATH
// are set in backend/.env (see sheetsDb.js), otherwise falls back automatically
// to the local data/db.json file - so the app runs with zero setup, and
// upgrades to real Sheets once credentials are added.

require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const nodemailer = require("nodemailer");
const sheetsDb = require("./sheetsDb");

const DB_PATH = path.join(__dirname, "data", "db.json");
const app = express();
app.use(cors());
app.use(express.json());

const usingSheets = sheetsDb.isConfigured();
console.log(usingSheets ? "Database: Google Sheets" : "Database: local data/db.json (fallback)");

// ---- database helpers: same readDB()/writeDB() names either way ----
const readDB = () =>
  usingSheets ? sheetsDb.readDB() : Promise.resolve(JSON.parse(fs.readFileSync(DB_PATH, "utf-8")));
const writeDB = (db) =>
  usingSheets ? sheetsDb.writeDB(db) : Promise.resolve(fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)));
const balanceOf = (cb) =>
  cb.transactions.reduce((sum, t) => sum + (t.type === "in" ? t.amount : -t.amount), 0);

// Gmail transporter - only usable once GMAIL_USER / GMAIL_APP_PASSWORD are
// set in backend/.env. Without them, mailer stays null and OTPs fall back
// to console logging, so the app still runs.
// Gmail initialization
const mailer =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      })
    : null;
console.log(mailer ? `Gmail Mailer: ACTIVE (${process.env.GMAIL_USER})` : "Gmail Mailer: INACTIVE (check .env)");


// ---- GOOGLE OAUTH LOGIN / SIGNUP ----
app.post("/api/auth/google", async (req, res) => {
  const { email, name, picture, googleId } = req.body;
  const db = await readDB();
  let user = db.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) {
    user = {
      id: "u" + Date.now(),
      name: name || (email ? email.split("@")[0] : "Google User"),
      email: email,
      picture: picture || null,
      googleId: googleId || null,
    };
    db.users.push(user);
    await writeDB(db);
  }
  res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
});

// ---- SIGNUP ----
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const db = await readDB();
  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "User already exists with this email" });
  }
  const user = { id: "u" + Date.now(), name: name || email.split("@")[0], email, password };
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

// ---- OTP: REQUEST (emails the code via Gmail if configured, otherwise
// falls back to just logging it to the console so the flow is still testable) ----
app.post("/api/otp/request", async (req, res) => {
  const { email } = req.body;
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
  const db = await readDB();
  db.otps = db.otps.filter((o) => o.email !== email); // drop any old code for this email
  db.otps.push({ email, code });
  await writeDB(db);

  if (mailer) {
    try {
      await mailer.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Your Cashbook collaborator OTP",
        text: `Your OTP is ${code}. It is required to add you as a collaborator on a cashbook.`,
      });
      return res.json({ sent: true }); // real email sent, code not exposed
    } catch (err) {
      console.error("Gmail send failed, falling back to console:", err.message);
    }
  }

  console.log(`OTP for ${email}: ${code}`); // fallback: Gmail not configured / send failed
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

app.listen(5000, () => console.log("Cashbook backend running on http://localhost:5000"));
