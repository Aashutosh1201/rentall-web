const mongoose = require("mongoose");

const hubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: String,
    contactPhone: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hub", hubSchema);
