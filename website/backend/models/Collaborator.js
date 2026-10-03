const mongoose = require("mongoose");

const collaboratorSchema = new mongoose.Schema(
  {
    cashbookId: { type: String, required: true, index: true },
    collaboratorEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    accountNumber: { type: String, default: "" },
    ifsc: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Collaborator", collaboratorSchema);
