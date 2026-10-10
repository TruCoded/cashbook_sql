import "server-only";
import dns from "dns";
import mongoose, { Schema, model, models, type Model } from "mongoose";
import { mongoEnv } from "@/lib/env";

// One cached connection per serverless instance.
const g = globalThis as unknown as { _cashbookMongo?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } };
const cache = (g._cashbookMongo ??= { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const { uri, dbName } = mongoEnv();
  if (!uri) throw new Error("Missing environment variable: MONGODB_URI");
  // Local dev only: some routers/ISPs/VPNs refuse the DNS SRV lookup that mongodb+srv:// needs
  // ("querySrv ECONNREFUSED"). Using public DNS for this process avoids that. Not applied on Vercel.
  if (process.env.NODE_ENV !== "production" && uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      /* keep system DNS */
    }
  }
  cache.promise ??= mongoose.connect(uri, { dbName, bufferCommands: false, serverSelectionTimeoutMS: 8000 });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

// ---- users: same "users" collection and fields your Cashbook accounts already use ----
export interface UserDoc {
  id: string;
  name: string;
  businessName?: string;
  email: string;
  picture?: string | null;
  passwordHash?: string | null;
}
const userSchema = new Schema<UserDoc>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    businessName: { type: String, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    picture: { type: String, default: null },
    passwordHash: { type: String, default: null, select: false }, // never returned unless explicitly selected
  },
  { strict: false, timestamps: true, collection: "users" }
);
export const User: Model<UserDoc> = (models.User as Model<UserDoc>) ?? model<UserDoc>("User", userSchema);

// ---- new collections (prefixed so they never clash with older Cashbook data) ----
export interface CashbookDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string | null;
  category: string | null;
  ownerId: string;
  currency: string;
  initialBalanceMinor: number;
  createdAt: Date;
  updatedAt: Date;
}
const cashbookSchema = new Schema<CashbookDoc>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    category: { type: String, default: null },
    ownerId: { type: String, required: true, index: true },
    currency: { type: String, default: "INR" },
    initialBalanceMinor: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "cb_books" }
);
export const CashbookModel: Model<CashbookDoc> =
  (models.CashbookBook as Model<CashbookDoc>) ?? model<CashbookDoc>("CashbookBook", cashbookSchema);

export interface PartnerDoc {
  _id: mongoose.Types.ObjectId;
  cashbookId: string;
  userId: string;
  email: string;
  permission: "VIEW" | "EDIT";
  createdAt: Date;
}
const partnerSchema = new Schema<PartnerDoc>(
  {
    cashbookId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    permission: { type: String, enum: ["VIEW", "EDIT"], default: "EDIT" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "cb_partners" }
);
partnerSchema.index({ cashbookId: 1, userId: 1 }, { unique: true });
export const PartnerModel: Model<PartnerDoc> =
  (models.CashbookPartner as Model<PartnerDoc>) ?? model<PartnerDoc>("CashbookPartner", partnerSchema);

export interface TransactionDoc {
  _id: mongoose.Types.ObjectId;
  cashbookId: string;
  type: "CASH_IN" | "CASH_OUT";
  amountMinor: number;
  description: string | null;
  person: string | null;
  category: string | null;
  notes: string | null;
  occurredAt: Date;
  createdBy: string;
  clientRequestId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
const transactionSchema = new Schema<TransactionDoc>(
  {
    cashbookId: { type: String, required: true, index: true },
    type: { type: String, enum: ["CASH_IN", "CASH_OUT"], required: true },
    amountMinor: { type: Number, required: true },
    description: { type: String, default: null },
    person: { type: String, default: null },
    category: { type: String, default: null },
    notes: { type: String, default: null },
    occurredAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    clientRequestId: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "cb_transactions" }
);
transactionSchema.index({ cashbookId: 1, occurredAt: -1 });
export const TransactionModel: Model<TransactionDoc> =
  (models.CashbookTransaction as Model<TransactionDoc>) ?? model<TransactionDoc>("CashbookTransaction", transactionSchema);

export interface ActivityDoc {
  _id: mongoose.Types.ObjectId;
  userId: string | null;
  cashbookId: string | null;
  action: string;
  description: string;
  createdAt: Date;
}
const activitySchema = new Schema<ActivityDoc>(
  {
    userId: { type: String, default: null, index: true },
    cashbookId: { type: String, default: null, index: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "cb_activity" }
);
export const ActivityModel: Model<ActivityDoc> =
  (models.CashbookActivity as Model<ActivityDoc>) ?? model<ActivityDoc>("CashbookActivity", activitySchema);

// Fixed-window rate limit entries; Mongo removes them itself after 1 hour.
const rateSchema = new Schema(
  { key: { type: String, required: true, index: true }, createdAt: { type: Date, default: Date.now, expires: 3600 } },
  { collection: "cb_ratelimits" }
);
export const RateLimitModel = models.CashbookRate ?? model("CashbookRate", rateSchema);
