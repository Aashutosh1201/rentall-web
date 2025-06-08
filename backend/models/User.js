const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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
    googleId: {
      type: String,
      sparse: true,
    },
    // Email verification fields
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // Old token-based fields (keep for backward compatibility)
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    // New OTP-based fields
    emailVerificationOTP: {
      type: String,
    },
    emailVerificationOTPExpires: {
      type: Date,
    },
    // Phone verification fields
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationOTP: {
      type: String,
    },
    phoneVerificationExpires: {
      type: Date,
    },
    // Reset password fields
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: false, // User is active only when both email and phone are verified
    },
  },
  { timestamps: true }
);

// Index for cleanup of expired tokens and OTPs
userSchema.index({ emailVerificationExpires: 1 }, { expireAfterSeconds: 0 });
userSchema.index({ emailVerificationOTPExpires: 1 }, { expireAfterSeconds: 0 });
userSchema.index({ phoneVerificationExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("User", userSchema);
