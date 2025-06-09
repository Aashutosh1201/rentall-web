const express = require("express");
const router = express.Router();
const {
  sendEmailVerification,
  verifyEmailOTP,
  sendSMSVerification,
  verifyPhone,
  getVerificationStatus,
} = require("../controllers/verificationController");

// Email verification routes
router.post("/send-email-verification", sendEmailVerification);
router.post("/verify-email-otp", verifyEmailOTP);

// SMS verification routes
router.post("/send-sms-verification", sendSMSVerification);
router.post("/verify-phone", verifyPhone);
router.post("/test-otp", async (req, res) => {
  console.log("🧪 TEST OTP ROUTE CALLED");

  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();

  console.log("\n" + "=".repeat(60));
  console.log("🧪 TEST OTP GENERATION");
  console.log("=".repeat(60));
  console.log("🔑 Generated OTP:", testOTP);
  console.log("📱 Test Phone:", req.body.phone || "No phone provided");
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log("=".repeat(60) + "\n");

  res.json({
    success: true,
    message: "Test OTP generated - check console",
    otp: testOTP,
    phone: req.body.phone,
    timestamp: new Date().toISOString(),
  });
});
// Get verification status
router.get("/status/:email", getVerificationStatus);

module.exports = router;
