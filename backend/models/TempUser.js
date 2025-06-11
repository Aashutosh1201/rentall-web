const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    // Email verification
    emailVerificationOTP: {
      type: String,
    },
    emailVerificationOTPExpires: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // Phone verification
    phoneVerificationOTP: {
      type: String,
    },
    phoneVerificationExpires: {
      type: Date,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    // Auto-cleanup after 24 hours if not verified
    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds
    },
  },
  { timestamps: true }
);

// Compound index to ensure email+phone uniqueness
tempUserSchema.index({ email: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("TempUser", tempUserSchema);
