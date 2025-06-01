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
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      if (!req.user || !req.user.token) {
        console.log("No user or token in request");
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
            "Authentication failed"
          )}`
        );
      }

      console.log("Google authentication successful");
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${req.user.token}`);
    } catch (err) {
      console.log("Error in Google callback:", err);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
          "An error occurred during authentication"
        )}`
      );
    }
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
