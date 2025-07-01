const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const productSchema = new mongoose.Schema(
  {
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
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["free", "pending", "booked"],
      default: "free",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
