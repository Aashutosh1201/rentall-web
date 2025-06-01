const express = require("express");
const router = express.Router();
const { createRental } = require("../controllers/rentalController");
const verifyToken = require("../middleware/authMiddleware");

// Protect this route so only logged-in users can rent
router.post("/", verifyToken, createRental);

module.exports = router;
