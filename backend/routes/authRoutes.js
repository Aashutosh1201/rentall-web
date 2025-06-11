const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const passport = require("../config/passport");
const User = require("../models/User"); // Add this line - import the User model
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  testEmail,
} = require("../controllers/authController");

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Send token to frontend through postMessage
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

router.post("/complete-profile", verifyToken, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone === "not provided") {
      return res
        .status(400)
        .json({ message: "Valid phone number is required" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.phone === "not provided") {
      user.phone = phone;
      await user.save();
    }

    res.json({ message: "Profile updated", phone: user.phone });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
