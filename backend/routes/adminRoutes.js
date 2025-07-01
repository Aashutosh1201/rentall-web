const express = require("express");
const {
  getAllProducts,
  deleteProduct,
  getKYCSubmissions,
  updateKYCStatus,
  respondToExtension,
  getExtensionRequests,
  getAllRentals,
} = require("../controllers/adminController");

const Category = require("../models/Category");

const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const { adminConfirmDelivery } = require("../controllers/adminController");
// Route to get all products

// ----- PRODUCT ROUTES -----
router.get("/products", getAllProducts);
router.delete("/products/:id", deleteProduct);

// ----- KYC ROUTES -----
router.get("/kyc", getKYCSubmissions);
router.patch("/kyc/:id", updateKYCStatus);

router.post(
  "/admin/confirm-delivery/:rentalId",
  verifyToken, // ✅ Protect this route with token or admin role
  adminConfirmDelivery
);

router.get("/rentals", getAllRentals);

router.post("/respond-extension/:rentalId", respondToExtension);

router.get("/extension-requests", getExtensionRequests);

// ----- CATEGORY ROUTES -----

// Get all categories (admin-only)
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// Add new category
router.post("/categories", async (req, res) => {
  try {
    const { label, icon, description } = req.body;

    // Check for duplicate label
    const exists = await Category.findOne({ label: { $regex: `^${label}$`, $options: "i" } });
    if (exists) {
      return res.status(400).json({ message: "Category label already exists." });
    }

    const newCategory = new Category({ label, icon, description });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({ message: "Failed to create category." });
  }
});

// Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Category not found." });
    res.status(200).json({ message: "Category deleted." });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category." });
  }
});

module.exports = router;
