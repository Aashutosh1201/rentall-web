const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
const passport = require("./config/passport");
const session = require("express-session");
const path = require("path");

const app = express();

// 🐛 DEBUG: Add request logging FIRST
app.use((req, res, next) => {
  console.log(`🐛 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === "POST" && req.url.includes("complete-profile")) {
    console.log("🐛 POST /complete-profile - Headers:", req.headers);
    console.log("🐛 POST /complete-profile - Body will be:", req.body);
  }
  next();
});

// Middleware - ORDER MATTERS!
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" })); // Increase limit for image uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/KYC", express.static(path.join(__dirname, "KYC")));

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/payment");
const kycRoutes = require("./routes/kyc");
const categoryRoutes = require("./routes/categoryRoutes");
const rentalRoutes = require("./routes/rental");
const verificationRoutes = require("./routes/verificationRoutes");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");

// 🐛 DEBUG: Add middleware to log auth route specifically
app.use("/api/auth", (req, res, next) => {
  console.log(`🐛 AUTH ROUTE: ${req.method} /api/auth${req.url}`);
  if (req.method === "POST" && req.url === "/complete-profile") {
    console.log("🐛 Complete Profile Request Body:", req.body);
    console.log(
      "🐛 Complete Profile Authorization:",
      req.headers.authorization
    );
  }
  next();
});

// Register routes - FIXED ORDER
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes); // Only register once!
app.use("/api/cart", cartRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("🚀 RentALL API is working!");
});

// 🐛 DEBUG: Catch-all route to see what's not being handled
app.use("*", (req, res) => {
  console.log(`🐛 UNHANDLED ROUTE: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🐛 Debug mode enabled - check console for request logs`);
});
