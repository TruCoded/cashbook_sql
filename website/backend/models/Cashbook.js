const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["in", "out"], required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cashbookSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    partnerName: { type: String, default: "" },
    partnerEmail: { type: String, default: "" },
    transactions: { type: [transactionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cashbook", cashbookSchema);
