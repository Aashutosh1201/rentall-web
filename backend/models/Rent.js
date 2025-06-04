const mongoose = require("mongoose");
const rentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending_payment", "confirmed", "active", "completed", "cancelled"],
    default: "pending_payment",
  },
  paymentId: String,
  transactionId: String,
  paymentMethod: String,
});
