const User = require("../models/User");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Initialize services
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
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

// Send SMS OTP
const sendSMSVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.phoneVerified)
      return res.status(400).json({ message: "Phone already verified" });

    const phoneVerificationOTP = generateOTP();
    const phoneVerificationExpires = Date.now() + 600000; // 10 minutes

    user.phoneVerificationOTP = phoneVerificationOTP;
    user.phoneVerificationExpires = phoneVerificationExpires;
    await user.save();

    try {
      await twilioClient.messages.create({
        body: `Your RentALL verification code is: ${phoneVerificationOTP}. Expires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      res.status(200).json({
        message: "Verification code sent to your phone",
        ...(process.env.NODE_ENV === "development" && {
          otp: phoneVerificationOTP,
        }),
      });
    } catch (twilioError) {
      console.error("SMS Error:", twilioError);
      if (process.env.NODE_ENV === "development") {
        res.status(200).json({
          message: "OTP generated (check console)",
          otp: phoneVerificationOTP,
        });
      } else {
        res.status(500).json({ message: "Failed to send SMS" });
      }
    }
  } catch (error) {
    console.error("Send SMS Error:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

// Verify Phone OTP
const verifyPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({
      phone,
      phoneVerificationOTP: otp,
      phoneVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

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
