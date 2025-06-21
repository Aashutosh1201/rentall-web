module.exports = function checkKYC(req, res, next) {
  if (req.user.kycStatus !== "verified") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Please complete KYC verification.",
      code: "KYC_REQUIRED",
    });
  }
  next();
};
