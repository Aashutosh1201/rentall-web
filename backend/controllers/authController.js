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
  debug: true, // Enable debug logging
  logger: true, // Enable logger
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
    console.log("Using email configuration:", {
      host: "smtp.gmail.com",
      port: 465,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASS,
    });
  }
});

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server Error" });
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, fullName: user.fullName }, // add fullName here
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Attempting to send password reset email to:", email);
    console.log("Using email configuration:", {
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASS,
    });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    console.log("Generated reset URL:", resetUrl);

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.fullName},</p>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
      `,
    };

    console.log("Attempting to send email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    res.status(200).json({
      message: "Password reset email sent successfully",
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Failed to send reset password email",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
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
    console.log("Testing email configuration...");
    const mailOptions = {
      from: `"RentALL" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "RentALL - Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">RentALL Test Email</h2>
          <p>This is a test email to verify the email configuration for RentALL.</p>
          <p>If you're receiving this email, it means the email service is working correctly.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from RentALL. Please do not reply to this email.</p>
        </div>
      `,
      headers: {
        "X-Mailer": "RentALL",
        "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      },
    };

    console.log("Sending test email with options:", mailOptions);
    const info = await transporter.sendMail(mailOptions);
    console.log("Test email sent successfully:", info);

    res.status(200).json({
      message: "Test email sent successfully",
      info: info,
    });
  } catch (error) {
    console.error("Test Email Error:", error);
    res.status(500).json({
      message: "Failed to send test email",
      error: error.message,
    });
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
