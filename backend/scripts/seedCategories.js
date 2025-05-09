const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Category = require("../models/Category");

// Load environment variables
dotenv.config();

const categories = [
  {
    label: "Vehicles",
    icon: "Bike",
    description: "Cars, bikes, and other vehicles for rent",
  },
  {
    label: "Cameras",
    icon: "Camera",
    description: "Professional and amateur cameras",
  },
  {
    label: "Gadgets",
    icon: "MonitorSmartphone",
    description: "Electronics and smart devices",
  },
  {
    label: "Tools",
    icon: "Drill",
    description: "Construction and DIY tools",
  },
  {
    label: "Clothing",
    icon: "Shirt",
    description: "Fashion and apparel",
  },
  {
    label: "Furniture",
    icon: "Sofa",
    description: "Home and office furniture",
  },
  {
    label: "Camping",
    icon: "Tent",
    description: "Camping and outdoor equipment",
  },
  {
    label: "Others",
    icon: "Wrench",
    description: "Miscellaneous items",
  },
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing categories
    await Category.deleteMany({});
    console.log("✅ Cleared existing categories");

    // Insert new categories
    await Category.insertMany(categories);
    console.log("✅ Seeded categories successfully");

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories();
