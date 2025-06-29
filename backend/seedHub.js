// backend/seedHub.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Hub = require("./models/Hub");

dotenv.config(); // load .env for DB_URI

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const existing = await Hub.findOne({ name: "Maitidevi Hub" });
    if (existing) {
      console.log("Hub already exists.");
      return;
    }

    const hub = new Hub({
      name: "Maitidevi Hub",
      address: "Maitidevi, Kathmandu",
      contactPhone: "9800000000", // placeholder, change if needed
      city: "Kathmandu",
      coordinates: {
        lat: 27.707, // Optional: rough Maitidevi coordinates
        lng: 85.328,
      },
    });

    await hub.save();
    console.log("✅ Hub created:", hub);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating hub:", err);
    process.exit(1);
  }
};

run();
