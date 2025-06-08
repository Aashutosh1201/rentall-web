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

// Get verification status
router.get("/status/:email", getVerificationStatus);

module.exports = router;
