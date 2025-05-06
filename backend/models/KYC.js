const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dob: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  idType: { type: String, required: true },
  idNumber: { type: String, required: true },
  idDocumentPath: { type: String, required: true },
  selfiePath: { type: String, required: true },
  status: { type: String, default: "pending" },
});

module.exports = mongoose.model("KYC", kycSchema);
