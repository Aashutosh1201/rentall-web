const User = require("../models/User");
const nodemailer = require("nodemailer");
const plivo = require("plivo");

// Initialize Plivo client
const plivoClient = new plivo.Client(
  process.env.PLIVO_AUTH_ID,
  process.env.PLIVO_AUTH_TOKEN
);

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

// Enhanced Mock SMS service for testing
const sendMockSMS = async (phone, message, otp) => {
  console.log("\n" + "=".repeat(60));
  console.log("📱 MOCK SMS SERVICE - DEVELOPMENT MODE");
  console.log("=".repeat(60));
  console.log(`📞 TO: ${phone}`);
  console.log(`💬 MESSAGE: ${message}`);
  console.log(`🔑 OTP CODE: ${otp}`);
  console.log("=".repeat(60));
  console.log("⚠️  COPY THIS OTP FOR TESTING: " + otp);
  console.log("=".repeat(60) + "\n");

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return Promise.resolve({
    success: true,
    messageId: "mock_" + Date.now(),
    status: "sent",
  });
};

// Format phone number for Plivo (ensure it includes country code)
const formatPhoneNumber = (phone) => {
  // Remove any spaces, dashes, or parentheses
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

  // If phone starts with 0, replace with +977 (Nepal country code)
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "+977" + cleanPhone.substring(1);
  }
  // If phone doesn't start with +, add +977
  else if (!cleanPhone.startsWith("+")) {
    cleanPhone = "+977" + cleanPhone;
  }

  return cleanPhone;
};

