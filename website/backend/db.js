const path = require("path");
const dns = require("dns");
if (process.platform === "win32") {
  try {
    // Use public DNS to ensure MongoDB Atlas SRV records resolve reliably on Windows
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    // Ignore if custom dns servers cannot be set
  }
}
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const fs = require("fs");
const User = require("./models/User");
const Cashbook = require("./models/Cashbook");
const Collaborator = require("./models/Collaborator");
const Otp = require("./models/Otp");

async function seedFromLocalJsonIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    const dbPath = path.join(__dirname, "data", "db.json");
    if (!fs.existsSync(dbPath)) return;

    const raw = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    console.log("Empty MongoDB detected. Initializing database with existing records from data/db.json...");

    if (Array.isArray(raw.users) && raw.users.length > 0) {
      await User.insertMany(raw.users);
      console.log(`✓ Migrated ${raw.users.length} users`);
    }

    if (Array.isArray(raw.cashbooks) && raw.cashbooks.length > 0) {
      await Cashbook.insertMany(raw.cashbooks);
      console.log(`✓ Migrated ${raw.cashbooks.length} cashbooks`);
    }

    if (Array.isArray(raw.collaborators) && raw.collaborators.length > 0) {
      await Collaborator.insertMany(raw.collaborators);
      console.log(`✓ Migrated ${raw.collaborators.length} collaborators`);
    }

    if (Array.isArray(raw.otps) && raw.otps.length > 0) {
      await Otp.insertMany(raw.otps);
      console.log(`✓ Migrated ${raw.otps.length} otps`);
    }

    console.log("✓ Initial MongoDB migration completed successfully!");
  } catch (err) {
    console.error("Warning: Automatic data seed from db.json encountered an error:", err.message);
  }
}

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("⚠️  MONGODB_URI is not set in backend/.env!");
    console.warn("Please add MONGODB_URI=mongodb+srv://<username>:<password>@cluster... to backend/.env");
    return false;
  }

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || "cashbook",
    });
    console.log("✅ Successfully connected to MongoDB Atlas!");
    await seedFromLocalJsonIfEmpty();
    return true;
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB Atlas:", err.message);
    return false;
  }
}

module.exports = {
  connectDB,
  User,
  Cashbook,
  Collaborator,
  Otp,
};
