const path = require("path");
// server.js - Cashbook backend powered by MongoDB (Mongoose)

require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const { connectDB, User, Cashbook, Collaborator, Otp } = require("./db");

const DB_PATH = path.join(__dirname, "data", "db.json");
const app = express();
app.use(cors());
app.use(express.json());

// Initialize MongoDB Connection
let isMongoConnected = false;
connectDB().then((connected) => {
  isMongoConnected = connected;
});

// Helper for local db.json fallback (used only if MongoDB is not configured or offline)
const readLocalDB = () =>
  fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) : { users: [], cashbooks: [], collaborators: [], otps: [] };
const writeLocalDB = (db) =>
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

const balanceOf = (cb) =>
  (cb.transactions || []).reduce((sum, t) => sum + (t.type === "in" ? Number(t.amount) : -Number(t.amount)), 0);

// Gmail transporter (for OTP emails)
const mailer =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      })
    : null;
console.log(mailer ? `Gmail Mailer: ACTIVE (${process.env.GMAIL_USER})` : "Gmail Mailer: INACTIVE (OTPs will be logged in console)");

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "mongodb" : "fallback_json";
  res.json({ status: "ok", database: dbStatus });
});

// ---- GOOGLE OAUTH LOGIN / SIGNUP ----
app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, picture, googleId } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.create({
          id: "u" + Date.now(),
          name: name || email.split("@")[0] || "Google User",
          email: email.toLowerCase(),
          picture: picture || null,
          googleId: googleId || null,
        });
      } else if (picture && !user.picture) {
        user.picture = picture;
        await user.save();
      }
      return res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
    }

    // Fallback
    const db = readLocalDB();
    let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: "u" + Date.now(),
        name: name || email.split("@")[0] || "Google User",
        email: email,
        picture: picture || null,
        googleId: googleId || null,
      };
      db.users.push(user);
      writeLocalDB(db);
    }
    res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
  } catch (err) {
    console.error("Google Auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// ---- SIGNUP ----
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      const user = await User.create({
        id: "u" + Date.now(),
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        password,
      });
      return res.json({ id: user.id, name: user.name, email: user.email });
    }

    // Fallback
    const db = readLocalDB();
    if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "User already exists with this email" });
    }
    const user = { id: "u" + Date.now(), name: name || email.split("@")[0], email, password };
    db.users.push(user);
    writeLocalDB(db);
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ---- LOGIN ----
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: email.toLowerCase(), password });
      if (!user) return res.status(401).json({ error: "Invalid email or password" });
      return res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
    }

    // Fallback
    const db = readLocalDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    res.json({ id: user.id, name: user.name, email: user.email, picture: user.picture });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ---- CASHBOOK LIST (owned + collaborator access) ----
app.get("/api/cashbooks", async (req, res) => {
  try {
    const { userId, email } = req.query;

    if (mongoose.connection.readyState === 1) {
      const collabs = email
        ? await Collaborator.find({ collaboratorEmail: email.toLowerCase() })
        : [];
      const collabIds = collabs.map((c) => c.cashbookId);

      const queryConditions = [];
      if (userId) queryConditions.push({ ownerId: userId });
      if (collabIds.length > 0) queryConditions.push({ id: { $in: collabIds } });

      const cashbooks = queryConditions.length > 0
        ? await Cashbook.find({ $or: queryConditions })
        : [];

      const list = cashbooks.map((cb) => ({
        id: cb.id,
        name: cb.name,
        balance: balanceOf(cb),
      }));
      return res.json(list);
    }

    // Fallback
    const db = readLocalDB();
    const collabIds = (db.collaborators || [])
      .filter((c) => (c.collaboratorEmail || "").toLowerCase() === (email || "").toLowerCase())
      .map((c) => c.cashbookId);
    const list = (db.cashbooks || [])
      .filter((cb) => cb.ownerId === userId || collabIds.includes(cb.id))
      .map((cb) => ({ id: cb.id, name: cb.name, balance: balanceOf(cb) }));
    res.json(list);
  } catch (err) {
    console.error("Get cashbooks error:", err);
    res.status(500).json({ error: "Failed to load cashbooks" });
  }
});