// Send Email OTP
const sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    const emailVerificationOTP = generateOTP();
    const emailVerificationOTPExpires = Date.now() + 600000; // 10 minutes

    user.emailVerificationOTP = emailVerificationOTP;
    user.emailVerificationOTPExpires = emailVerificationOTPExpires;
    await user.save();

    const mailOptions = {
      from: `"RentALL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification Code - RentALL",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">RentALL</h1>
          <h2 style="color: #374151; text-align: center;">Email Verification</h2>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <p>Hello ${user.fullName},</p>
            <p>Your email verification code is:</p>
            <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 20px 0;">${emailVerificationOTP}</h1>
            <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes</p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Verification code sent to your email",
      ...(process.env.NODE_ENV === "development" && {
        otp: emailVerificationOTP,
      }),
    });
  } catch (error) {
    console.error("Send Email OTP Error:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

// Verify Email OTP
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    user.emailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;

    if (user.phoneVerified) user.isActive = true;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully",
      emailVerified: true,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
      nextStep: user.isActive ? "login" : "phone_verification",
    });
  } catch (error) {
    console.error("Verify Email OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send SMS OTP using Plivo
const sendSMSVerification = async (req, res) => {
  console.log("🚀 SMS VERIFICATION FUNCTION CALLED");
  console.log("📱 Request body:", req.body);

  try {
    const { phone } = req.body;

    console.log("📞 Phone number received:", phone);

    const user = await User.findOne({ phone });
    console.log("👤 User found:", user ? "YES" : "NO");

    if (!user) {
      console.log("❌ User not found for phone:", phone);
      return res.status(404).json({ message: "User not found" });
    }

    if (user.phoneVerified) {
      console.log("✅ Phone already verified for:", phone);
      return res.status(400).json({ message: "Phone already verified" });
    }

    const phoneVerificationOTP = generateOTP();
    console.log("🔑 GENERATED OTP:", phoneVerificationOTP);
    console.log("🔑 GENERATED OTP:", phoneVerificationOTP);
    console.log("🔑 GENERATED OTP:", phoneVerificationOTP);

    const phoneVerificationExpires = Date.now() + 600000; // 10 minutes

    user.phoneVerificationOTP = phoneVerificationOTP;
    user.phoneVerificationExpires = phoneVerificationExpires;
    await user.save();

    console.log("💾 OTP saved to database:", phoneVerificationOTP);

    const message = `Your RentALL verification code is: ${phoneVerificationOTP}. Expires in 10 minutes.`;

    // FORCE CONSOLE LOGGING - This will ALWAYS run
    console.log("\n" + "=".repeat(80));
    console.log("🚨 DEVELOPMENT MODE - SMS OTP GENERATED 🚨");
    console.log("=".repeat(80));
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 OTP CODE: ${phoneVerificationOTP}`);
    console.log(`💬 Message: ${message}`);
    console.log(`⏰ Expires: ${new Date(phoneVerificationExpires)}`);
    console.log("=".repeat(80));
    console.log("🎯 COPY THIS OTP: " + phoneVerificationOTP);
    console.log("=".repeat(80) + "\n");

    // Check environment and Plivo configuration
    console.log("🔧 Environment check:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("USE_MOCK_SMS:", process.env.USE_MOCK_SMS);
    console.log(
      "PLIVO_AUTH_ID:",
      process.env.PLIVO_AUTH_ID ? "SET" : "NOT SET"
    );
    console.log(
      "PLIVO_AUTH_TOKEN:",
      process.env.PLIVO_AUTH_TOKEN ? "SET" : "NOT SET"
    );

    // Always use mock mode in development
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV !== "production";
    const useMockSMS =
      process.env.USE_MOCK_SMS === "true" ||
      isDevelopment ||
      !process.env.PLIVO_AUTH_ID;

    console.log("🎛️ Will use mock SMS:", useMockSMS);

    if (useMockSMS) {
      console.log("📧 Using MOCK SMS mode");

      // Enhanced mock SMS with multiple log formats
      console.log("\n📱 MOCK SMS SENT:");
      console.log("To:", phone);
      console.log("Message:", message);
      console.log("OTP:", phoneVerificationOTP);

      // Alternative log format
      console.table({
        Phone: phone,
        OTP: phoneVerificationOTP,
        Message: message,
        Expires: new Date(phoneVerificationExpires).toLocaleString(),
      });

      return res.status(200).json({
        success: true,
        message: "Verification code sent via MOCK SMS (check console)",
        otp: phoneVerificationOTP,
        mockMode: true,
        phone: phone,
        expiresAt: new Date(phoneVerificationExpires).toISOString(),
      });
    }

    // Real SMS sending logic (if not using mock)
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log(`📞 Sending real SMS to: ${formattedPhone}`);

      const response = await plivoClient.messages.create(
        process.env.PLIVO_PHONE_NUMBER || "RentALL",
        formattedPhone,
        message
      );

      console.log("✅ Plivo SMS sent successfully:", response);

      res.status(200).json({
        success: true,
        message: "Verification code sent to your phone",
        ...(isDevelopment && { otp: phoneVerificationOTP }),
      });
    } catch (smsError) {
      console.error("❌ Real SMS failed:", smsError);

      // Fallback to mock on SMS failure
      console.log("🔄 Falling back to mock SMS due to error");
      console.log("🔑 FALLBACK OTP:", phoneVerificationOTP);

      res.status(200).json({
        success: true,
        message: "OTP generated (SMS service unavailable - check console)",
        otp: phoneVerificationOTP,
        mockMode: true,
        error: "SMS service unavailable",
      });
    }
  } catch (error) {
    console.error("💥 CRITICAL ERROR in sendSMSVerification:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Failed to send verification code",
      error: error.message,
    });
  }
};

// Verify Phone OTP
const verifyPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Log the verification attempt for debugging
    console.log(`\n🔍 Phone OTP Verification Attempt:`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 Entered OTP: ${otp}`);

    const user = await User.findOne({
      phone,
      phoneVerificationOTP: otp,
      phoneVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Check if user exists but OTP is wrong/expired
      const userExists = await User.findOne({ phone });
      if (userExists) {
        console.log(
          `❌ Invalid/Expired OTP. Expected: ${userExists.phoneVerificationOTP}, Got: ${otp}`
        );
        console.log(
          `⏰ OTP Expires: ${new Date(userExists.phoneVerificationExpires)}, Now: ${new Date()}`
        );
      }

      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    console.log(`✅ Phone OTP verification successful for ${phone}`);

    user.phoneVerified = true;
    user.phoneVerificationOTP = undefined;
    user.phoneVerificationExpires = undefined;

    if (user.emailVerified) user.isActive = true;
    await user.save();

    res.status(200).json({
      message: "Phone verified successfully",
      emailVerified: user.emailVerified,
      phoneVerified: true,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Verify Phone Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).select(
      "fullName email phone emailVerified phoneVerified isActive"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      user: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Get Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendEmailVerification,
  verifyEmailOTP,
  sendSMSVerification,
  verifyPhone,
  getVerificationStatus,
};
