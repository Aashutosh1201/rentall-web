const User = require("../models/User");
const TempUser = require("../models/TempUser"); // Add this import
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

// Send Email OTP
const sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const tempUser = await TempUser.findOne({ email });

    if (!tempUser)
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });
    if (tempUser.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    const emailVerificationOTP = generateOTP();
    const emailVerificationOTPExpires = Date.now() + 600000; // 10 minutes

    tempUser.emailVerificationOTP = emailVerificationOTP;
    tempUser.emailVerificationOTPExpires = emailVerificationOTPExpires;
    await tempUser.save();

    const mailOptions = {
      from: `"RentALL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification Code - RentALL",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">RentALL</h1>
          <h2 style="color: #374151; text-align: center;">Email Verification</h2>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
            <p>Hello ${tempUser.fullName},</p>
            <p>Your email verification code is:</p>
            <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 20px 0;">${emailVerificationOTP}</h1>
            <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes</p>
          </div>
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

    const tempUser = await TempUser.findOne({
      email,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: { $gt: Date.now() },
    });

    if (!tempUser) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    tempUser.emailVerified = true;
    tempUser.emailVerificationOTP = undefined;
    tempUser.emailVerificationOTPExpires = undefined;
    await tempUser.save();

    // Check if both email and phone are verified
    if (tempUser.emailVerified && tempUser.phoneVerified) {
      await moveToMainUserCollection(tempUser);
      return res.status(200).json({
        message: "Account fully verified! You can now login.",
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        nextStep: "login",
      });
    }

    res.status(200).json({
      message: "Email verified successfully",
      emailVerified: true,
      phoneVerified: tempUser.phoneVerified,
      isActive: true,
      nextStep: "phone_verification",
    });
  } catch (error) {
    console.error("Verify Email OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send SMS OTP
const sendSMSVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    const tempUser = await TempUser.findOne({ phone });

    if (!tempUser)
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });
    if (tempUser.phoneVerified)
      return res.status(400).json({ message: "Phone already verified" });

    const phoneVerificationOTP = generateOTP();
    const phoneVerificationExpires = Date.now() + 600000; // 10 minutes

    tempUser.phoneVerificationOTP = phoneVerificationOTP;
    tempUser.phoneVerificationExpires = phoneVerificationExpires;
    await tempUser.save();

    const message = `Your RentALL verification code is: ${phoneVerificationOTP}. Expires in 10 minutes.`;

    // Development mode - show OTP in console
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "=".repeat(80));
      console.log("🚨 DEVELOPMENT MODE - SMS OTP GENERATED 🚨");
      console.log("=".repeat(80));
      console.log(`📱 Phone: ${phone}`);
      console.log(`🔑 OTP CODE: ${phoneVerificationOTP}`);
      console.log("=".repeat(80) + "\n");

      return res.status(200).json({
        success: true,
        message: "Verification code sent via MOCK SMS (check console)",
        otp: phoneVerificationOTP,
        mockMode: true,
      });
    }

    // Production mode - send real SMS
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+977${phone}`;
      await plivoClient.messages.create(
        process.env.PLIVO_PHONE_NUMBER || "RentALL",
        formattedPhone,
        message
      );

      res.status(200).json({
        success: true,
        message: "Verification code sent to your phone",
      });
    } catch (smsError) {
      console.error("SMS Error:", smsError);
      res.status(200).json({
        success: true,
        message: "OTP generated (SMS service unavailable - check console)",
        otp: phoneVerificationOTP,
        mockMode: true,
      });
    }
  } catch (error) {
    console.error("Send SMS OTP Error:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

// Verify Phone OTP
const verifyPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const tempUser = await TempUser.findOne({
      phone,
      phoneVerificationOTP: otp,
      phoneVerificationExpires: { $gt: Date.now() },
    });

    if (!tempUser) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    tempUser.phoneVerified = true;
    tempUser.phoneVerificationOTP = undefined;
    tempUser.phoneVerificationExpires = undefined;
    await tempUser.save();

    // Check if both email and phone are verified
    if (tempUser.emailVerified && tempUser.phoneVerified) {
      await moveToMainUserCollection(tempUser);
      return res.status(200).json({
        message: "Account fully verified! You can now login.",
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        nextStep: "login",
      });
    }

    res.status(200).json({
      message: "Phone verified successfully",
      emailVerified: tempUser.emailVerified,
      phoneVerified: true,
      isActive: true,
      nextStep: "email_verification",
    });
  } catch (error) {
    console.error("Verify Phone Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to move verified user to main collection
const moveToMainUserCollection = async (tempUser) => {
  try {
    console.log("🔄 Moving verified user to main User collection");

    // Create user in main collection
    const newUser = new User({
      fullName: tempUser.fullName,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
    });

    await newUser.save();
    console.log("✅ User moved to main collection:", newUser._id);

    // Remove from temp collection
    await TempUser.deleteOne({ _id: tempUser._id });
    console.log("🗑️ Removed from temp collection");

    return newUser;
  } catch (error) {
    console.error("❌ Error moving user to main collection:", error);
    throw error;
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const { email } = req.params;

    // First check in main User collection
    const user = await User.findOne({ email }).select(
      "fullName email phone emailVerified phoneVerified isActive"
    );
    if (user) {
      return res.status(200).json({
        user: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isActive: user.isActive,
      });
    }

    // Then check in TempUser collection
    const tempUser = await TempUser.findOne({ email }).select(
      "fullName email phone emailVerified phoneVerified"
    );
    if (!tempUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        fullName: tempUser.fullName,
        email: tempUser.email,
        phone: tempUser.phone,
      },
      emailVerified: tempUser.emailVerified,
      phoneVerified: tempUser.phoneVerified,
      isActive: false, // TempUsers are never active
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
