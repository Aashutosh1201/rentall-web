const bcrypt = require("bcryptjs");
const User = require("../models/User");
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = Date.now() + 3600000; // 1 hour

    console.log("2. Generated verification data:");
    console.log("   - Token:", emailVerificationToken);
    console.log("   - Token length:", emailVerificationToken.length);
    console.log("   - Expires at:", new Date(emailVerificationExpires));

    // Create user
    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires,
    });

    console.log("3. Saving user to database...");
    const savedUser = await newUser.save();
    console.log("4. ✅ User saved with ID:", savedUser._id);

    // Double-check the saved data
    console.log("5. Verifying saved token data:");
    console.log("   - Saved token:", savedUser.emailVerificationToken);
    console.log("   - Saved expiry:", savedUser.emailVerificationExpires);
    console.log(
      "   - Token match:",
      savedUser.emailVerificationToken === emailVerificationToken
    );

    // Wait a moment to ensure database write is complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Triple-check by querying the database
    const verifyUser = await User.findById(savedUser._id);
    console.log("6. Database verification:");
    console.log("   - Found user:", !!verifyUser);
    console.log("   - DB token:", verifyUser?.emailVerificationToken);
    console.log("   - DB expiry:", verifyUser?.emailVerificationExpires);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email/${emailVerificationToken}`;
    console.log("7. Verification URL:", verificationUrl);

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
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0;">
              Hello ${fullName},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              Thank you for registering with RentALL! To complete your account setup, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              This link will expire in 1 hour for security reasons.
            </p>
            ${
              process.env.NODE_ENV === "development"
                ? `
            <p style="color: #6b7280; font-size: 12px;">
              Debug info: Token ${emailVerificationToken.substring(0, 8)}...
            </p>
            `
                : ""
            }
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
      console.log("8. ✅ Verification email sent successfully");
    } catch (emailError) {
      console.error("8. ❌ Failed to send verification email:", emailError);
      // Don't fail registration if email fails, but log it
    }

    console.log("=== END REGISTRATION DEBUG ===");

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification.",
      user: {
        id: savedUser._id,
        email: email,
        phone: phone,
        fullName: fullName,
      },
      nextStep: "email_verification",
      verificationUrl:
        process.env.NODE_ENV === "development" ? verificationUrl : undefined,
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

// test Email
const testEmail = async (req, res) => {
  try {
    const mailOptions = {
      from: `"RentALL Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
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

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is active (both email and phone verified)
    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Account not activated. Please verify your email and phone number.",
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        userEmail: user.email,
        userPhone: user.phone,
      });
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
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Keep existing functions
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

module.exports = {
  registerUser,
  loginUser,
  protectedRoute,
  forgotPassword,
  resetPassword,
  testEmail,
};
