// Improved Backend API routes for rental creation
// routes/rentals.js (Express.js)

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const checkKYC = require("../middleware/checkKYC");
const Rental = require("../models/Rental");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");

// Function to generate unique purchase order ID
function generatePurchaseOrderId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `PO-${timestamp}-${random}`;
}

// Create rental after successful payment
router.post("/create", verifyToken, checkKYC, async (req, res) => {
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

    // Check for date overlap with existing rentals for the same product
    const overlappingRental = await Rental.findOne({
      productId,
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (overlappingRental) {
      return res.status(409).json({
        success: false,
        message: "This item is already rented during the selected period.",
        conflictRental: overlappingRental,
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
      renter: req.user.id,
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

    await Cart.updateOne(
      { user: req.user.id },
      { $pull: { items: { product: productId } } }
    );

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

    // Fetch rentals by user, populate product info
    const rentals = await Rental.find({ userId })
      .populate({
        path: "productId",
        select:
          "title description imageUrl pricePerDay category location owner",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 });

    console.log("Populated rentals found:", rentals.length);

    const transformedRentals = rentals.map((rental) => {
      const now = new Date();
      const endDate = new Date(rental.endDate);
      const isOverdue = now > endDate && rental.status === "active";
      const daysRemaining =
        rental.status === "active"
          ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          : 0;

      const rentalObj = rental.toObject();

      return {
        ...rentalObj,
        product: rentalObj.productId, // rename for frontend compatibility
        productId: rentalObj.productId?._id || rentalObj.productId,
        isOverdue,
        daysRemaining,

        // Add dummy renter field to satisfy MyOrders table UI
        renter: {
          name: "You",
          email: req.user.email || "you@example.com",
        },
      };
    });

    res.json({
      success: true,
      rentals: transformedRentals,
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
    }).populate({
      path: "productId",
      select: "title description imageUrl pricePerDay category location owner",
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    // Transform for frontend compatibility
    const rentalObj = rental.toObject();
    const transformedRental = {
      ...rentalObj,
      product: rentalObj.productId,
      productId: rentalObj.productId?._id || rentalObj.productId,
    };

    res.json({
      success: true,
      rental: transformedRental,
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
    ).populate({
      path: "productId",
      select: "title description imageUrl pricePerDay category location owner",
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental not found",
      });
    }

    // Transform for frontend compatibility
    const rentalObj = rental.toObject();
    const transformedRental = {
      ...rentalObj,
      product: rentalObj.productId,
      productId: rentalObj.productId?._id || rentalObj.productId,
    };

    res.json({
      success: true,
      rental: transformedRental,
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

// Get rentals with filtering by status
router.get("/status/:status", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { status } = req.params;

    let query = { userId };

    // Add status filter if not 'all'
    if (status !== "all") {
      if (status === "overdue") {
        // For overdue, we need to check dates
        query.status = "active";
        query.endDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    const rentals = await Rental.find(query)
      .populate({
        path: "productId",
        select:
          "title description imageUrl pricePerDay category location owner",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 });

    // Transform the data
    const transformedRentals = rentals.map((rental) => {
      const now = new Date();
      const endDate = new Date(rental.endDate);
      const isOverdue = now > endDate && rental.status === "active";
      const daysRemaining =
        rental.status === "active"
          ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          : 0;

      const rentalObj = rental.toObject();

      return {
        ...rentalObj,
        product: rentalObj.productId,
        isOverdue,
        daysRemaining,
        productId: rentalObj.productId?._id || rentalObj.productId,
      };
    });

    res.json({
      success: true,
      rentals: transformedRentals,
    });
  } catch (error) {
    console.error("Error fetching filtered rentals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rentals",
      error: error.message,
    });
  }
});

router.get("/by-payment/:paymentId", verifyToken, async (req, res) => {
  try {
    const rental = await Rental.findOne({ paymentId: req.params.paymentId });
    if (rental) {
      return res.json({ exists: true, rentalId: rental._id });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking rental:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/hasRented/:productId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const productId = req.params.productId;

    console.log("=== RENTAL CHECK DEBUG ===");
    console.log("userId from token:", userId);
    console.log("productId:", productId);

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing user or product ID" });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Simplified query - only check userId since that's what exists in your DB
    const rental = await Rental.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      status: { $in: ["active", "completed"] },
    });

    console.log("Rental found:", rental ? "YES" : "NO");
    if (rental) {
      console.log("Rental details:", {
        id: rental._id,
        userId: rental.userId,
        productId: rental.productId,
        status: rental.status,
      });
    }

    const hasRented = !!rental;
    console.log("Final result:", hasRented);

    return res.json({
      hasRented,
      debug: {
        searchUserId: userId,
        searchProductId: productId,
        found: !!rental,
      },
    });
  } catch (err) {
    console.error("Rental check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conflict-check", verifyToken, async (req, res) => {
  try {
    const { productId, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!productId || isNaN(start) || isNaN(end)) {
      return res
        .status(400)
        .json({ message: "Invalid rental period or product." });
    }

    const conflict = await Rental.findOne({
      productId,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    if (conflict) {
      const availableFrom = new Date(conflict.endDate);
      availableFrom.setDate(availableFrom.getDate() + 1);

      return res.status(409).json({
        message: "This item is already rented for the selected dates.",
        hint: `Try booking after ${availableFrom.toLocaleDateString()}.`,
      });
    }

    return res.json({ available: true });
  } catch (err) {
    console.error("Conflict check error:", err);
    res
      .status(500)
      .json({ message: "Server error while checking rental conflict." });
  }
});

module.exports = router;
