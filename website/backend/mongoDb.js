const { MongoClient } = require("mongodb");

async function connectDatabase(env = process.env) {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(env.MONGODB_DB || "cashbook");
  await db.collection("state").updateOne({ _id: "cashbook" }, {
    $setOnInsert: { users: [], cashbooks: [], collaborators: [], version: 0 },
  }, { upsert: true });
  await db.collection("invitations").createIndex({ cashbookId: 1, email: 1 }, { unique: true });
  await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("mailLimits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return { client, db };
}

function stateStore(db) {
  return {
    readDB: () => db.collection("state").findOne({ _id: "cashbook" }),
    async writeDB(state) {
      const { _id, version, ...data } = state;
      const result = await db.collection("state").updateOne(
        { _id: "cashbook", version }, { $set: data, $inc: { version: 1 } },
      );
      if (!result.matchedCount) {
        const error = new Error("Another update completed. Please retry.");
        error.status = 409;
        throw error;
      }
    },
  };
}

module.exports = { connectDatabase, stateStore };
