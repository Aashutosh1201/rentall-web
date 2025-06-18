const mongoose = require("mongoose");

const counterOfferSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    message: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CounterOffer", counterOfferSchema);
