const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const CounterOffer = require("../models/CounterOffer");
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/requests - Create a new request
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description, price, location, category, needDates } = req.body;

    if (!name || !description || !price || !location || !category || !needDates?.length) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const request = new Request({
      name,
      description,
      price,
      location,
      category,
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

// GET /api/requests - Fetch all requests
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

// GET /api/requests/:id - Fetch one request by ID
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

// POST /api/requests/:id/counter - Submit a counter-offer
router.post("/:id/counter", verifyToken, async (req, res) => {
  try {
    const { price, message } = req.body;
    const requestId = req.params.id;

    if (!price) {
      return res.status(400).json({ message: "Price is required" });
    }

    const offer = new CounterOffer({
      request: requestId,
      user: req.user.id,
      price,
      message,
    });

    await offer.save();
    res.status(201).json({ message: "Counter offer submitted", offer });
  } catch (err) {
    console.error("Counter offer failed:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
