const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const passport = require("../config/passport");
const User = require("../models/User");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  testEmail,
  completeVerification,
} = require("../controllers/authController");

// 🐛 DEBUG: Log all requests to auth routes
router.use((req, res, next) => {
  console.log(`🐛 AUTH ROUTER: ${req.method} ${req.url}`);
  console.log(`🐛 AUTH ROUTER: Headers:`, req.headers);
  console.log(`🐛 AUTH ROUTER: Body:`, req.body);
  next();
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.post("/verify", completeVerification);

// 🐛 DEBUG: Test route to verify auth is working
router.get("/test", verifyToken, (req, res) => {
  console.log("🐛 TEST ROUTE: User from token:", req.user);
  res.json({ message: "Auth is working", user: req.user });
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    console.log("🐛 GET /profile - User ID:", req.user.userId);

    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🐛 Sending user profile:", user);

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("🐛 Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ SINGLE complete-profile route
router.post("/complete-profile", verifyToken, async (req, res) => {
  console.log("🐛 COMPLETE-PROFILE: Starting...");
  console.log("🐛 COMPLETE-PROFILE: req.user:", req.user);
  console.log("🐛 COMPLETE-PROFILE: req.body:", req.body);

  try {
    const { fullName, phone, address, profilePhoto } = req.body;

    // Validation
    if (!phone || phone === "not provided") {
      console.log("🐛 COMPLETE-PROFILE: Phone validation failed");
      return res
        .status(400)
        .json({ message: "Valid phone number is required" });
    }

    console.log(
      "🐛 COMPLETE-PROFILE: Looking for user with ID:",
      req.user.userId
    );
    const user = await User.findById(req.user.userId);

    if (!user) {
      console.log("🐛 COMPLETE-PROFILE: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🐛 COMPLETE-PROFILE: Found user:", user.email);
    console.log("🐛 COMPLETE-PROFILE: Current user data:", {
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      profilePhoto: user.profilePhoto,
    });

    // Update user fields
    if (fullName) {
      console.log(
        "🐛 COMPLETE-PROFILE: Updating fullName from",
        user.fullName,
        "to",
        fullName
      );
      user.fullName = fullName;
    }
    if (phone) {
      console.log(
        "🐛 COMPLETE-PROFILE: Updating phone from",
        user.phone,
        "to",
        phone
      );
      user.phone = phone;
    }
    if (address !== undefined) {
      console.log(
        "🐛 COMPLETE-PROFILE: Updating address from",
        user.address,
        "to",
        address
      );
      user.address = address;
    }
    if (profilePhoto) {
      console.log("🐛 COMPLETE-PROFILE: Updating profilePhoto");
      user.profilePhoto = profilePhoto;
    }

    console.log("🐛 COMPLETE-PROFILE: Saving user...");
    await user.save();
    console.log("🐛 COMPLETE-PROFILE: User saved successfully");

    // Return updated user without password
    const updatedUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      profilePhoto: user.profilePhoto,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
    };

    console.log("🐛 COMPLETE-PROFILE: Returning updated user:", updatedUser);
    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("🐛 COMPLETE-PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Profile photo update route
router.post("/update-profile-photo", verifyToken, async (req, res) => {
  console.log("🐛 UPDATE-PROFILE-PHOTO: Starting...");

  try {
    const { profilePhoto } = req.body;

    if (!profilePhoto) {
      return res.status(400).json({ message: "Profile photo URL is required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only the profile photo
    user.profilePhoto = profilePhoto;
    await user.save();

    console.log("🐛 Profile photo updated successfully");

    res.json({
      message: "Profile photo updated successfully",
      profilePhoto: user.profilePhoto,
    });
  } catch (err) {
    console.error("🐛 UPDATE-PROFILE-PHOTO ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const html = `
      <script>
        window.opener.postMessage({ token: "${req.user.token}" }, "http://localhost:3000");
      </script>
    `;
    res.send(html);
  }
);

// Regular auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/test-email", testEmail);
router.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: `Hello, ${req.user.fullName}! This is a protected route.`,
  });
});

module.exports = router;
