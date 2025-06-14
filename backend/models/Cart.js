const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
      rentalDays: { type: Number, default: 1 },
      startDate: { type: Date },
      endDate: { type: Date },
    },
  ],
});

module.exports = mongoose.model("Cart", cartSchema);
