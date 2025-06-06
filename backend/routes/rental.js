// Improved Backend API routes for rental creation
// routes/rentals.js (Express.js)

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const Rental = require("../models/Rental");
const Product = require("../models/Product");

// Function to generate unique purchase order ID
function generatePurchaseOrderId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `PO-${timestamp}-${random}`;
}

// Create rental after successful payment
router.post("/create", verifyToken, async (req, res) => {
  try {
    console.log("Creating rental with data:", req.body); // Debug log
    console.log("User from token:", req.user); // Debug log

    const {
      productId,
      startDate,
      endDate,
      totalAmount,
      paymentId, // pidx from Khalti
      transactionId,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      userId: req.user?.userId || req.user?.id,
      productId,
      startDate,
      endDate,
      totalAmount,
      paymentId,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missing: missingFields,
        received: req.body,
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // Check if rental already exists with this paymentId
    const existingRental = await Rental.findOne({ paymentId });
    if (existingRental) {
      return res.status(409).json({
        success: false,
        message: "Rental already exists for this payment",
        rental: existingRental,
      });
    }

    // Calculate rental days
    const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end days

    // Generate unique purchase order ID
    const purchaseOrderId = generatePurchaseOrderId();

    // Create rental with all required fields
    const rental = new Rental({
      userId: requiredFields.userId,
      productId,
      startDate: start,
      endDate: end,
      rentalDays,
      totalAmount: Number(totalAmount),
      paymentId,
      transactionId: transactionId || paymentId,
      purchaseOrderId, // Auto-generated unique purchase order ID
      status: "active",
      paymentStatus: "completed",
      createdAt: new Date(),
    });

    console.log("Saving rental:", rental); // Debug log
    const savedRental = await rental.save();
    console.log("Rental saved successfully:", savedRental._id); // Debug log

    res.status(201).json({
      success: true,
      message: "Rental created successfully",
      rental: savedRental,
    });
  } catch (error) {
    console.error("Rental creation error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate rental order. Please try again.",
        error: error.message,
      });
    }

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create rental",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get user's rentals
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    console.log("Fetching rentals for userId:", userId);

    // First, let's get rentals without population to see raw data
    const rawRentals = await Rental.find({ userId });
    console.log("Raw rentals found:", rawRentals.length);
    console.log("First raw rental:", rawRentals[0]);

    // Now get with population
    const rentals = await Rental.find({ userId })
      .populate({
        path: "productId",
        select:
          "title description imageUrl pricePerDay category location owner",
        options: { strictPopulate: false }, // This helps with missing references
      })
      .sort({ createdAt: -1 });

    console.log("Populated rentals found:", rentals.length);
    console.log("First populated rental:", rentals[0]);

    // Log each rental's product data
    rentals.forEach((rental, index) => {
      console.log(`Rental ${index + 1}:`);
      console.log("- Rental ID:", rental._id);
      console.log("- Product ID:", rental.productId);
      console.log("- Product populated:", !!rental.productId?.title);
      if (rental.productId) {
        console.log("- Product title:", rental.productId.title);
        console.log("- Product imageUrl:", rental.productId.imageUrl);
      }
    });

    // Add computed fields
    const rentalsWithStatus = rentals.map((rental) => {
      const now = new Date();
      const endDate = new Date(rental.endDate);
      const isOverdue = now > endDate && rental.status === "active";
      const daysRemaining =
        rental.status === "active"
          ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          : 0;

      return {
        ...rental.toObject(),
        isOverdue,
        daysRemaining,
      };
    });

    res.json({
      success: true,
      rentals: rentalsWithStatus,
    });
  } catch (error) {
    console.error("Error fetching rentals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rentals",
      error: error.message,
    });
  }
});

// Get rental by ID
router.get("/:rentalId", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const rental = await Rental.findOne({
      _id: req.params.rentalId,
      userId: userId,
    }).populate(
      "productId",
      "title description imageUrl pricePerDay category location owner"
    );

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    res.json({
      success: true,
      rental,
    });
  } catch (error) {
    console.error("Error fetching rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rental",
      error: error.message,
    });
  }
});

// Update rental status
router.patch("/:rentalId/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user?.userId || req.user?.id;

    const rental = await Rental.findOneAndUpdate(
      { _id: req.params.rentalId, userId: userId },
      { status },
      { new: true }
    ).populate(
      "productId",
      "title description imageUrl pricePerDay category location owner"
    );

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    res.json({
      success: true,
      rental,
    });
  } catch (error) {
    console.error("Error updating rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update rental",
      error: error.message,
    });
  }
});

module.exports = router;
