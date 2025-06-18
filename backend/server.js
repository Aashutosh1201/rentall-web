const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
const passport = require("./config/passport");
const session = require("express-session");
const path = require("path");
const adminRoutes = require("./routes/adminRoutes");
const app = express();
const requestRoutes = require("./routes/requestRoutes");
// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
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

app.use("/api/products", require("./routes/products"));

// Initialize Passport
app.use(passport.initialize());

app.use("/api/admin", adminRoutes);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/KYC", express.static(path.join(__dirname, "KYC")));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/payment");
const kycRoutes = require("./routes/kyc");
const categoryRoutes = require("./routes/categoryRoutes");
const rentalRoutes = require("./routes/rental");
const verificationRoutes = require("./routes/verificationRoutes"); // Add this
const userRoutes = require("./routes/users"); // Add this

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/verification", verificationRoutes); // Add this
app.use("/api/users", userRoutes); // Add this
<<<<<<< Updated upstream

=======
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/requests", requestRoutes);
>>>>>>> Stashed changes
// Root route
app.get("/", (req, res) => {
  res.send("🚀 RentALL API is working!");
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
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
});
