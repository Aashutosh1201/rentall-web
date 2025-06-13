const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const KYC = require("../models/KYC");
const User = require("../models/User");
const cloudinary = require("../config/claudinary");
const router = express.Router();

const upload = multer({ dest: "temp/" });

router.post(
  "/",
  upload.fields([{ name: "idDocument" }, { name: "selfie" }]),
  async (req, res) => {
    try {
      const { email, fullName, dob, phone, address, idType, idNumber } =
        req.body;

      if (!email) return res.status(400).json({ message: "Email is required" });

      // Prevent duplicate KYC
      const existing = await KYC.findOne({ email });
      if (existing) {
        return res
          .status(409)
          .json({ message: "KYC already submitted for this email." });
      }

      if (!req.files || !req.files.idDocument || !req.files.selfie) {
        return res
          .status(400)
          .json({ message: "Both ID document and selfie files are required." });
      }

      // Upload to Cloudinary
      let idDocUrl, selfieUrl;
      try {
        const idDocUpload = await cloudinary.uploader.upload(
          req.files.idDocument[0].path,
          { folder: "rentall/kyc/idDocs" }
        );
        idDocUrl = idDocUpload.secure_url;

        const selfieUpload = await cloudinary.uploader.upload(
          req.files.selfie[0].path,
          { folder: "rentall/kyc/selfies" }
        );
        selfieUrl = selfieUpload.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res
          .status(500)
          .json({ message: "Failed to upload documents. Try again." });
      }

      const newKYC = new KYC({
        email,
        fullName,
        dob,
        phone,
        address,
        idType,
        idNumber,
        idDocumentPath: idDocUrl,
        selfiePath: selfieUrl,
      });

      await newKYC.save();

      // Optionally update phone if needed
      const user = await User.findOne({ email });
      if (user && user.phone === "not provided") {
        user.phone = phone;
        await user.save();
      }

      res.status(201).json({ message: "KYC submitted successfully." });
    } catch (err) {
      console.error("KYC error:", err);
      res.status(500).json({ message: "Server error", detail: err.message });
    }
  }
);

router.get("/detail/:email", async (req, res) => {
  try {
    const kyc = await KYC.findOne({ email: req.params.email });
    if (!kyc) return res.status(404).json({ message: "No KYC found" });
    res.json({ kyc });
  } catch (err) {
    console.error("KYC detail error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/status/:email", async (req, res) => {
  try {
    const kyc = await KYC.findOne({ email: req.params.email });
    if (kyc) {
      return res.json({ exists: true, status: kyc.status });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
