const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const KYC = require("../models/KYC");

const router = express.Router();

// Ensure KYC folder exists
const kycDir = path.join("KYC");
if (!fs.existsSync(kycDir)) {
  fs.mkdirSync(kycDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "KYC/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post(
  "/",
  upload.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, dob, phone, address, idType, idNumber } = req.body;

      const idDocumentPath = req.files?.idDocument?.[0]?.path;
      const selfiePath = req.files?.selfie?.[0]?.path;

      if (!idDocumentPath || !selfiePath) {
        return res.status(400).json({ error: "Both files are required." });
      }

      const newKYC = new KYC({
        fullName,
        dob,
        phone,
        address,
        idType,
        idNumber,
        idDocumentPath,
        selfiePath,
      });

      await newKYC.save();
      res.status(200).json({ message: "KYC submitted successfully." });
    } catch (err) {
      console.error("KYC Error:", err);
      res.status(500).json({ error: "Something went wrong." });
    }
  }
);

module.exports = router;
