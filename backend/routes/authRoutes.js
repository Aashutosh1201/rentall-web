const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();
const passport = require("../config/passport");
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

module.exports = router;
