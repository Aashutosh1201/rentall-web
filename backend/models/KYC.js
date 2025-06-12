const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // ✅ Prevent duplicate KYCs
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, required: true },
    dob: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    idType: { type: String, required: true },
    idNumber: { type: String, required: true },
    idDocumentPath: { type: String, required: true },
    selfiePath: { type: String, required: true },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
); // Optional: adds createdAt / updatedAt

module.exports = mongoose.model("KYC", kycSchema);
