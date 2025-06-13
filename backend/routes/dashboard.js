// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // Adjust path as needed
const Rental = require("../models/Rental"); // Adjust path as needed
const User = require("../models/User"); // Adjust path as needed
const { verifyToken } = require("../middleware/authMiddleware"); // Your verifyToken middleware

// GET /api/dashboard/stats - Get dashboard statistics
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total products count for the user
    const totalProducts = await Product.countDocuments({ owner: userId });

    // Get active orders (rentals) for user's products
    const activeOrders = await Rental.countDocuments({
      product: { $in: await Product.find({ owner: userId }).select("_id") },
      status: "active",
    });

    // Get pending reviews (rentals awaiting review)
    const pendingReviews = await Rental.countDocuments({
      product: { $in: await Product.find({ owner: userId }).select("_id") },
      status: "completed",
      reviewed: { $ne: true },
    });

    // Calculate total earnings from completed rentals
    const completedRentals = await Rental.find({
      product: { $in: await Product.find({ owner: userId }).select("_id") },
      status: "completed",
    });

    const totalEarnings = completedRentals.reduce((sum, rental) => {
      return sum + (rental.totalAmount || rental.amount || 0);
    }, 0);

    res.json({
      totalProducts,
      activeOrders,
      pendingReviews,
      totalEarnings,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching dashboard stats" });
  }
});

// GET /api/dashboard/orders - Get user's orders (rentals of their products)
router.get("/orders", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all products owned by the user
    const userProducts = await Product.find({ owner: userId }).select("_id");
    const productIds = userProducts.map((product) => product._id);

    // Find all rentals for these products
    const orders = await Rental.find({ product: { $in: productIds } })
      .populate("product", "name images")
      .populate("renter", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Dashboard orders error:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
});

// GET /api/dashboard/products - Get user's products
router.get("/products", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const products = await Product.find({ owner: userId }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (error) {
    console.error("Dashboard products error:", error);
    res.status(500).json({ message: "Server error while fetching products" });
  }
});

// PATCH /api/dashboard/rental/:rentalId/status - Update rental status
router.patch("/rental/:rentalId/status", verifyToken, async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Find the rental and check if user owns the product
    const rental = await Rental.findById(rentalId).populate("product");

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    if (rental.product.owner.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "UnverifyTokenorized to update this rental" });
    }

    // Update the rental status
    rental.status = status;
    await rental.save();

    // If status is completed, update product availability
    if (status === "completed") {
      const product = await Product.findById(rental.product._id);
      product.isAvailable = true;
      await product.save();
    } else if (status === "active") {
      const product = await Product.findById(rental.product._id);
      product.isAvailable = false;
      await product.save();
    }

    res.json(rental);
  } catch (error) {
    console.error("Update rental status error:", error);
    res
      .status(500)
      .json({ message: "Server error while updating rental status" });
  }
});

// DELETE /api/dashboard/product/:productId - Delete a product
router.delete("/product/:productId", verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Find the product and check ownership
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.owner.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "UnverifyTokenorized to delete this product" });
    }

    // Check if product has active rentals
    const activeRentals = await Rental.countDocuments({
      product: productId,
      status: "active",
    });

    if (activeRentals > 0) {
      return res.status(400).json({
        message: "Cannot delete product with active rentals",
      });
    }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
});

// GET /api/dashboard/recent-activities - Get recent activities
router.get("/recent-activities", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all products owned by the user
    const userProducts = await Product.find({ owner: userId }).select("_id");
    const productIds = userProducts.map((product) => product._id);

    // Get recent rentals
    const recentRentals = await Rental.find({ product: { $in: productIds } })
      .populate("product", "name")
      .populate("renter", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    const activities = recentRentals.map((rental) => ({
      id: rental._id,
      type: "rental",
      title: `New rental request for ${rental.product.name}`,
      description: `${rental.renter.name} requested to rent your product`,
      time: rental.createdAt,
      status: rental.status,
    }));

    res.json(activities);
  } catch (error) {
    console.error("Recent activities error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching recent activities" });
  }
});

module.exports = router;
