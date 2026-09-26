const path = require("path");
// Shared MongoDB + Gmail SMTP backend for the website and mobile app.

require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");
const { OAuth2Client } = require("google-auth-library");
const { connectDatabase, stateStore } = require("./mongoDb");
const { invitationService, createMailer, normalizeEmail, validEmail } = require("./invitations");

function createApp(db, mailer = createMailer()) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));
  // Express 4 does not automatically forward rejected async route handlers.
  for (const method of ["get", "post"]) {
    const register = app[method].bind(app);
    app[method] = (route, handler) => handler === undefined ? register(route) : register(route, (req, res, next) =>
      Promise.resolve().then(() => handler(req, res, next)).catch(next));
  }

  const { readDB, writeDB } = stateStore(db);
  const invitations = invitationService({ db, mailer });
  const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");
  async function sessionFor(user) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.collection("sessions").insertOne({ _id: tokenHash(token), userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000) });
    return { id: user.id, email: user.email, name: user.name, picture: user.picture, token };
  }
  async function requireOwner(req, cashbookId) {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    const session = token && await db.collection("sessions").findOne({ _id: tokenHash(token), expiresAt: { $gt: new Date() } });
    if (!session) throw Object.assign(new Error("Please sign in again to send or verify invitations."), { status: 401 });
    const state = await readDB();
    const cashbook = state.cashbooks.find((item) => item.id === cashbookId);
    if (!cashbook) throw Object.assign(new Error("Cashbook not found"), { status: 404 });
    if (cashbook.ownerId !== session.userId) throw Object.assign(new Error("Only the cashbook owner can manage invitations."), { status: 403 });
    return cashbook;
  }
  app.get("/api/health", async (req, res) => {
    await db.command({ ping: 1 });
    res.json({ ok: true });
  });
  const balanceOf = (cb) =>
    cb.transactions.reduce((sum, t) => sum + (t.type === "in" ? t.amount : -t.amount), 0);

  // ---- GOOGLE OAUTH LOGIN / SIGNUP ----
  app.post("/api/auth/google", async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: "Google sign-in is not configured" });
    let identity;
    try {
      const ticket = await new OAuth2Client().verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
      identity = ticket.getPayload();
      if (!identity.email_verified) throw new Error("Unverified email");
    } catch {
      return res.status(401).json({ error: "Google sign-in could not be verified" });
    }
    const { name, picture, sub: googleId } = identity;
    const email = normalizeEmail(identity.email);
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
    res.json(await sessionFor(user));
  });

  // ---- SIGNUP ----
  app.post("/api/signup", async (req, res) => {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!validEmail(email) || typeof password !== "string" || password.length < 8) return res.status(400).json({ error: "Valid email and a password of at least 8 characters required" });
    const db = await readDB();
    if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "User already exists with this email" });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const user = { id: "u" + crypto.randomUUID(), name: name || email.split("@")[0], email, salt, passwordHash };
    db.users.push(user);
    await writeDB(db);
    res.json(await sessionFor(user));
  });

  // ---- LOGIN ----
  app.post("/api/login", async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const db = await readDB();
    const user = db.users.find((u) => normalizeEmail(u.email) === email);
    if (!user || typeof password !== "string" || !user.passwordHash || !crypto.timingSafeEqual(
      Buffer.from(user.passwordHash, "hex"), crypto.scryptSync(password, user.salt, 64),
    )) return res.status(401).json({ error: "Invalid email or password" });
    res.json(await sessionFor(user));
  });

  // ---- CASHBOOK LIST (owned + collaborator access) ----
  app.get("/api/cashbooks", async (req, res) => {
    const { userId, email } = req.query;
    const state = await readDB();
    const active = await db.collection("invitations").find({ email: normalizeEmail(email), status: "active" }).toArray();
    const collabIds = state.collaborators
      .filter((c) => normalizeEmail(c.collaboratorEmail) === normalizeEmail(email))
      .map((c) => c.cashbookId);
    collabIds.push(...active.map((item) => item.cashbookId));
    const list = state.cashbooks
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

  // Gmail must accept the recipient before either client reports success.
  app.post("/api/otp/request", async (req, res) => {
    const cashbook = await requireOwner(req, req.body.cashbookId);
    res.json(await invitations.request({ email: req.body.email, cashbook, senderId: cashbook.ownerId }));
  });

  // ---- OTP: VERIFY + ADD COLLABORATOR (person1 adds person2 to their cashbook) ----
  app.post("/api/cashbooks/:id/collaborators", async (req, res) => {
    await requireOwner(req, req.params.id);
    res.json(await invitations.verify({ ...req.body, cashbookId: req.params.id }));
  });

  // ---- SUPER ADMIN: everyone's cashbooks + collaborators, one merged view ----
  app.get("/api/superadmin/all", async (req, res) => {
    const state = await readDB();
    const active = await db.collection("invitations").find({ status: "active" }).toArray();
    const rows = state.cashbooks.map((cb) => ({
      cashbookName: cb.name,
      owner: state.users.find((u) => u.id === cb.ownerId)?.name || "Unknown",
      balance: balanceOf(cb),
      collaborators: [...new Set([
        ...state.collaborators.filter((c) => c.cashbookId === cb.id).map((c) => c.collaboratorEmail),
        ...active.filter((c) => c.cashbookId === cb.id).map((c) => c.email),
      ])],
    }));
    res.json(rows);
  });

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.status ? err.message : "The server could not complete this request. Please retry." });
  });
  return app;
}

if (require.main === module) {
  connectDatabase().then(({ db }) => {
    createApp(db).listen(process.env.PORT || 5000, () => console.log("Cashbook backend ready (MongoDB + Gmail SMTP)"));
  }).catch(() => {
    console.error("Backend startup failed. Check MONGODB_URI and database connectivity.");
    process.exitCode = 1;
  });
}
module.exports = { createApp };
