const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  category: String,
  pricePerDay: { type: Number, required: true },
  location: String,
  availableDates: [String], // we can enhance later
  imageUrl: String, // for now just URL
}, {
  timestamps: true
});

module.exports = mongoose.model("Product", productSchema);
