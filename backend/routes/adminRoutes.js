const express = require("express");
const {
  getAllProducts,
  deleteProduct,
  getKYCSubmissions,
  updateKYCStatus,
} = require("../controllers/adminController");

const router = express.Router();

// Route to get all products
router.get("/products", getAllProducts);

// Route to delete a product by ID
router.delete("/products/:id", deleteProduct);

// Route to get all KYC submissions
router.get("/kyc", getKYCSubmissions);

// Route to update KYC status
router.put("/kyc/:id", updateKYCStatus);

module.exports = router;
