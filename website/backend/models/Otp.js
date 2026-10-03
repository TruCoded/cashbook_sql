const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes expiry
  }
);

module.exports = mongoose.model("Otp", otpSchema);
