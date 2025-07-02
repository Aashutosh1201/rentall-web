const mongoose = require("mongoose");

// Define the sub-schema for a counter offer
const counterOfferSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  price: { type: Number, required: true },
  message: { type: String },
  image: { type: String },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const requestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String }, // Cloudinary image URL
    needDates: [{ type: String, required: true }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    counterOffers: {
      type: [counterOfferSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