// ---- CREATE NEW CASHBOOK ----
app.post("/api/cashbooks", async (req, res) => {
  try {
    const { name, partnerName, partnerEmail, ownerId } = req.body;
    if (!name) return res.status(400).json({ error: "Cashbook name is required" });

    const newId = "cb" + Date.now();

    if (mongoose.connection.readyState === 1) {
      const cb = await Cashbook.create({
        id: newId,
        name,
        ownerId,
        partnerName: partnerName || "",
        partnerEmail: partnerEmail || "",
        transactions: [],
      });
      return res.json({
        id: cb.id,
        name: cb.name,
        ownerId: cb.ownerId,
        partnerName: cb.partnerName,
        partnerEmail: cb.partnerEmail,
        transactions: cb.transactions,
      });
    }

    // Fallback
    const db = readLocalDB();
    const cb = { id: newId, name, ownerId, partnerName, partnerEmail, transactions: [] };
    db.cashbooks.push(cb);
    writeLocalDB(db);
    res.json(cb);
  } catch (err) {
    console.error("Create cashbook error:", err);
    res.status(500).json({ error: "Failed to create cashbook" });
  }
});

// ---- SINGLE CASHBOOK DETAIL (cash in / cash out / balance) ----
app.get("/api/cashbooks/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cb = await Cashbook.findOne({ id: req.params.id }).lean();
      if (!cb) return res.status(404).json({ error: "Cashbook not found" });

      const txns = cb.transactions || [];
      const cashIn = txns.filter((t) => t.type === "in").reduce((s, t) => s + Number(t.amount), 0);
      const cashOut = txns.filter((t) => t.type === "out").reduce((s, t) => s + Number(t.amount), 0);

      return res.json({
        ...cb,
        cashIn,
        cashOut,
        balance: cashIn - cashOut,
      });
    }

    // Fallback
    const db = readLocalDB();
    const cb = (db.cashbooks || []).find((c) => c.id === req.params.id);
    if (!cb) return res.status(404).json({ error: "Cashbook not found" });

    const txns = cb.transactions || [];
    const cashIn = txns.filter((t) => t.type === "in").reduce((s, t) => s + Number(t.amount), 0);
    const cashOut = txns.filter((t) => t.type === "out").reduce((s, t) => s + Number(t.amount), 0);

    res.json({ ...cb, cashIn, cashOut, balance: cashIn - cashOut });
  } catch (err) {
    console.error("Cashbook detail error:", err);
    res.status(500).json({ error: "Failed to load cashbook" });
  }
});

// ---- ADD A TRANSACTION (cash in / cash out) ----
app.post("/api/cashbooks/:id/transactions", async (req, res) => {
  try {
    const { type, amount, note } = req.body;
    if (!type || amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: "Valid type and amount required" });
    }

    if (mongoose.connection.readyState === 1) {
      const cb = await Cashbook.findOne({ id: req.params.id });
      if (!cb) return res.status(404).json({ error: "Cashbook not found" });

      cb.transactions.push({
        type,
        amount: Number(amount),
        note: note || "",
        date: new Date(),
      });
      await cb.save();

      return res.json({ balance: balanceOf(cb) });
    }

    // Fallback
    const db = readLocalDB();
    const cb = (db.cashbooks || []).find((c) => c.id === req.params.id);
    if (!cb) return res.status(404).json({ error: "Cashbook not found" });

    cb.transactions.push({ type, amount: Number(amount), note: note || "" });
    writeLocalDB(db);
    res.json({ balance: balanceOf(cb) });
  } catch (err) {
    console.error("Add transaction error:", err);
    res.status(500).json({ error: "Failed to add transaction" });
  }
});

