const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Request = require("../models/Request");
const { verifyToken } = require("../middleware/authMiddleware");
const cloudinary = require("../config/claudinary");

// Temporary local storage before Cloudinary upload
const upload = multer({ dest: "temp/" });

/**
 * POST /api/requests - Create a new request with optional image
 */
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, location, category, needDates } = req.body;

    if (!name || !description || !price || !location || !category || !needDates?.length) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let imageUrl = null;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "rentall/request-images",
        });
        imageUrl = result.secure_url;
      } catch (err) {
        console.error("Cloudinary image upload failed:", err);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const request = new Request({
      name,
      description,
      price,
      location,
      category,
      image: imageUrl,
      needDates,
      user: req.user.id,
    });

    await request.save();
    res.status(201).json(request);
  } catch (err) {
    console.error("Request creation failed:", err);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * GET /api/requests - Fetch all requests
 */
router.get("/", async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Fetching requests failed:", err);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * GET /api/requests/:id - Fetch one request by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("user", "fullName email");
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json(request);
  } catch (err) {
    console.error("Fetching request failed:", err);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * POST /api/requests/:id/counter - Submit a counter-offer with optional image
 */
router.post("/:id/counter", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { price, message } = req.body;
    const requestId = req.params.id;

    if (!price) {
      return res.status(400).json({ message: "Price is required" });
    }

    let imageUrl = null;

    // Upload image to Cloudinary if available
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "rentall/counter-offers",
        });
        imageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const offer = {
      user: req.user.id,
      price,
      message,
      image: imageUrl,
      createdAt: new Date(),
    };

    request.counterOffers.push(offer);
    await request.save();

    res.status(201).json({ message: "Counter offer submitted", offer });
  } catch (err) {
    console.error("Counter offer failed:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
