const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const KYC = require("../models/KYC");
const User = require("../models/User"); // ✅ Import User model

const router = express.Router();

// Ensure KYC folder exists
const kycDir = path.join("KYC");
if (!fs.existsSync(kycDir)) {
  fs.mkdirSync(kycDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, kycDir); // Save files to the KYC directory
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// POST route for KYC submissions
router.post(
  "/",
  upload.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, dob, phone, address, idType, idNumber, email } =
        req.body;

      const idDocumentPath = req.files?.idDocument?.[0]?.path;
      const selfiePath = req.files?.selfie?.[0]?.path;

      if (!idDocumentPath || !selfiePath) {
        return res.status(400).json({ error: "Both files are required." });
      }

      // ✅ Step 1: Save the KYC submission
      const newKYC = new KYC({
        fullName,
        dob,
        phone,
        address,
        idType,
        idNumber,
        idDocumentPath,
        selfiePath,
        status: "pending", // Default status
      });

      await newKYC.save();

      // ✅ Step 2: Update user phone number if it's still "not provided"
      if (email && phone) {
        try {
          const user = await User.findOne({ email });
          if (user && user.phone === "not provided") {
            user.phone = phone;
            await user.save();
            console.log("✅ User phone updated from KYC submission.");
          }
        } catch (err) {
          console.error("❌ Error updating user phone from KYC:", err);
        }
      }

      res.status(200).json({ message: "KYC submitted successfully." });
    } catch (err) {
      console.error("KYC Submission Error:", err);
      res.status(500).json({ error: "Something went wrong." });
    }
  }
);

// GET route to fetch all KYC submissions
router.get("/", async (req, res) => {
  try {
    const kycSubmissions = await KYC.find(); // Fetch all KYC submissions
    res.status(200).json(kycSubmissions);
  } catch (err) {
    console.error("KYC Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch KYC submissions." });
  }
});

// PATCH route to update KYC status
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["approved", "disapproved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updatedKYC = await KYC.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedKYC) {
      return res.status(404).json({ error: "KYC not found." });
    }

    res.status(200).json(updatedKYC);
  } catch (err) {
    console.error("KYC Update Error:", err);
    res.status(500).json({ error: "Failed to update KYC status." });
  }
});

module.exports = router;
