const bcrypt = require("bcryptjs");
const User = require("../models/User");
const TempUser = require("../models/TempUser");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const validator = require("validator");

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

// Rate limiting for registration
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 registration attempts per windowMs
  message: {
    message: "Too many registration attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation patterns
const validationPatterns = {
  name: /^[a-zA-Z\s]{2,50}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^(98|97|96)\d{8}$/, // Nepal phone number format
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// Input sanitization function
const sanitizeInput = (input, type) => {
  if (typeof input !== "string") return "";

  switch (type) {
    case "name":
      return input
        .trim()
        .replace(/[^a-zA-Z\s]/g, "")
        .substring(0, 50);
    case "email":
      return input.trim().toLowerCase().substring(0, 254);
    case "phone":
      return input
        .trim()
        .replace(/[^0-9]/g, "")
        .substring(0, 10);
    case "general":
      return input.trim();
    default:
      return input.trim();
  }
};

// Server-side validation function
const validateRegistrationData = (data) => {
  const errors = {};
  const { fullName, email, phone, password } = data;

  // Validate full name
  if (!fullName || !fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (!validationPatterns.name.test(fullName.trim())) {
    errors.fullName =
      "Full name should only contain letters and spaces (2-50 characters)";
  }

  // Validate email
  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!validationPatterns.email.test(email.trim().toLowerCase())) {
    errors.email = "Please enter a valid email address";
  } else if (!validator.isEmail(email.trim())) {
    errors.email = "Email format is invalid";
  }

  // Validate phone
  if (!phone || !phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!validationPatterns.phone.test(phone.trim())) {
    errors.phone =
      "Please enter a valid Nepal phone number (98XXXXXXXX, 97XXXXXXXX, or 96XXXXXXXX)";
  }

  // Validate password
  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  } else if (!validationPatterns.password.test(password)) {
    errors.password =
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)";
  } else if (password.length > 128) {
    errors.password = "Password is too long (maximum 128 characters)";
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "password123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
    "hello",
    "freedom",
    "whatever",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.password =
      "This password is too common. Please choose a stronger password";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Password strength checker
const checkPasswordStrength = (password) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score++;
  else feedback.push("Use at least 8 characters");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Include lowercase letters");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Include uppercase letters");

  if (/\d/.test(password)) score++;
  else feedback.push("Include numbers");

  if (/[@$!%*?&]/.test(password)) score++;
  else feedback.push("Include special characters (@$!%*?&)");

  // Bonus points for length and complexity
  if (password.length >= 12) score++;
  if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score++; // Other special chars

  return {
    score,
    strength: score < 3 ? "weak" : score < 5 ? "medium" : "strong",
    feedback,
  };
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Function to copy image in Cloudinary
// Function to copy image in Cloudinary
const copyImageInCloudinary = async (originalUrl) => {
  try {
    if (!originalUrl) return null;

    const cloudinary = require("cloudinary").v2;

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Extract the public_id from the original URL to get a unique identifier
    const urlParts = originalUrl.split("/");
    const fileNameWithVersion = urlParts[urlParts.length - 1];
    const fileName = fileNameWithVersion.split(".")[0];

    // Create a unique public_id for the profile copy
    const uniqueId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Copy the image with a new public_id for profile use
    const result = await cloudinary.uploader.upload(originalUrl, {
      public_id: uniqueId,
      folder: "user_profiles",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" }, // Optimize for profile use
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    console.log("🐛 Image copied successfully:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Error copying image in Cloudinary:", error);
    return originalUrl; // Return original URL if copy fails
  }
};

const registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    console.log("=== REGISTRATION DEBUG ===");
    console.log("1. Registration attempt for:", email);

    // Sanitize inputs
    const sanitizedData = {
      fullName: sanitizeInput(fullName, "name"),
      email: sanitizeInput(email, "email"),
      phone: sanitizeInput(phone, "phone"),
      password: password, // Don't sanitize password as it might remove valid special chars
    };

    console.log("2. Sanitized data:", {
      ...sanitizedData,
      password: "[HIDDEN]",
    });

    // Validate input data
    const validation = validateRegistrationData(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    // Check password strength
    const passwordStrength = checkPasswordStrength(password);
    if (passwordStrength.strength === "weak") {
      return res.status(400).json({
        message: "Password is too weak",
        errors: {
          password:
            "Please choose a stronger password: " +
            passwordStrength.feedback.join(", "),
        },
      });
    }

    // Check if user already exists in main User collection
    const existingUser = await User.findOne({
      $or: [{ email: sanitizedData.email }, { phone: sanitizedData.phone }],
    });

    if (existingUser) {
      const field =
        existingUser.email === sanitizedData.email ? "email" : "phone";
      return res.status(400).json({
        message: `${field === "email" ? "Email" : "Phone number"} already exists`,
      });
    }

    // Check if user already exists in TempUser collection
    const existingTempUser = await TempUser.findOne({
      $or: [{ email: sanitizedData.email }, { phone: sanitizedData.phone }],
    });

    if (existingTempUser) {
      // Remove existing temp user to allow re-registration
      await TempUser.deleteOne({
        $or: [{ email: sanitizedData.email }, { phone: sanitizedData.phone }],
      });
    }

    // Hash password with increased salt rounds for security
    const saltRounds = process.env.NODE_ENV === "production" ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate OTPs for both email and phone
    const emailVerificationOTP = generateOTP();
    const phoneVerificationOTP = generateOTP();
    const otpExpires = Date.now() + 600000; // 10 minutes

    console.log("3. Generated OTPs:");
    console.log("   - Email OTP:", emailVerificationOTP);
    console.log("   - Phone OTP:", phoneVerificationOTP);

    // Create temporary user with additional security fields
    const newTempUser = new TempUser({
      fullName: sanitizedData.fullName,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      password: hashedPassword,
      emailVerificationOTP,
      emailVerificationOTPExpires: otpExpires,
      phoneVerificationOTP,
      phoneVerificationExpires: otpExpires,
      registrationIP: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent") || "Unknown",
      registrationAttempts: 1,
      lastRegistrationAttempt: new Date(),
    });

    console.log("4. Saving to TempUser collection...");
    const savedTempUser = await newTempUser.save();
    console.log("5. ✅ TempUser saved with ID:", savedTempUser._id);

    // Send verification email with enhanced security
    const mailOptions = {
      from: `"RentALL Security" <${process.env.EMAIL_USER}>`,
      to: sanitizedData.email,
      subject: "🔐 Verify Your Email Address - RentALL",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🛡️ RentALL</h1>
              <h2 style="color: #374151; margin-top: 10px; font-size: 24px;">Welcome aboard!</h2>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin-bottom: 25px; text-align: center; color: white;">
              <p style="margin: 0 0 10px 0; font-size: 16px;">
                Hello <strong>${sanitizedData.fullName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Your email verification code is:
              </p>
              
              <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h1 style="color: white; font-size: 36px; letter-spacing: 6px; margin: 0; font-weight: bold;">${emailVerificationOTP}</h1>
              </div>
              
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                ⏰ This code expires in <strong>10 minutes</strong> for security reasons.
              </p>
            </div>
            
            <div style="background-color: #fef3cd; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
                <strong>🔒 Security Notice:</strong> Never share this code with anyone. RentALL will never ask for your verification code via phone or email.
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Next step: You'll also need to verify your phone number <strong>${sanitizedData.phone}</strong> to complete your account setup.
              </p>
            </div>
            
            <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If you didn't request this verification, please ignore this email.<br>
                Registration IP: ${req.ip || "Unknown"} • Time: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("6. ✅ Verification email sent successfully");
    } catch (emailError) {
      console.error("6. ❌ Failed to send verification email:", emailError);
      // Don't fail registration if email fails, but log it
    }

    console.log("=== END REGISTRATION DEBUG ===");

    // Response with security considerations
    res.status(201).json({
      message:
        "Registration initiated successfully. Please verify your email and phone to complete account creation.",
      user: {
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        fullName: sanitizedData.fullName,
      },
      nextStep: "verification",
      security: {
        passwordStrength: passwordStrength.strength,
        verificationExpiry: "10 minutes",
      },
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

    // Handle rate limiting
    if (error.status === 429) {
      return res.status(429).json({
        message: "Too many registration attempts. Please try again later.",
      });
    }

    res.status(500).json({
      message: "Server Error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

const completeVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res.status(404).json({ message: "Temporary user not found" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if user has KYC data and copy profile image
    let profilePhotoUrl = null;
    try {
      const KYC = require("../models/KYC");
      const kycData = await KYC.findOne({ email });

      if (kycData && kycData.selfiePath) {
        console.log("🐛 Found KYC selfie, creating profile copy...");
        profilePhotoUrl = await copyImageInCloudinary(kycData.selfiePath);
        console.log("🐛 Profile photo URL:", profilePhotoUrl);
      }
    } catch (kycError) {
      console.error("Error processing KYC image:", kycError);
      // Continue without profile photo if KYC processing fails
    }

    const newUser = new User({
      fullName: tempUser.fullName,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      profilePhoto: profilePhotoUrl, // Set the copied image
      isActive: true,
      createdFromIP: tempUser.registrationIP,
      userAgent: tempUser.userAgent,
    });

    await newUser.save();
    await TempUser.deleteOne({ _id: tempUser._id });

    res.status(201).json({
      message: "User verified and activated successfully",
      profilePhotoSet: !!profilePhotoUrl,
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation and sanitization
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const sanitizedEmail = sanitizeInput(email, "email");

    // Validate email format
    if (
      !validationPatterns.email.test(sanitizedEmail) ||
      !validator.isEmail(sanitizedEmail)
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Only check in main User collection (verified users)
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      // Check if user exists in TempUser (unverified)
      const tempUser = await TempUser.findOne({ email: sanitizedEmail });
      if (tempUser) {
        return res.status(403).json({
          message: "Please complete email and phone verification first.",
          needsVerification: true,
        });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with constant-time comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginIP = req.ip || req.connection.remoteAddress;
    await user.save();

    // Generate JWT token with additional claims
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        iat: Math.floor(Date.now() / 1000),
        loginIP: req.ip,
      },
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
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Enhanced forgot password with additional security
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const sanitizedEmail = sanitizeInput(email, "email");

    if (
      !validationPatterns.email.test(sanitizedEmail) ||
      !validator.isEmail(sanitizedEmail)
    ) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    }

    // Check for rate limiting on password reset requests
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (
      user.resetPasswordRequestedAt &&
      user.resetPasswordRequestedAt > oneHourAgo
    ) {
      return res.status(429).json({
        message:
          "Password reset already requested. Please check your email or try again later.",
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = await bcrypt.hash(resetToken, 10); // Hash the token
    user.resetPasswordExpires = resetTokenExpiry;
    user.resetPasswordRequestedAt = new Date();
    user.resetPasswordIP = req.ip || req.connection.remoteAddress;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"RentALL Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔐 Password Reset Request - RentALL",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">🔐 RentALL</h1>
              <h2 style="color: #374151; margin-top: 10px;">Password Reset Request</h2>
            </div>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <p style="color: #991b1b; margin: 0; font-size: 16px;">
                <strong>⚠️ Security Alert:</strong> Someone requested a password reset for your account.
              </p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hello <strong>${user.fullName}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              You have requested to reset your password. Click the button below to proceed:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            
            <div style="background-color: #fef3cd; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>🔒 Security Notes:</strong><br>
                • This link will expire in <strong>1 hour</strong><br>
                • If you didn't request this reset, please ignore this email<br>
                • Never share this link with anyone
              </p>
            </div>
            
            <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Request IP: ${req.ip || "Unknown"} • Time: ${new Date().toLocaleString()}<br>
                If you're having trouble with the button, copy and paste this URL: ${resetUrl}
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      message: "Failed to process password reset request",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    // Validate new password
    const passwordValidation = validateRegistrationData({
      password: newPassword,
    });
    if (passwordValidation.errors.password) {
      return res.status(400).json({
        message: "Password validation failed",
        errors: { password: passwordValidation.errors.password },
      });
    }

    // Find user with valid reset token
    const users = await User.find({
      resetPasswordExpires: { $gt: Date.now() },
    });

    let user = null;
    for (const u of users) {
      if (
        u.resetPasswordToken &&
        (await bcrypt.compare(token, u.resetPasswordToken))
      ) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const saltRounds = process.env.NODE_ENV === "production" ? 12 : 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordRequestedAt = undefined;
    user.resetPasswordIP = undefined;
    user.passwordChangedAt = new Date();
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
  completeVerification,
  registrationLimiter, // Export the rate limiter
};
