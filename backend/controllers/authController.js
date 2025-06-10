const bcrypt = require("bcryptjs");
const User = require("../models/User");
const TempUser = require("../models/TempUser"); // Add this import
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    console.log("=== REGISTRATION DEBUG ===");
    console.log("1. Registration attempt for:", email);

    // Validate required fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if user already exists in main User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if user already exists in TempUser collection
    const existingTempUser = await TempUser.findOne({ email });
    if (existingTempUser) {
      // Remove existing temp user to allow re-registration
      await TempUser.deleteOne({ email });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTPs for both email and phone
    const emailVerificationOTP = generateOTP();
    const phoneVerificationOTP = generateOTP();
    const otpExpires = Date.now() + 600000; // 10 minutes

    console.log("2. Generated OTPs:");
    console.log("   - Email OTP:", emailVerificationOTP);
    console.log("   - Phone OTP:", phoneVerificationOTP);

    // Create temporary user
    const newTempUser = new TempUser({
      fullName,
      email,
      phone,
      password: hashedPassword,
      emailVerificationOTP,
      emailVerificationOTPExpires: otpExpires,
      phoneVerificationOTP,
      phoneVerificationExpires: otpExpires,
    });

    console.log("3. Saving to TempUser collection...");
    const savedTempUser = await newTempUser.save();
    console.log("4. ✅ TempUser saved with ID:", savedTempUser._id);

    // Send verification email with OTP
    const mailOptions = {
      from: `"RentALL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email Address - RentALL",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">RentALL</h1>
            <h2 style="color: #374151; margin-top: 10px;">Welcome to RentALL!</h2>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0;">
              Hello ${fullName},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              Your email verification code is:
            </p>
            
            <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 20px 0;">${emailVerificationOTP}</h1>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              This code expires in 10 minutes for security reasons.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0;">
              Next step: You'll also need to verify your phone number to complete your account setup.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("5. ✅ Verification email sent successfully");
    } catch (emailError) {
      console.error("5. ❌ Failed to send verification email:", emailError);
      // Don't fail registration if email fails, but log it
    }

    console.log("=== END REGISTRATION DEBUG ===");

    res.status(201).json({
      message:
        "Registration initiated. Please verify your email and phone to complete account creation.",
      user: {
        email: email,
        phone: phone,
        fullName: fullName,
      },
      nextStep: "verification",
      // In development, include OTPs for testing
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          emailOTP: emailVerificationOTP,
          phoneOTP: phoneVerificationOTP,
        },
      }),
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `${field === "email" ? "Email" : "Phone number"} already exists`,
      });
    }

    res.status(500).json({
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Only check in main User collection (verified users)
    const user = await User.findOne({ email });
    if (!user) {
      // Check if user exists in TempUser (unverified)
      const tempUser = await TempUser.findOne({ email });
      if (tempUser) {
        return res.status(403).json({
          message: "Please complete email and phone verification first.",
          needsVerification: true,
        });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, fullName: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Keep existing functions (forgotPassword, resetPassword, testEmail, protectedRoute)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"RentALL" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request - RentALL",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello ${user.fullName},</p>
          <p>You have requested to reset your password. Click the link below to proceed:</p>
          <p><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      message: "Failed to send reset password email",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const testEmail = async (req, res) => {
  try {
    const mailOptions = {
      from: `"RentALL Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email - RentALL",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Email Test Successful!</h2>
          <p>This is a test email from RentALL application.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res
      .status(500)
      .json({ message: "Failed to send test email", error: error.message });
  }
};

const protectedRoute = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("fullName email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `Hello, ${user.fullName}! This is a protected route.`,
      user,
    });
  } catch (error) {
    console.error("Protected Route Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  protectedRoute,
  forgotPassword,
  resetPassword,
  testEmail,
};
