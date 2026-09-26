// Explicit, one-time import into an empty MongoDB database. Does not send mail.
require("dotenv").config({ path: require("node:path").join(__dirname, ".env") });
const fs = require("node:fs");
const crypto = require("node:crypto");
const { connectDatabase } = require("./mongoDb");
const { normalizeEmail, validEmail } = require("./invitations");

async function main() {
  if (!process.argv[2]) throw new Error("Usage: node import-json.js path/to/export.json");
  const source = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  for (const key of ["users", "cashbooks", "collaborators"]) {
    if (!Array.isArray(source[key])) throw new Error(`Export must contain a ${key} array`);
  }
  const emails = new Set();
  const users = source.users.map((original) => {
    const { password, ...user } = original;
    user.email = normalizeEmail(user.email);
    if (!validEmail(user.email) || emails.has(user.email)) throw new Error("Resolve invalid or duplicate user emails before importing");
    emails.add(user.email);
    if (typeof password === "string" && password) {
      user.salt = crypto.randomBytes(16).toString("hex");
      user.passwordHash = crypto.scryptSync(password, user.salt, 64).toString("hex");
    }
    return user;
  });
  const { client, db } = await connectDatabase();
  try {
    const result = await db.collection("state").updateOne({ _id: "cashbook", version: 0,
      users: { $size: 0 }, cashbooks: { $size: 0 }, collaborators: { $size: 0 } }, {
      $set: { users, cashbooks: source.cashbooks, collaborators: source.collaborators.map((item) => ({
        ...item, collaboratorEmail: normalizeEmail(item.collaboratorEmail),
      })) }, $inc: { version: 1 },
    });
    if (!result.modifiedCount) throw new Error("Import refused: destination database is not empty");
    console.log("Imported users, cashbooks, and existing collaborators. Old OTPs were discarded.");
  } finally { await client.close(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
