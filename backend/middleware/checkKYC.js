const User = require("../models/User");

module.exports = async function checkKYC(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        code: "USER_NOT_FOUND",
      });
    }

    if (user.kycStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Please complete KYC verification.",
        code: "KYC_REQUIRED",
      });
    }

    next();
  } catch (err) {
    console.error("checkKYC middleware error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during KYC check.",
      error: err.message,
    });
  }
};