// ---- OTP: REQUEST (emails via Gmail if configured, or logs in console) ----
app.post("/api/otp/request", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      await Otp.deleteMany({ email: normalizedEmail });
      await Otp.create({ email: normalizedEmail, code });
    } else {
      const db = readLocalDB();
      db.otps = (db.otps || []).filter((o) => (o.email || "").toLowerCase() !== normalizedEmail);
      db.otps.push({ email: normalizedEmail, code });
      writeLocalDB(db);
    }

    if (mailer) {
      try {
        await mailer.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: "Your Cashbook collaborator OTP",
          text: `Your OTP is ${code}. It is required to add you as a collaborator on a cashbook.`,
        });
        return res.json({ sent: true });
      } catch (err) {
        console.error("Gmail send failed, falling back to console:", err.message);
      }
    }

    console.log(`[OTP] Generated OTP for ${email}: ${code}`);
    res.json({ sent: true, demoCode: code });
  } catch (err) {
    console.error("OTP request error:", err);
    res.status(500).json({ error: "Failed to request OTP" });
  }
});

// ---- OTP: VERIFY + ADD COLLABORATOR ----
app.post("/api/cashbooks/:id/collaborators", async (req, res) => {
  try {
    const { collaboratorEmail, otp, accountNumber, ifsc } = req.body;
    if (!collaboratorEmail || !otp) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const normalizedEmail = collaboratorEmail.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const match = await Otp.findOne({ email: normalizedEmail, code: String(otp).trim() });
      if (!match) return res.status(400).json({ error: "Incorrect or expired OTP" });

      await Collaborator.create({
        cashbookId: req.params.id,
        collaboratorEmail: normalizedEmail,
        accountNumber: accountNumber || "",
        ifsc: ifsc || "",
      });

      await Otp.deleteMany({ email: normalizedEmail });
      return res.json({ added: true });
    }

    // Fallback
    const db = readLocalDB();
    const match = (db.otps || []).find(
      (o) => (o.email || "").toLowerCase() === normalizedEmail && o.code === String(otp).trim()
    );
    if (!match) return res.status(400).json({ error: "Incorrect or expired OTP" });

    db.collaborators.push({
      cashbookId: req.params.id,
      collaboratorEmail: normalizedEmail,
      accountNumber: accountNumber || "",
      ifsc: ifsc || "",
    });
    db.otps = db.otps.filter((o) => (o.email || "").toLowerCase() !== normalizedEmail);
    writeLocalDB(db);
    res.json({ added: true });
  } catch (err) {
    console.error("Add collaborator error:", err);
    res.status(500).json({ error: "Failed to add collaborator" });
  }
});

// ---- SUPER ADMIN: merged view of all cashbooks, owners, collaborators ----
app.get("/api/superadmin/all", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const [cashbooks, users, collaborators] = await Promise.all([
        Cashbook.find().lean(),
        User.find().lean(),
        Collaborator.find().lean(),
      ]);

      const userMap = new Map(users.map((u) => [u.id, u.name]));
      const collabMap = new Map();
      collaborators.forEach((c) => {
        if (!collabMap.has(c.cashbookId)) collabMap.set(c.cashbookId, []);
        collabMap.get(c.cashbookId).push(c.collaboratorEmail);
      });

      const rows = cashbooks.map((cb) => ({
        cashbookName: cb.name,
        owner: userMap.get(cb.ownerId) || "Unknown",
        balance: balanceOf(cb),
        collaborators: collabMap.get(cb.id) || [],
      }));

      return res.json(rows);
    }

    // Fallback
    const db = readLocalDB();
    const rows = (db.cashbooks || []).map((cb) => ({
      cashbookName: cb.name,
      owner: (db.users || []).find((u) => u.id === cb.ownerId)?.name || "Unknown",
      balance: balanceOf(cb),
      collaborators: (db.collaborators || [])
        .filter((c) => c.cashbookId === cb.id)
        .map((c) => c.collaboratorEmail),
    }));
    res.json(rows);
  } catch (err) {
    console.error("Superadmin error:", err);
    res.status(500).json({ error: "Failed to fetch superadmin records" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Cashbook backend running on http://localhost:${PORT}`);
});
