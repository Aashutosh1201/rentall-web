const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/KYC", express.static(path.join(__dirname, "KYC")));

// Import routes
console.log("Importing routes...");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const kycRoutes = require("./routes/kyc");
const categoryRoutes = require("./routes/categoryRoutes");

// Register routes
console.log("Registering routes...");
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/categories", categoryRoutes);

// MongoDB connection
console.log("Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("MongoDB URI:", process.env.MONGO_URI);
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

// Root route
app.get("/", (req, res) => {
  res.send("🚀 RentALL API is working!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("- GET /api/categories");
  console.log("- POST /api/categories");
  console.log("- GET /api/products");
  console.log("- POST /api/products");
  console.log("- GET /api/auth");
  console.log("- POST /api/auth");
});
