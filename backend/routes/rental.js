// routes/rental.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Rental = require("../models/Rental");

// Get all rentals for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query - Fixed: using userId instead of id
    const query = { userId: req.user.userId };
    if (status && status !== "all") {
      query.status = status;
    }

    // Execute query with pagination and populate product details
    const rentals = await Rental.find(query)
      .populate("productId", "title description imageUrl pricePerDay category")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Transform the response to match frontend expectations
    const transformedRentals = rentals.map((rental) => ({
      _id: rental._id,
      product: {
        _id: rental.productId._id,
        title: rental.productId.title,
        description: rental.productId.description,
        imageUrl: rental.productId.imageUrl,
        pricePerDay: rental.productId.pricePerDay,
        category: rental.productId.category,
      },
      rentalDays: rental.rentalDays,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalAmount: rental.totalAmount,
      status: rental.status,
      paymentMethod: rental.paymentMethod,
      paymentId: rental.paymentId,
      transactionId: rental.transactionId,
      purchaseOrderId: rental.purchaseOrderId,
      paymentStatus: rental.paymentStatus,
      returnDate: rental.returnDate,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
      isOverdue: rental.isOverdue,
      daysRemaining: rental.getDaysRemaining(),
    }));

    // Get total count for pagination
    const total = await Rental.countDocuments(query);

    res.json({
      rentals: transformedRentals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching rentals:", error);
    res.status(500).json({ message: "Failed to fetch rentals" });
  }
});

// Get a specific rental by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      userId: req.user.userId, // Fixed: using userId instead of id
    }).populate("productId", "title description imageUrl pricePerDay category");

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Transform the response
    const transformedRental = {
      _id: rental._id,
      product: {
        _id: rental.productId._id,
        title: rental.productId.title,
        description: rental.productId.description,
        imageUrl: rental.productId.imageUrl,
        pricePerDay: rental.productId.pricePerDay,
        category: rental.productId.category,
      },
      rentalDays: rental.rentalDays,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalAmount: rental.totalAmount,
      status: rental.status,
      paymentMethod: rental.paymentMethod,
      paymentId: rental.paymentId,
      transactionId: rental.transactionId,
      purchaseOrderId: rental.purchaseOrderId,
      paymentStatus: rental.paymentStatus,
      returnDate: rental.returnDate,
      notes: rental.notes,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
      isOverdue: rental.isOverdue,
      daysRemaining: rental.getDaysRemaining(),
    };

    res.json(transformedRental);
  } catch (error) {
    console.error("Error fetching rental:", error);
    res.status(500).json({ message: "Failed to fetch rental" });
  }
});

// Update rental status (for marking as returned, etc.)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "active",
      "returned",
      "cancelled",
      "overdue",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { status };

    // If marking as returned, set return date
    if (status === "returned") {
      updateData.returnDate = new Date();
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    const rental = await Rental.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId }, // Fixed: using userId instead of id
      updateData,
      { new: true }
    ).populate("productId", "title description imageUrl pricePerDay category");

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Transform the response
    const transformedRental = {
      _id: rental._id,
      product: {
        _id: rental.productId._id,
        title: rental.productId.title,
        description: rental.productId.description,
        imageUrl: rental.productId.imageUrl,
        pricePerDay: rental.productId.pricePerDay,
        category: rental.productId.category,
      },
      rentalDays: rental.rentalDays,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalAmount: rental.totalAmount,
      status: rental.status,
      paymentMethod: rental.paymentMethod,
      paymentId: rental.paymentId,
      transactionId: rental.transactionId,
      purchaseOrderId: rental.purchaseOrderId,
      paymentStatus: rental.paymentStatus,
      returnDate: rental.returnDate,
      notes: rental.notes,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
      isOverdue: rental.isOverdue,
      daysRemaining: rental.getDaysRemaining(),
    };

    res.json(transformedRental);
  } catch (error) {
    console.error("Error updating rental status:", error);
    res.status(500).json({ message: "Failed to update rental status" });
  }
});

// Get rental statistics for the user
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const userId = req.user.userId; // Fixed: using userId instead of id

    const stats = await Promise.all([
      Rental.countDocuments({ userId, status: "active" }),
      Rental.countDocuments({ userId, status: "returned" }),
      Rental.countDocuments({ userId, status: "overdue" }),
      Rental.countDocuments({ userId }),
      Rental.aggregate([
        { $match: { userId: req.user.userId } }, // Fixed: using userId instead of id
        { $group: { _id: null, totalSpent: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      active: stats[0],
      returned: stats[1],
      overdue: stats[2],
      total: stats[3],
      totalSpent: stats[4][0]?.totalSpent || 0,
    });
  } catch (error) {
    console.error("Error fetching rental stats:", error);
    res.status(500).json({ message: "Failed to fetch rental statistics" });
  }
});

module.exports = router;
