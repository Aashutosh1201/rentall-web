const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  testEmail,
} = require("../controllers/authController");

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
